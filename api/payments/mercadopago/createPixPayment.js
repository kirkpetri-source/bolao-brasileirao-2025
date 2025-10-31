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
  // Try decrypting stored token first
  const dec = decrypt(encFromAdmin);
  if (dec) return dec;
  // Fallback to environment for local/dev testing
  const envToken = (process.env.MP_ACCESS_TOKEN || process.env.MP_ADMIN_ACCESS_TOKEN || '').trim();
  return envToken || null;
}

function baseUrlFromReq(req) {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString();
  if (host) return `${proto}://${host}`;
  const publicBase = (process.env.PUBLIC_BASE_URL || '').toString();
  if (publicBase) return publicBase;
  const origin = (req.headers.origin || '').toString();
  return origin || '';
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
    const accessToken = resolveAccessToken(admin.mercado_pago_access_token);
    if (!accessToken) {
      res.status(500).json({ 
        error: 'Token de acesso do administrador indisponível',
        hint: 'Defina TOKEN_ENCRYPTION_KEY e reconecte via OAuth, ou configure MP_ACCESS_TOKEN no ambiente para testes.'
      });
      return;
    }

    // Create initial transaction for PIX
    const description = `Bolão ${roundId} • ${cartelaCodes.length} participação(ões)`;
    const txDoc = await addDoc(collection(db, 'transactions'), {
      adminId,
      userId,
      roundId,
      cartelaCodes,
      amount,
      status: 'pending',
      provider: 'mercadopago',
      method: 'pix',
      createdAt: serverTimestamp(),
      meta: { description }
    });

    const baseUrl = baseUrlFromReq(req);
    const notificationUrl = baseUrl ? `${baseUrl}/api/payments/mercadopago/webhook?adminId=${encodeURIComponent(adminId)}` : undefined;

    // Create PIX payment
    const payload = {
      transaction_amount: Number(amount),
      description,
      payment_method_id: 'pix',
      external_reference: txDoc.id,
      notification_url: notificationUrl,
      payer: {
        // email é opcional no PIX — manter vazio para UX simples
        email: payer?.email || undefined,
        first_name: payer?.name || undefined,
      }
    };
    const headers = { Authorization: `Bearer ${accessToken}` };

    const mp = await axios.post('https://api.mercadopago.com/v1/payments', payload, { headers, timeout: 10000 });
    const payment = mp.data;

    const txData = {
      mpPaymentId: payment?.id || null,
      status: payment?.status || 'pending',
      pixCopiaECola: payment?.point_of_interaction?.transaction_data?.qr_code || null,
      qrCode: payment?.point_of_interaction?.transaction_data?.qr_code || null,
      qrCodeBase64: payment?.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      ticketUrl: payment?.point_of_interaction?.transaction_data?.ticket_url || null,
      expiration: payment?.date_of_expiration || null,
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'transactions', txDoc.id), txData, { merge: true });

    res.status(200).json({ id: txDoc.id, ...txData });
  } catch (err) {
    const code = err?.response?.status || 500;
    res.status(code).json({ error: 'Failed to create PIX payment', message: err?.message || String(err) });
  }
}
