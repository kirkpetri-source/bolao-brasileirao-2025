import axios from 'axios';
import crypto from 'crypto';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }
    const { id } = req.query;
    if (!id) {
      res.status(400).json({ error: 'Missing transaction id' });
      return;
    }
    const snap = await getDoc(doc(db, 'transactions', id));
    if (!snap.exists()) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const data = snap.data();
    // Mask sensitive fields if any
    const safe = { ...data };
    delete safe.encryptedCpf; delete safe.encryptedPixKey; delete safe.encryptionIv; delete safe.encryptionTag;
    res.status(200).json({ id, ...safe });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}