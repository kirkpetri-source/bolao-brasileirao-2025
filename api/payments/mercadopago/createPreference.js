import axios from 'axios';
import crypto from 'crypto';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

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

function baseUrlFromReq(req) {
  const origin = (req.headers.origin || '').toString();
  if (origin) return origin;
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  return host ? `${proto}://${host}` : process.env.PUBLIC_BASE_URL || '';
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }
    const { adminId, userId, roundId, amount, cartelaCodes = [], payer = {} } = req.body || {};
    if (!adminId || !userId || !roundId || !amount || amount <= 0 || cartelaCodes.length === 0) {
      res.status(400).json({ error: 'Missing required fields', details: { adminId, userId, roundId, amount, cartelaCodes } });
      return;
    }

    // Load admin connection info
    const adminSnap = await getDoc(doc(db, 'admins', adminId));
    if (!adminSnap.exists()) {
      res.status(400).json({ error: 'Administrador não encontrado ou não conectado.' });
      return;
    }
    const admin = adminSnap.data();
    if (!admin?.mercado_pago_connected || !admin?.mercado_pago_access_token) {
      res.status(400).json({ error: 'Administrador não possui conta Mercado Pago conectada.' });
      return;
    }
    const accessToken = decrypt(admin.mercado_pago_access_token) || null;
    if (!accessToken) {
      res.status(500).json({ error: 'Falha ao descriptografar token de acesso' });
      return;
    }

    // Create initial transaction
    const description = `Bolão ${roundId} • ${cartelaCodes.length} participação(ões)`;
    const txDoc = await addDoc(collection(db, 'transactions'), {
      adminId,
      userId,
      roundId,
      cartelaCodes,
      amount,
      status: 'pending',
      provider: 'mercadopago',
      method: 'checkout',
      createdAt: serverTimestamp(),
      meta: { description }
    });

    const baseUrl = baseUrlFromReq(req);
    const notificationUrl = baseUrl ? `${baseUrl}/api/payments/mercadopago/webhook?adminId=${encodeURIComponent(adminId)}` : undefined;

    const payload = {
      items: [
        { title: description, quantity: 1, unit_price: Number(amount), currency_id: 'BRL' }
      ],
      payer: {
        name: payer?.name || undefined,
        email: payer?.email || undefined,
      },
      external_reference: txDoc.id,
      notification_url: notificationUrl,
      statement_descriptor: 'Bolão Brasileirão 2025'
    };
    const headers = { Authorization: `Bearer ${accessToken}` };

    const mp = await axios.post('https://api.mercadopago.com/checkout/preferences', payload, { headers, timeout: 10000 });
    const pref = mp.data;

    await setDoc(doc(db, 'transactions', txDoc.id), {
      preferenceId: pref?.id || null,
      initPoint: pref?.init_point || null,
      sandboxInitPoint: pref?.sandbox_init_point || null,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    res.status(200).json({ id: txDoc.id, preferenceId: pref?.id, init_point: pref?.init_point });
  } catch (err) {
    const code = err?.response?.status || 500;
    res.status(code).json({ error: 'Failed to create checkout preference', message: err?.message || String(err) });
  }
}