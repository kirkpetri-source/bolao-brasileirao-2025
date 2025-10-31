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

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }
    const adminId = (req.body?.adminId || '').toString();
    if (!adminId) {
      res.status(400).json({ error: 'Missing adminId' });
      return;
    }

    await setDoc(doc(db, 'admins', adminId), {
      id: adminId,
      mercado_pago_connected: false,
      mercado_pago_access_token: null,
      mercado_pago_refresh_token: null,
      mercado_pago_user_id: null,
      mercado_pago_account: null,
      desconectado_em: serverTimestamp()
    }, { merge: true });

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err?.message || String(err) });
  }
}