import axios from 'axios';
import crypto from 'crypto';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAZkL5Q4g1tAAVIZP4mhL6EyjLywjmyfX4",
  authDomain: "bolao-brasileirao-2025-d412c.firebaseapp.com",
  projectId: "bolao-brasileirao-2025-d412c",
  storageBucket: "bolao-brasileirao-2025-d412c.firebasestorage.app",
  messagingSenderId: "340924799165",
  appId: "1:340924799165:web:32447b166b1cb665a3bfd4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MP_BASE = 'https://api.mercadopago.com';
const WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || '';
const ALLOWED_IPS = (process.env.MP_ALLOWED_IPS || '').split(',').map(s => s.trim()).filter(Boolean);

function decrypt(enc) {
  const keyB64 = process.env.TOKEN_ENCRYPTION_KEY || '';
  if (!keyB64 || !enc?.encrypted) return null;
  const key = Buffer.from(keyB64, 'base64');
  const iv = Buffer.from(enc.iv, 'base64');
  const tag = Buffer.from(enc.tag, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(Buffer.from(enc.encrypted, 'base64')), decipher.final()]).toString('utf8');
  return dec;
}

function safeLog(obj) {
  // mask critical values
  const str = JSON.stringify(obj, (key, val) => {
    if (typeof val === 'string' && (val.length > 40)) return `${val.slice(0, 6)}***${val.slice(-4)}`;
    return val;
  });
  return str;
}

function verifySignature(req, rawBody) {
  const sigHeader = req.headers['x-signature'] || req.headers['x-hub-signature'];
  if (!sigHeader || !WEBHOOK_SECRET) return true; // skip verification if secret is not set
  const raw = typeof rawBody === 'string' ? rawBody : JSON.stringify(req.body || {});
  let expected = '';
  try {
    const h = crypto.createHmac('sha256', WEBHOOK_SECRET);
    h.update(raw, 'utf8');
    expected = h.digest('hex');
  } catch {
    return false;
  }
  const provided = String(sigHeader).includes('sha256=') ? String(sigHeader).split('sha256=')[1] : String(sigHeader);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

function ipAllowed(req) {
  if (ALLOWED_IPS.length === 0) return true;
  const fwd = (req.headers['x-forwarded-for'] || '').toString();
  const ip = fwd.split(',')[0]?.trim() || (req.connection && req.connection.remoteAddress) || '';
  return ALLOWED_IPS.includes(ip);
}

async function fetchPayment(id, adminAccessToken) {
  const url = `${MP_BASE}/v1/payments/${id}`;
  const headers = { Authorization: `Bearer ${adminAccessToken}` };
  const res = await axios.get(url, { headers, timeout: 10000 });
  return res.data;
}

async function markPredictionsPaid(userId, roundId, cartelaCodes) {
  if (!userId || !roundId || !Array.isArray(cartelaCodes) || cartelaCodes.length === 0) return;
  // Mark all predictions for given cartelas as paid
  const q = query(collection(db, 'predictions'), where('userId', '==', userId), where('roundId', '==', roundId));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const data = d.data();
    if (cartelaCodes.includes(data.cartelaCode)) {
      await updateDoc(doc(db, 'predictions', d.id), { paid: true });
    }
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }
    if (!ipAllowed(req)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    // Best-effort raw body
    let raw = '';
    try {
      await new Promise((resolve) => {
        req.setEncoding('utf8');
        req.on('data', (chunk) => { raw += chunk; });
        req.on('end', resolve);
      });
    } catch {}

    if (!verifySignature(req, raw)) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    const event = req.body || (raw ? JSON.parse(raw) : {});
    const topic = event?.type || event?.topic || 'unknown';
    const paymentId = event?.data?.id || event?.id || null;
    const xRequestId = req.headers['x-request-id'] || null;
    const adminId = (req.query?.adminId || '').toString();

    await addDoc(collection(db, 'webhook_logs'), {
      provider: 'mercadopago', topic, paymentId, xRequestId,
      receivedAt: serverTimestamp(), raw: safeLog(event)
    });

    if (!paymentId) {
      res.status(200).json({ message: 'Ack' });
      return;
    }

    // Determine admin access token
    let adminAccessToken = null;
    if (adminId) {
      const aSnap = await getDoc(doc(db, 'admins', adminId));
      const aData = aSnap.exists() ? aSnap.data() : null;
      adminAccessToken = aData?.mercado_pago_access_token ? decrypt(aData.mercado_pago_access_token) : null;
    }
    // Always fetch payment to trust source of truth (using admin token)
    const payment = await fetchPayment(paymentId, adminAccessToken);
    const status = payment?.status || 'unknown';
    const txId = payment?.external_reference || null; // optional usage

    // Find transaction by external_reference first, fallback to mpPaymentId
    let txRef = null;
    let txData = null;
    if (txId) {
      const txSnap = await getDoc(doc(db, 'transactions', txId));
      if (txSnap.exists()) { txRef = txSnap.ref; txData = txSnap.data(); }
    }
    if (!txRef) {
      const q = query(collection(db, 'transactions'), where('mpPaymentId', '==', paymentId));
      const snap = await getDocs(q);
      if (!snap.empty) { txRef = snap.docs[0].ref; txData = snap.docs[0].data(); }
    }
    if (!txRef) {
      await addDoc(collection(db, 'webhook_logs'), { provider: 'mercadopago', kind: 'orphan', paymentId, receivedAt: serverTimestamp() });
      res.status(200).json({ message: 'Ack' });
      return;
    }

    await setDoc(txRef, {
      status,
      updatedAt: serverTimestamp(),
      meta: { ...txData.meta, lastWebhook: { status } }
    }, { merge: true });

    if (status === 'approved') {
      await markPredictionsPaid(txData.userId, txData.roundId, txData.cartelaCodes || []);
      // create user payment history record
      await addDoc(collection(db, 'user_payments'), {
        userId: txData.userId,
        adminId: txData.adminId || adminId || null,
        roundId: txData.roundId,
        transactionId: txRef.id,
        amount: txData.amount,
        status: 'approved',
        provider: 'mercadopago', method: txData.method || 'checkout',
        createdAt: serverTimestamp()
      });
    }

    res.status(200).json({ message: 'Ack', status });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}