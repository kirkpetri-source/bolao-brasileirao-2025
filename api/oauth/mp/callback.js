import axios from 'axios';
import crypto from 'crypto';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

function encrypt(value) {
  const keyB64 = process.env.TOKEN_ENCRYPTION_KEY || '';
  if (!keyB64) return { masked: value ? `${String(value).slice(0, 4)}***${String(value).slice(-4)}` : '' };
  const key = Buffer.from(keyB64, 'base64');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { encrypted: enc.toString('base64'), iv: iv.toString('base64'), tag: tag.toString('base64') };
}

async function exchangeCodeForToken({ code, redirectUri }) {
  const clientId = process.env.MP_CLIENT_ID;
  const clientSecret = process.env.MP_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Missing MP_CLIENT_ID/MP_CLIENT_SECRET');
  const url = 'https://api.mercadopago.com/oauth/token';
  const payload = {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  };
  const res = await axios.post(url, payload, { timeout: 10000 });
  return res.data;
}

async function fetchAccountInfo(userId, accessToken) {
  try {
    const url = `https://api.mercadopago.com/users/${userId}`;
    const res = await axios.get(url, { headers: { Authorization: `Bearer ${accessToken}` }, timeout: 10000 });
    return res.data;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }
    // Support both GET (OAuth redirect) and POST (server-side manual call)
    const code = (req.query.code || req.body?.code || '').toString();
    const state = (req.query.state || req.body?.state || '').toString(); // adminId
    const redirectUri = process.env.MP_OAUTH_REDIRECT_URL || `${req.headers.origin || ''}/api/oauth/mp/callback`;

    if (!code || !state) {
      res.status(400).json({ error: 'Missing code/state' });
      return;
    }

    const tokenData = await exchangeCodeForToken({ code, redirectUri });
    const accessToken = tokenData?.access_token;
    const refreshToken = tokenData?.refresh_token;
    const expiresIn = tokenData?.expires_in;
    const userId = tokenData?.user_id;

    if (!accessToken || !userId) {
      res.status(500).json({ error: 'OAuth failed', details: tokenData });
      return;
    }

    const encAccess = encrypt(accessToken);
    const encRefresh = refreshToken ? encrypt(refreshToken) : null;

    const account = await fetchAccountInfo(userId, accessToken);
    const mpEmail = account?.email || account?.default_address?.email || null;
    const mpNickname = account?.nickname || account?.first_name || null;

    await setDoc(doc(db, 'admins', state), {
      id: state,
      mercado_pago_user_id: userId,
      mercado_pago_connected: true,
      mercado_pago_access_token: encAccess,
      mercado_pago_refresh_token: encRefresh || undefined,
      mercado_pago_token_expires_in: expiresIn || null,
      mercado_pago_account: {
        email: mpEmail,
        nickname: mpNickname,
      },
      data_conexao: serverTimestamp()
    }, { merge: true });

    // Mark intent completed
    await setDoc(doc(db, 'admin_connect_intents', state), { status: 'completed', completedAt: serverTimestamp() }, { merge: true });

    // Respond with a small HTML auto-close page for better UX or JSON
    const wantsHtml = (req.headers['accept'] || '').toString().includes('text/html');
    if (wantsHtml) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.status(200).send(`<!doctype html><meta charset="utf-8"><title>Conta conectada</title><style>body{font-family:system-ui;padding:24px}</style><h2>Conta Mercado Pago conectada!</h2><p>Você já pode fechar esta janela.</p>`);
      return;
    }
    res.status(200).json({ ok: true, adminId: state, user_id: userId });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err?.message || String(err) });
  }
}