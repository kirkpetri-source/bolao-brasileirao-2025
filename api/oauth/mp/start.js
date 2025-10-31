import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase client SDK (following existing pattern in repo)
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

// Build authorization URL for Mercado Pago OAuth
function buildAuthUrl({ clientId, redirectUri, state }) {
  const base = 'https://auth.mercadopago.com/authorization';
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    platform_id: 'mp',
    redirect_uri: redirectUri,
    state
  });
  return `${base}?${params.toString()}`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    const clientId = process.env.MP_CLIENT_ID;
    const redirectUri = process.env.MP_OAUTH_REDIRECT_URL || `${req.headers.origin || ''}/api/oauth/mp/callback`;
    const adminId = (req.query.adminId || '').toString();

    if (!clientId) {
      res.status(500).json({ error: 'Missing MP_CLIENT_ID environment variable' });
      return;
    }
    if (!redirectUri) {
      res.status(500).json({ error: 'Missing MP_OAUTH_REDIRECT_URL environment variable' });
      return;
    }
    if (!adminId) {
      res.status(400).json({ error: 'Missing adminId' });
      return;
    }

    // Create a short-lived connect intent (optional but useful for tracking)
    await setDoc(doc(db, 'admin_connect_intents', adminId), {
      adminId,
      createdAt: serverTimestamp(),
      status: 'initiated'
    }, { merge: true });

    const url = buildAuthUrl({ clientId, redirectUri, state: adminId });
    // Return JSON with URL so the frontend can redirect
    res.status(200).json({ authorization_url: url });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err?.message || String(err) });
  }
}