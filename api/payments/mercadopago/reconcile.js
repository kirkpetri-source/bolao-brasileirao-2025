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

function decrypt(enc) {
  const keyB64 = process.env.TOKEN_ENCRYPTION_KEY || '';
  // Accept plain string tokens (for legacy/dev) and proper encrypted object
  if (typeof enc === 'string' && enc.trim()) return enc.trim();
  if (!keyB64 || !enc?.encrypted) return null;
  const key = Buffer.from(keyB64, 'base64');
  const iv = Buffer.from(enc.iv, 'base64');
  const tag = Buffer.from(enc.tag, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(Buffer.from(enc.encrypted, 'base64')), decipher.final()]).toString('utf8');
  return dec;
}

function resolveAccessToken(encFromAdmin) {
  const dec = decrypt(encFromAdmin);
  if (dec) return dec;
  const envToken = (process.env.MP_ACCESS_TOKEN || process.env.MP_ADMIN_ACCESS_TOKEN || '').trim();
  return envToken || null;
}

async function fetchPayment(id, adminAccessToken) {
  const url = `${MP_BASE}/v1/payments/${id}`;
  const headers = { Authorization: `Bearer ${adminAccessToken}` };
  const res = await axios.get(url, { headers, timeout: 10000 });
  return res.data;
}

async function markPredictionsPaid(userId, roundId, cartelaCodes) {
  if (!userId || !roundId || !Array.isArray(cartelaCodes) || cartelaCodes.length === 0) return;
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
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const id = (req.query?.id || '').toString();
    if (!id) {
      res.status(400).json({ error: 'Missing transaction id' });
      return;
    }

    const txSnap = await getDoc(doc(db, 'transactions', id));
    if (!txSnap.exists()) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    const txData = txSnap.data();
    const mpPaymentId = txData?.mpPaymentId;
    const adminId = txData?.adminId || null;
    if (!mpPaymentId) {
      res.status(400).json({ error: 'Transaction missing mpPaymentId' });
      return;
    }

    // Resolve admin access token
    let adminAccessToken = null;
    if (adminId) {
      const aSnap = await getDoc(doc(db, 'admins', adminId));
      const aData = aSnap.exists() ? aSnap.data() : null;
      adminAccessToken = aData?.mercado_pago_access_token ? resolveAccessToken(aData.mercado_pago_access_token) : null;
    }
    if (!adminAccessToken) {
      const envToken = (process.env.MP_ACCESS_TOKEN || process.env.MP_ADMIN_ACCESS_TOKEN || '').toString().trim();
      adminAccessToken = envToken || null;
    }
    if (!adminAccessToken) {
      res.status(500).json({ error: 'Mercado Pago admin access token unavailable' });
      return;
    }

    // Fetch latest payment state from Mercado Pago
    const payment = await fetchPayment(mpPaymentId, adminAccessToken);
    const status = payment?.status || 'unknown';

    await setDoc(txSnap.ref, {
      status,
      updatedAt: serverTimestamp(),
      meta: { ...txData.meta, lastReconcile: { status } }
    }, { merge: true });

    if (status === 'approved') {
      await markPredictionsPaid(txData.userId, txData.roundId, txData.cartelaCodes || []);
      await addDoc(collection(db, 'user_payments'), {
        userId: txData.userId,
        adminId: txData.adminId || adminId || null,
        roundId: txData.roundId,
        transactionId: id,
        amount: txData.amount,
        status: 'approved',
        provider: 'mercadopago', method: txData.method || 'pix',
        createdAt: serverTimestamp()
      });
    }

    res.status(200).json({ id, status });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}
