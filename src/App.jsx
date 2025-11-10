import React, { useState, useEffect, useRef, createContext, useContext, useMemo } from 'react';
import { Trophy, Users, Calendar, TrendingUp, LogOut, Eye, EyeOff, Plus, Edit2, Trash2, Upload, ExternalLink, X, UserPlus, Target, Award, ChevronDown, ChevronUp, Check, Key, DollarSign, CheckCircle, XCircle, AlertCircle, FileText, Download, Store, Filter, Loader2, Megaphone, Send, Search, Bell, Copy, RefreshCcw, History } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc, onSnapshot, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import { MESSAGE_TEMPLATES, TEMPLATE_CATEGORIES, buildTemplateText as buildTemplateTextUtil, validateMessageTags, normalizeTags, compileTemplate } from './utils/messageTemplates.js';

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

const generateCartelaCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CART-${timestamp}-${random}`;
};

const AppContext = createContext();
const useApp = () => useContext(AppContext);

// Util: moeda BRL
const fmtBRL = (n) => {
  try { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n)); } catch { return `R$ ${Number(n).toFixed(2)}`; }
};

// TIMES OFICIAIS DA SÉRIE A 2025 - CBF
const SERIE_A_2025_TEAMS = [
  { name: 'Palmeiras', logo: 'https://logodetimes.com/times/palmeiras/logo-palmeiras-256.png' },
  { name: 'Flamengo', logo: 'https://logodetimes.com/times/flamengo/logo-flamengo-256.png' },
  { name: 'Cruzeiro', logo: 'https://logodetimes.com/times/cruzeiro/logo-cruzeiro-256.png' },
  { name: 'Mirassol', logo: 'https://logodetimes.com/times/mirassol/logo-mirassol-256.png' },
  { name: 'Botafogo', logo: 'https://logodetimes.com/times/botafogo/logo-botafogo-256.png' },
  { name: 'Bahia', logo: 'https://logodetimes.com/times/bahia/logo-bahia-256.png' },
  { name: 'Fluminense', logo: 'https://logodetimes.com/times/fluminense/logo-fluminense-256.png' },
  { name: 'São Paulo', logo: 'https://logodetimes.com/times/sao-paulo/logo-sao-paulo-256.png' },
  { name: 'Red Bull Bragantino', logo: 'https://logodetimes.com/times/bragantino/logo-bragantino-256.png' },
  { name: 'Ceará', logo: 'https://logodetimes.com/times/ceara/logo-ceara-256.png' },
  { name: 'Vasco da Gama', logo: 'https://logodetimes.com/times/vasco/logo-vasco-256.png' },
  { name: 'Corinthians', logo: 'https://logodetimes.com/times/corinthians/logo-corinthians-256.png' },
  { name: 'Grêmio', logo: 'https://logodetimes.com/times/gremio/logo-gremio-256.png' },
  { name: 'Atlético Mineiro', logo: 'https://logodetimes.com/times/atletico-mineiro/logo-atletico-mineiro-256.png' },
  { name: 'Internacional', logo: 'https://logodetimes.com/times/internacional/logo-internacional-256.png' },
  { name: 'Santos', logo: 'https://logodetimes.com/times/santos/logo-santos-256.png' },
  { name: 'Vitória', logo: 'https://logodetimes.com/times/vitoria/logo-vitoria-256.png' },
  { name: 'Fortaleza', logo: 'https://logodetimes.com/times/fortaleza/logo-fortaleza-256.png' },
  { name: 'Juventude', logo: 'https://logodetimes.com/times/juventude/logo-juventude-256.png' },
  { name: 'Sport', logo: 'https://logodetimes.com/times/sport/logo-sport-256.png' }
];

const getSafeLogo = (team) => {
  const url = team?.logo;
  if (url && typeof url === 'string' && url.startsWith('http')) return url;
  const name = team?.name || 'Time';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ffffff&color=0f172a&size=256`;
};

const initializeDatabase = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const teamsSnapshot = await getDocs(collection(db, 'teams'));
    const settingsSnapshot = await getDocs(collection(db, 'settings'));
    
    if (!usersSnapshot.empty && !teamsSnapshot.empty) {
      console.log('✅ Database initialized');
      return;
    }

    console.log('🔄 Initializing...');

    const initialUsers = [
      { whatsapp: '11999999999', password: 'kirk5364', name: 'Administrador', isAdmin: true, balance: 0 },
      { whatsapp: '11988888888', password: '123456', name: 'João Silva', isAdmin: false, balance: 150 },
      { whatsapp: '11977777777', password: '123456', name: 'Maria Santos', isAdmin: false, balance: 200 }
    ];

    for (const user of initialUsers) {
      const hashed = await bcrypt.hash(user.password, 10);
      await addDoc(collection(db, 'users'), { ...user, password: hashed, createdAt: serverTimestamp() });
    }

    for (const team of SERIE_A_2025_TEAMS) {
      await addDoc(collection(db, 'teams'), { ...team, createdAt: serverTimestamp() });
    }

    if (settingsSnapshot.empty) {
      await addDoc(collection(db, 'settings'), {
        whatsappMessage: '🏆 *BOLÃO BRASILEIRÃO 2025*\n\n📋 *{RODADA}*\n🎫 *Cartela: {CARTELA}*\n✅ Confirmado!\n\n{PALPITES}\n\n💰 R$ 15,00\n⚠️ *Não pode alterar após pagamento*\n\nBoa sorte! 🍀',
        chargeMessageTemplate: 'Olá {NOME},\n\nIdentificamos que o pagamento da sua cartela da {RODADA} ainda está pendente.\n\nValor: R$ {VALOR}\nCartela: {CARTELA}\n\nPor favor, conclua o pagamento para validar sua participação no ranking e na premiação. Obrigado! 🙏',
        devolution: {
          instanceName: '',
          link: '',
          token: ''
        },
        maintenanceMode: false,
        maintenanceMessage: 'Estamos realizando uma manutenção programada para melhorar sua experiência. Por favor, tente novamente em breve.',
        maintenanceUntil: null,
        maintenanceAllowedIps: [],
        maintenanceSchedule: { start: null, end: null },
        betValue: 15,
        whatsapp: {
          apiToken: '',
          number: '',
          notifyEnabled: true,
          notifyEvents: { charges: true, approvals: true, results: true },
          defaultTemplates: {
            confirm: '🏆 *BOLÃO BRASILEIRÃO 2025*\n\n📋 *{RODADA}*\n🎫 *Cartela: {CARTELA}*\n✅ Confirmado!\n\n{PALPITES}\n\n💰 R$ 15,00\n⚠️ *Não pode alterar após pagamento*\n\nBoa sorte! 🍀',
            charge: 'Olá {NOME},\n\nIdentificamos que o pagamento da sua cartela da {RODADA} ainda está pendente.\n\nValor: R$ {VALOR}\nCartela: {CARTELA}\n\nPor favor, conclua o pagamento para validar sua participação no ranking e na premiação. Obrigado! 🙏'
          }
        },
        betConfig: {
          minBet: 10,
          maxBet: 100,
          bonus: { enabled: false, percent: 0 },
          fees: { adminPercent: 10, establishmentPercent: 5 },
          typesLimitsText: ''
        },
        payment: {
          provider: 'mercadopago',
          useEnvCredentials: true,
          mercadopago: { accessToken: '', webhookSecret: '', webhookUrl: '' },
          methods: { pix: true, card: false },
          transactionFeePercent: 0,
          allowedIps: [],
          signatureHeaderName: 'x-signature',
          retries: 3,
          timeoutMs: 10000
        },
        termsOfUse: '',
        systemPolicies: '',
        limitsRestrictions: '',
        complianceConfig: '',
        createdAt: serverTimestamp()
      });
    }

    console.log('🎉 Done!');
  } catch (error) {
    console.error('Error:', error);
  }
};

const sendWhatsAppMessage = (userPhone, roundName, predictions, teams, messageTemplate, cartelaCode) => {
  let palpitesText = '';
  predictions.forEach((pred, i) => {
    const homeTeam = teams.find(t => t.id === pred.match.homeTeamId);
    const awayTeam = teams.find(t => t.id === pred.match.awayTeamId);
    palpitesText += `${i + 1}. ${homeTeam?.name} ${pred.homeScore} x ${pred.awayScore} ${awayTeam?.name}\n`;
  });
  
  // Usar a mensagem do template fornecido
  const message = messageTemplate
    .replace('{RODADA}', roundName)
    .replace('{CARTELA}', cartelaCode)
    .replace('{PALPITES}', palpitesText.trim());
  
  console.log('Mensagem formatada:', message);
  
  // Adicionar +55 se o número não começar com +
  let formattedPhone = userPhone.replace(/\D/g, '');
  if (!formattedPhone.startsWith('55')) {
    formattedPhone = '55' + formattedPhone;
  }
  
  console.log('Abrindo WhatsApp para:', formattedPhone);
  window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
};

const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [establishments, setEstablishments] = useState([]);
  const [settings, setSettings] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [teamImportRequests, setTeamImportRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sessão persistente com timeout de 10 min e renovação automática
  const SESSION_KEY = 'bb2025.session';
  const SESSION_TIMEOUT_MS = 10 * 60 * 1000;
  const SESSION_SECRET = import.meta.env?.VITE_SESSION_SECRET || 'bb-2025-local-secret';

  const textEncoder = new TextEncoder();
  const toHex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  const sha256 = async (str) => toHex(await crypto.subtle.digest('SHA-256', textEncoder.encode(str)));

  const readSession = () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const writeSession = async (user) => {
    const now = Date.now();
    const session = {
      userId: user.id,
      isAdmin: !!user.isAdmin,
      issuedAt: now,
      lastActiveAt: now,
      expiresAt: now + SESSION_TIMEOUT_MS,
    };
    session.sig = await sha256(`${session.userId}|${session.issuedAt}|${SESSION_SECRET}`);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  };

  const clearSession = () => {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  };

  const isSessionValid = async (s) => {
    if (!s) return false;
    if (s.expiresAt && Date.now() > s.expiresAt) return false;
    const expected = await sha256(`${s.userId}|${s.issuedAt}|${SESSION_SECRET}`);
    return s.sig === expected;
  };

  const touchSession = () => {
    const s = readSession();
    if (!s) return;
    const now = Date.now();
    s.lastActiveAt = now;
    s.expiresAt = now + SESSION_TIMEOUT_MS;
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
  };

  const login = async (user) => {
    setCurrentUser(user);
    await writeSession(user);
  };

  const requireAdmin = () => {
    if (!currentUser?.isAdmin) {
      throw new Error('Ação restrita ao administrador');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    clearSession();
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await initializeDatabase();
        const [u, t, r, p, s, e, c] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'teams')),
          getDocs(collection(db, 'rounds')),
          getDocs(collection(db, 'predictions')),
          getDocs(collection(db, 'settings')),
          getDocs(collection(db, 'establishments')),
          getDocs(collection(db, 'communications'))
        ]);
        setUsers(u.docs.map(d => { const data = d.data(); const { password, ...rest } = data; return { id: d.id, ...rest }; }));
        setTeams(t.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)));
        setRounds(r.docs.map(d => ({ id: d.id, ...d.data() })));
        setPredictions(p.docs.map(d => ({ id: d.id, ...d.data() })));
        setEstablishments(e.docs.map(d => ({ id: d.id, ...d.data() })));
        setSettings(s.docs.length > 0 ? { id: s.docs[0].id, ...s.docs[0].data() } : null);
        setCommunications(c.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Load error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const uns = [
      onSnapshot(collection(db, 'rounds'), s => setRounds(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'teams'), s => setTeams(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)))),
      onSnapshot(collection(db, 'predictions'), s => setPredictions(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'users'), s => setUsers(s.docs.map(d => { const data = d.data(); const { password, ...rest } = data; return { id: d.id, ...rest }; }))),
      onSnapshot(collection(db, 'establishments'), s => setEstablishments(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'settings'), s => setSettings(s.docs.length > 0 ? { id: s.docs[0].id, ...s.docs[0].data() } : null)),
      onSnapshot(collection(db, 'communications'), s => setCommunications(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'team_import_requests'), s => setTeamImportRequests(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    ];
    return () => uns.forEach(u => u());
  }, []);

  // Restaura sessão quando usuários são carregados
  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      const s = readSession();
      if (!s) return;
      const ok = await isSessionValid(s);
      if (!ok) { clearSession(); return; }
      const u = users.find(u => u.id === s.userId);
      if (u && mounted) setCurrentUser(u);
    };
    if (users && users.length) restore();
    return () => { mounted = false; };
  }, [users]);

  // Renova por atividade e impõe expiração por inatividade
  useEffect(() => {
    if (!currentUser) return;
    const onActivity = () => touchSession();
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'visibilitychange', 'focus'];
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    const checker = setInterval(() => {
      const s = readSession();
      if (s && s.expiresAt && Date.now() > s.expiresAt) { logout(); }
    }, 15000);
    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
      clearInterval(checker);
    };
  }, [currentUser]);

  // Fechamento automático de rodadas no banco (somente admin em primeiro plano)
  useEffect(() => {
    if (!currentUser?.isAdmin) return;
    const timer = setInterval(async () => {
      try {
        const toClose = rounds.filter(r => {
          if (r.status !== 'open') return false;
          if (!r.closeAt) return false;
          const ts = new Date(r.closeAt).getTime();
          return !isNaN(ts) && Date.now() >= ts;
        });
        for (const r of toClose) {
          await updateDoc(doc(db, 'rounds', r.id), { status: 'closed' });
        }
      } catch (err) {
        console.error('Erro ao fechar rodada automaticamente:', err);
      }
    }, 30000); // verifica a cada 30s
    return () => clearInterval(timer);
  }, [currentUser, rounds]);

  const isTeamProtected = (teamId) => {
    const protectedStatuses = new Set(['open','closed','finished']);
    return rounds.some(r => {
      if (!protectedStatuses.has(r?.status)) return false;
      const matches = Array.isArray(r?.matches) ? r.matches : [];
      return matches.some(m => m?.homeTeamId === teamId || m?.awayTeamId === teamId);
    });
  };

  const value = {
    currentUser, setCurrentUser, users, teams, rounds, predictions, establishments, settings, communications, teamImportRequests, loading,
    login, logout,
    addUser: async (d) => {
      const toSave = { ...d };
      if (toSave.password) {
        toSave.password = await bcrypt.hash(toSave.password, 10);
      }
      const r = await addDoc(collection(db, 'users'), { ...toSave, createdAt: serverTimestamp() });
      return { id: r.id, ...toSave };
    },
    updateUser: async (id, d) => {
      const isSelf = currentUser?.id === id;
      const isAdminUser = !!currentUser?.isAdmin;
      if (!isAdminUser && !isSelf) throw new Error('Não autorizado');
      const toSave = { ...d };
      if (toSave.password) {
        toSave.password = await bcrypt.hash(toSave.password, 10);
      }
      await updateDoc(doc(db, 'users', id), toSave);
    },
    deleteUser: async (id) => { requireAdmin(); return await deleteDoc(doc(db, 'users', id)); },
    addTeam: async (d) => { 
      requireAdmin(); 
      const normalize = (s) => s?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const exists = teams.some(t => normalize(t.name) === normalize(d.name));
      if (exists) throw new Error('Já existe um time com esse nome.');
      const r = await addDoc(collection(db, 'teams'), { ...d, createdAt: serverTimestamp() }); 
      return { id: r.id, ...d }; 
    },
    updateTeam: async (id, d) => {
      requireAdmin();
      const existing = teams.find(t => t.id === id);
      if (!existing) throw new Error('Time inexistente');
      const wantsNameChange = typeof d.name === 'string' && d.name.trim() !== existing.name;
      if (wantsNameChange && isTeamProtected(id)) {
        throw new Error('Este time está vinculado a rodadas ativas/fechadas/finalizadas. Alterar o nome não é permitido.');
      }
      return await updateDoc(doc(db, 'teams', id), d);
    },
    deleteTeam: async (id) => {
      requireAdmin();
      if (isTeamProtected(id)) {
        throw new Error('Este time está vinculado a rodadas ativas/fechadas/finalizadas. Exclusão não é permitida.');
      }
      return await deleteDoc(doc(db, 'teams', id));
    },
    deleteAllTeams: async () => {
      requireAdmin();
      const snapshot = await getDocs(collection(db, 'teams'));
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }
    },
    resetTeamsToSerieA2025: async () => {
      requireAdmin();
      const snapshot = await getDocs(collection(db, 'teams'));
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }
      for (const team of SERIE_A_2025_TEAMS) {
        await addDoc(collection(db, 'teams'), { ...team, createdAt: serverTimestamp() });
      }
    },
    submitImportRequestsFromApi: async () => {
      requireAdmin();
      try {
        const r = await axios.get('/api/brasileirao/teams');
        const items = Array.isArray(r.data?.teams) ? r.data.teams : [];
        const normalize = (s) => s?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
        const existingNames = new Set(teams.map(t => normalize(t.name)));
        for (const it of items) {
          const nm = normalize(it.name);
          if (!nm || existingNames.has(nm)) continue;
          await addDoc(collection(db, 'team_import_requests'), {
            name: it.name,
            logo: it.logo || '',
            normalizedName: nm,
            status: 'pending',
            createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error('Erro ao buscar times da API:', err);
        throw new Error('Falha ao buscar times da API');
      }
    },
    approveImportRequest: async (id) => {
      requireAdmin();
      const req = teamImportRequests.find(r => r.id === id);
      if (!req) throw new Error('Solicitação inexistente');
      if (req.status !== 'pending') throw new Error('Solicitação não está pendente');
      const normalize = (s) => s?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const exists = teams.some(t => normalize(t.name) === (req.normalizedName || normalize(req.name)));
      if (exists) throw new Error('Já existe um time com esse nome');
      const teamDoc = await addDoc(collection(db, 'teams'), { name: req.name, logo: req.logo || '', createdAt: serverTimestamp() });
      await updateDoc(doc(db, 'team_import_requests', id), { status: 'approved', approvedAt: serverTimestamp(), approvedTeamId: teamDoc.id });
      await addDoc(collection(db, 'audit_logs'), { type: 'team_import_approved', requestId: id, teamId: teamDoc.id, actorId: currentUser?.id || null, at: serverTimestamp() });
    },
    rejectImportRequest: async (id, reason) => {
      requireAdmin();
      const req = teamImportRequests.find(r => r.id === id);
      if (!req) throw new Error('Solicitação inexistente');
      if (req.status !== 'pending') throw new Error('Solicitação não está pendente');
      await updateDoc(doc(db, 'team_import_requests', id), { status: 'rejected', rejectedAt: serverTimestamp(), reason: reason || '' });
      await addDoc(collection(db, 'audit_logs'), { type: 'team_import_rejected', requestId: id, actorId: currentUser?.id || null, reason: reason || '', at: serverTimestamp() });
    },
    addRound: async (d) => { requireAdmin(); const r = await addDoc(collection(db, 'rounds'), { ...d, createdAt: serverTimestamp() }); return { id: r.id, ...d }; },
    updateRound: async (id, d) => { requireAdmin(); return await updateDoc(doc(db, 'rounds', id), d); },
    deleteRound: async (id) => { requireAdmin(); return await deleteDoc(doc(db, 'rounds', id)); },
    addPrediction: async (d) => { 
      if (!currentUser) throw new Error('Não autenticado');
      if (currentUser.id !== d.userId && !currentUser.isAdmin) throw new Error('Não autorizado');
      const r = await addDoc(collection(db, 'predictions'), { 
        ...d, 
        paid: false, 
        cartelaCode: d.cartelaCode || generateCartelaCode(),
        createdAt: serverTimestamp() 
      }); 
      return { id: r.id, ...d }; 
    },
    updatePrediction: async (id, d) => {
      const existing = predictions.find(p => p.id === id);
      if (!existing) throw new Error('Palpite inexistente');
      if (existing.userId !== currentUser?.id && !currentUser?.isAdmin) throw new Error('Não autorizado');
      return await updateDoc(doc(db, 'predictions', id), d);
    },
    deleteCartelaPredictions: async (userId, roundId, cartelaCode) => {
      if (!currentUser) throw new Error('Não autenticado');
      if (currentUser.id !== userId && !currentUser.isAdmin) throw new Error('Não autorizado');
      try {
        const toDelete = predictions.filter(p => 
          p.userId === userId && 
          p.roundId === roundId && 
          (p.cartelaCode || 'ANTIGA') === cartelaCode &&
          !p.paid
        );
        for (const pred of toDelete) {
          await deleteDoc(doc(db, 'predictions', pred.id));
        }
      } catch (err) {
        console.error('Erro ao excluir cartela:', err);
        throw err;
      }
    },
    addEstablishment: async (d) => { requireAdmin(); const r = await addDoc(collection(db, 'establishments'), { ...d, createdAt: serverTimestamp() }); return { id: r.id, ...d }; },
    updateEstablishment: async (id, d) => { requireAdmin(); return await updateDoc(doc(db, 'establishments', id), d); },
    deleteEstablishment: async (id) => { requireAdmin(); return await deleteDoc(doc(db, 'establishments', id)); },
    updateSettings: async (d) => {
      requireAdmin();
      if (settings?.id) {
        console.log('Atualizando settings com ID:', settings.id, 'Dados:', d);
        await updateDoc(doc(db, 'settings', settings.id), d);
        console.log('Settings atualizado com sucesso');
      } else {
        console.error('Settings ID não encontrado');
        throw new Error('Configurações não inicializadas');
      }
    },
    addCommunication: async (d) => { requireAdmin(); const r = await addDoc(collection(db, 'communications'), { ...d, createdAt: serverTimestamp() }); return { id: r.id, ...d }; },
    updateCommunication: async (id, d) => { requireAdmin(); return await updateDoc(doc(db, 'communications', id), d); }
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Utilitário simples de Markdown -> HTML (negrito, itálico, listas)
const markdownToHtml = (md) => {
  if (!md) return '';
  const escapeHtml = (s) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const lines = md.split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;
  const inline = (text) =>
    escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  for (const raw of lines) {
    const line = raw.trimRight();
    if (/^\s*-\s+/.test(line)) {
      if (!inUl) { html += '<ul>'; inUl = true; }
      html += `<li>${inline(line.replace(/^\s*-\s+/, ''))}</li>`;
      continue;
    } else if (inUl) { html += '</ul>'; inUl = false; }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (!inOl) { html += '<ol>'; inOl = true; }
      html += `<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`;
      continue;
    } else if (inOl) { html += '</ol>'; inOl = false; }
    html += `<p>${inline(line)}</p>`;
  }
  if (inUl) html += '</ul>';
  if (inOl) html += '</ol>';
  return html;
};

// Componente reutilizável: Regras do Bolão
const RulesCard = () => {
  const { settings } = useApp();
  const betValue = settings?.betValue != null ? settings.betValue.toFixed(2) : '15,00';

  const hasCustomRules = settings?.rulesText || settings?.scoringCriteria || settings?.tiebreakRules;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={20} className="text-green-600" />
        <h2 className="text-xl font-bold">Regras do Bolão</h2>
      </div>

      {hasCustomRules ? (
        <div className="space-y-6">
          {settings?.rulesText && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Texto Completo</h3>
              <div className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: markdownToHtml(settings.rulesText) }} />
            </div>
          )}
          {settings?.scoringCriteria && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Critérios de Pontuação</h3>
              <div className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: markdownToHtml(settings.scoringCriteria) }} />
            </div>
          )}
          {settings?.tiebreakRules && (
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">Regras de Desempate</h3>
              <div className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: markdownToHtml(settings.tiebreakRules) }} />
            </div>
          )}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            Valor por cartela: R$ {betValue}
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Participação</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Faça seus palpites antes do início das partidas.</li>
              <li>Valor por cartela: R$ {betValue}.</li>
              <li>Somente cartelas pagas entram no ranking e na premiação.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Pontuação</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Placar exato: 3 pontos.</li>
              <li>Resultado correto (vitória/empate): 1 ponto.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Premiação</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>85% do total pago na rodada compõe o prêmio.</li>
              <li>Dividido igualmente entre os vencedores com maior pontuação.</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Desempate</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Posição igual para empates em pontos.</li>
              <li>Premiação dividida igualmente entre empatados no topo.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

const LoginScreen = ({ setView }) => {
  const { users, login, addUser, updateUser, settings } = useApp();
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [reg, setReg] = useState({ name: '', whatsapp: '', password: '', confirmPassword: '' });
  const [showRulesModal, setShowRulesModal] = useState(false);

  const normalizeWhatsapp = (s) => {
    const d = (s || '').replace(/\D/g, '');
    // Brasil: use os últimos 11 dígitos (DDD + número), removendo código do país se presente
    return d.length > 11 ? d.slice(-11) : d;
  };

  const handleLogin = async () => {
    const phone = normalizeWhatsapp(whatsapp);
    let user = null;
    const candidate = users.find(u => normalizeWhatsapp(u.whatsapp) === phone);
    if (candidate) {
      try {
        const d = await getDoc(doc(db, 'users', candidate.id));
        if (d.exists()) user = { id: d.id, ...d.data() };
      } catch (e) { console.error('Erro ao buscar usuário por ID:', e); }
    }
    if (!user) {
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('whatsapp', '==', phone)));
        if (snap.docs.length) {
          const d = snap.docs[0];
          user = { id: d.id, ...d.data() };
        }
      } catch (e) { console.error('Erro ao buscar usuário:', e); }
    }
    if (user) {
      const stored = user.password || '';
      let ok = false;
      if (/^\$2[aby]\$/.test(stored)) {
        try { ok = await bcrypt.compare(password, stored); } catch { ok = false; }
      } else {
        // Compatibilidade com senhas legadas em texto plano + migração para hash
        ok = stored === password;
        if (ok) {
          try {
            // autentica primeiro para cumprir a política do updateUser
            await login(user);
            await updateUser(user.id, { password });
          } catch {}
        }
      }
      if (ok) {
        // Se manutenção ativa e o usuário não é admin, redireciona para tela de manutenção
        if (settings?.maintenanceMode && !user.isAdmin) {
          setView('maintenance');
          setError('');
          return;
        }
        // garante sessão e view correta
        await login(user);
        setView(user.isAdmin ? 'admin' : 'user');
        setError('');
        return;
      }
    }
    setError('WhatsApp ou senha incorretos');
  };

  const handleRegister = async () => {
    if (settings?.maintenanceMode) {
      setError('Cadastro temporariamente indisponível durante a manutenção.');
      return;
    }
    if (!reg.name || !reg.whatsapp || !reg.password) return setError('Preencha todos!');
    if (reg.password !== reg.confirmPassword) return setError('Senhas diferentes!');
    if (reg.password.length < 6) return setError('Senha mínimo 6!');
    const phone = normalizeWhatsapp(reg.whatsapp);
    if (users.find(u => normalizeWhatsapp(u.whatsapp) === phone)) return setError('WhatsApp já cadastrado!');
    try {
      await addUser({ name: reg.name, whatsapp: phone, password: reg.password, isAdmin: false, balance: 0 });
      alert('✅ Cadastrado!');
      setShowRegister(false);
      setWhatsapp(phone);
      setReg({ name: '', whatsapp: '', password: '', confirmPassword: '' });
      setError('');
    } catch (e) {
      setError('Erro: ' + e.message);
    }
  };

  if (showRegister) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-900 flex items-center justify-center p-4">
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Criar Conta</h2>
              <button onClick={() => setShowRegister(false)}><X size={24} /></button>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome</label>
                <input type="text" placeholder="Seu nome" value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">WhatsApp</label>
                <input type="tel" placeholder="11999999999" value={reg.whatsapp} onChange={(e) => setReg({ ...reg, whatsapp: e.target.value.replace(/\D/g, '') })} className="w-full px-4 py-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Senha</label>
                <input type="password" placeholder="Mínimo 6" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirmar</label>
                <input type="password" placeholder="Digite novamente" value={reg.confirmPassword} onChange={(e) => setReg({ ...reg, confirmPassword: e.target.value })} className="w-full px-4 py-3 border rounded-lg" />
              </div>
              <button onClick={handleRegister} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold">Criar</button>
              <button onClick={() => { setShowRegister(false); setError(''); }} className="w-full border-2 text-gray-700 py-3 rounded-lg font-semibold">Já tenho</button>
              <button onClick={() => setShowRulesModal(true)} className="w-full bg-green-50 text-green-700 border-2 border-green-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm">
                <FileText size={20} /> Ver Regras
              </button>
            </div>
          </div>
          {showRulesModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <FileText className="text-green-600" size={24} />
                    <h3 className="text-2xl font-bold">Regras do Bolão</h3>
                  </div>
                  <button onClick={() => setShowRulesModal(false)}><X size={24} /></button>
                </div>
                <div className="p-6">
                  <RulesCard />
                </div>
              </div>

              

            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-900 flex items-center justify-center p-4">
      <div className="w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="bg-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold">Bolão Brasileirão</h1>
            <p className="text-gray-600 mt-2">2025 - Série A</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">WhatsApp</label>
              <input type="tel" placeholder="11999999999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Senha</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} className="w-full px-4 py-3 border rounded-lg" />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button onClick={handleLogin} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold">Entrar</button>
            <button onClick={() => { setShowRegister(true); setError(''); }} className="w-full border-2 border-green-600 text-green-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
              <UserPlus size={20} /> Criar Conta
            </button>
            <button onClick={() => setShowRulesModal(true)} className="w-full bg-green-50 text-green-700 border-2 border-green-600 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm">
              <FileText size={20} /> Ver Regras
            </button>
          </div>
        </div>
        
        {showRulesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-3xl w-full">
              <div className="p-6 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileText className="text-green-600" size={24} />
                  <h3 className="text-2xl font-bold">Regras do Bolão</h3>
                </div>
                <button onClick={() => setShowRulesModal(false)}><X size={24} /></button>
              </div>
              <div className="p-6">
                <RulesCard />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EstablishmentForm = ({ establishment, onSave, onCancel }) => {
  const [formData, setFormData] = useState(establishment || { name: '', contact: '', phone: '', commission: 5 });

  const handleSave = () => {
    if (!formData.name) {
      alert('Preencha o nome do estabelecimento!');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-2xl font-bold">{establishment ? 'Editar' : 'Novo'} Estabelecimento</h3>
          <button onClick={onCancel}><X size={24} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome do Estabelecimento *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: Bar do João" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contato (Nome)</label>
            <input type="text" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: João Silva" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Telefone/WhatsApp</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: 11999999999" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Comissão (%)</label>
            <input type="number" min="0" max="100" step="0.5" value={formData.commission} onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" />
            <p className="text-xs text-gray-500 mt-1">Padrão: 5%</p>
          </div>
        </div>
        <div className="p-6 border-t flex gap-3 sticky bottom-0 bg-white">
          <button onClick={onCancel} className="flex-1 px-6 py-2 border rounded-lg">Cancelar</button>
          <button onClick={handleSave} className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg">Salvar</button>
        </div>
      </div>
    </div>
  );
};

const TeamForm = ({ team, onSave, onCancel }) => {
  const { teams, rounds } = useApp();
  const [formData, setFormData] = useState(team || { name: '', logo: '', logoType: 'url' });
  const normalizeName = (s) => s?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const protectedStatuses = new Set(['open','closed','finished']);
  const isProtected = team?.id ? rounds?.some(r => protectedStatuses.has(r?.status) && Array.isArray(r?.matches) && r.matches.some(m => m.homeTeamId === team.id || m.awayTeamId === team.id)) : false;

  const handleSave = () => {
    if (!formData.name || !formData.logo) {
      alert('Preencha todos os campos!');
      return;
    }
    const exists = teams?.some(t => normalizeName(t.name) === normalizeName(formData.name) && (!team || t.id !== team.id));
    if (exists) {
      alert('Já existe um time com esse nome.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-2xl font-bold">{team ? 'Editar Time' : 'Novo Time'}</h3>
          <button onClick={onCancel}><X size={24} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome do Time</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} disabled={isProtected} className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: Flamengo" />
            {isProtected && (<p className="text-xs text-amber-600 mt-1">Nome bloqueado: time vinculado a rodadas ativas/fechadas/finalizadas.</p>)}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Logo</label>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setFormData({ ...formData, logoType: 'url' })} className={`flex-1 py-2 px-4 rounded-lg border ${formData.logoType === 'url' ? 'bg-green-600 text-white' : 'bg-white'}`}>
                <ExternalLink size={16} className="inline mr-2" /> URL
              </button>
              <button onClick={() => setFormData({ ...formData, logoType: 'upload' })} className={`flex-1 py-2 px-4 rounded-lg border ${formData.logoType === 'upload' ? 'bg-green-600 text-white' : 'bg-white'}`}>
                <Upload size={16} className="inline mr-2" /> Upload
              </button>
            </div>
            {formData.logoType === 'url' ? (
              <input type="url" value={formData.logo} onChange={(e) => setFormData({ ...formData, logo: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="https://exemplo.com/logo.png" />
            ) : (
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => setFormData({ ...formData, logo: e.target.result });
                  reader.readAsDataURL(file);
                }
              }} className="w-full px-4 py-2 border rounded-lg" />
            )}
            {formData.logo && <img src={formData.logo} alt="Preview" className="w-24 h-24 object-contain mx-auto mt-4" />}
          </div>
        </div>
        <div className="p-6 border-t flex gap-3 sticky bottom-0 bg-white">
          <button onClick={onCancel} className="flex-1 px-6 py-2 border rounded-lg">Cancelar</button>
          <button onClick={handleSave} className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg">Salvar</button>
        </div>
      </div>
    </div>
  );
};

const RoundForm = ({ round, teams, rounds, onSave, onCancel }) => {
  const toLocalInputFromISO = (iso) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      const y = d.getFullYear();
      const m = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hh = pad(d.getHours());
      const mm = pad(d.getMinutes());
      return `${y}-${m}-${day}T${hh}:${mm}`;
    } catch {
      return '';
    }
  };

  const toUtcIsoFromLocalInput = (localVal) => {
    try {
      const d = new Date(localVal);
      if (isNaN(d.getTime())) return '';
      return d.toISOString();
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState(() => {
    if (round) {
      const closeLocal = round.closeAt ? toLocalInputFromISO(round.closeAt) : '';
      return { ...round, closeAt: closeLocal };
    }
    return { number: rounds.length + 1, name: `Rodada ${rounds.length + 1}`, status: 'upcoming', matches: [], closeAt: '' };
  });

  const addMatch = () => {
    setFormData({
      ...formData,
      matches: [...(formData.matches || []), { id: Date.now(), homeTeamId: teams[0]?.id, awayTeamId: teams[1]?.id, date: '', homeScore: null, awayScore: null, finished: false }]
    });
  };

  const updateMatch = (matchId, field, value) => {
    setFormData({
      ...formData,
      matches: formData.matches.map(m => m.id === matchId ? { ...m, [field]: value } : m)
    });
  };

  const removeMatch = (matchId) => {
    setFormData({ ...formData, matches: formData.matches.filter(m => m.id !== matchId) });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <h3 className="text-2xl font-bold">{round ? 'Editar Rodada' : 'Nova Rodada'}</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Número</label>
              <input type="number" value={formData.number} onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nome</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
              <option value="upcoming">🔜 Futura</option>
              <option value="open">✅ Aberta</option>
              <option value="closed">🔒 Fechada</option>
              <option value="finished">🏁 Finalizada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Fechamento programado</label>
            <input
              type="datetime-local"
              value={formData.closeAt || ''}
              onChange={(e) => setFormData({ ...formData, closeAt: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">Após este horário, palpites serão bloqueados automaticamente.</p>
          </div>
          <div>
            <div className="flex justify-between mb-4">
              <h4 className="text-lg font-semibold">Jogos</h4>
              <button onClick={addMatch} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg">
                <Plus size={16} /> Adicionar
              </button>
            </div>
            <div className="space-y-4">
              {formData.matches?.map((match) => (
                <div key={match.id} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-12 sm:col-span-5">
                      <select value={match.homeTeamId} onChange={(e) => updateMatch(match.id, 'homeTeamId', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                        {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-12 sm:col-span-2 text-center font-bold">VS</div>
                    <div className="col-span-12 sm:col-span-5">
                      <select value={match.awayTeamId} onChange={(e) => updateMatch(match.id, 'awayTeamId', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                        {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-12 sm:col-span-9">
                      <input type="datetime-local" value={match.date} onChange={(e) => updateMatch(match.id, 'date', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-12 sm:col-span-3 flex sm:justify-end">
                      <button onClick={() => removeMatch(match.id)} className="text-red-600 p-2"><Trash2 size={18} /></button>
                    </div>
                    <div className="col-span-12 flex items-center gap-2">
                      <input type="checkbox" checked={match.finished} onChange={(e) => updateMatch(match.id, 'finished', e.target.checked)} className="w-4 h-4" />
                      <label className="text-sm">Jogo finalizado</label>
                    </div>
                    {match.finished && (
                      <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="Gols Casa"
                          min="0"
                          value={match.homeScore ?? ''}
                          onChange={(e) => updateMatch(
                            match.id,
                            'homeScore',
                            e.target.value === '' ? null : parseInt(e.target.value, 10)
                          )}
                          className="px-3 py-2 border rounded-lg"
                        />
                        <input
                          type="number"
                          placeholder="Gols Fora"
                          min="0"
                          value={match.awayScore ?? ''}
                          onChange={(e) => updateMatch(
                            match.id,
                            'awayScore',
                            e.target.value === '' ? null : parseInt(e.target.value, 10)
                          )}
                          className="px-3 py-2 border rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t flex gap-3 sticky bottom-0 bg-white">
          <button onClick={onCancel} className="px-6 py-2 border rounded-lg">Cancelar</button>
          <button
            onClick={() => {
              if (formData.closeAt) {
                const ts = new Date(formData.closeAt).getTime();
                if (isNaN(ts)) {
                  alert('Data/horário de fechamento inválida(o).');
                  return;
                }
                // Para status 'upcoming' ou 'open', exigir futuro
                if ((formData.status === 'upcoming' || formData.status === 'open') && ts <= Date.now()) {
                  alert('A data/horário de fechamento deve ser no futuro para rodadas abertas/futuras.');
                  return;
                }
              }
              const toSave = {
                ...formData,
                closeAt: formData.closeAt ? toUtcIsoFromLocalInput(formData.closeAt) : ''
              };
              onSave(toSave);
            }}
            className="px-6 py-2 bg-green-600 text-white rounded-lg"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

const PasswordModal = ({ user, onSave, onCancel }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Senhas não coincidem!');
      return;
    }
    onSave(newPassword);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Key className="text-green-600" size={24} />
            <h3 className="text-2xl font-bold">Redefinir Senha</h3>
          </div>
          <button onClick={onCancel}><X size={24} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Usuário:</strong> {user.name}<br />
              <strong>WhatsApp:</strong> {user.whatsapp}
            </p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-2">Nova Senha</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                className="w-full px-4 py-2 border rounded-lg" 
                placeholder="Mínimo 6 caracteres" 
              />
              <button 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Confirmar Senha</label>
            <input 
              type={showPassword ? 'text' : 'password'} 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className="w-full px-4 py-2 border rounded-lg" 
              placeholder="Digite novamente" 
            />
          </div>
        </div>
        <div className="p-6 border-t flex gap-3">
          <button onClick={onCancel} className="flex-1 px-6 py-2 border rounded-lg">Cancelar</button>
          <button onClick={handleSave} className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg">Alterar Senha</button>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ setView }) => {
  const { currentUser, setCurrentUser, logout, teams, rounds, users, predictions, establishments, settings, communications, addRound, updateRound, deleteRound, addTeam, updateTeam, deleteTeam, updateUser, deleteUser, resetTeamsToSerieA2025, updatePrediction, updateSettings, addEstablishment, updateEstablishment, deleteEstablishment, addCommunication, updateCommunication, teamImportRequests, submitImportRequestsFromApi, approveImportRequest, rejectImportRequest } = useApp();
  
  console.log('AdminPanel - Settings:', settings);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingRound, setEditingRound] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingEstablishment, setEditingEstablishment] = useState(null);
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [showEstablishmentForm, setShowEstablishmentForm] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);
  const [selectedFinanceRound, setSelectedFinanceRound] = useState(null);
  const [selectedDashboardRound, setSelectedDashboardRound] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [establishmentFilter, setEstablishmentFilter] = useState('all');
  const [whatsappMessage, setWhatsappMessage] = useState(settings?.whatsappMessage || '');
  const [chargeMessageTemplate, setChargeMessageTemplate] = useState(settings?.chargeMessageTemplate || '');
  const [betValue, setBetValue] = useState(settings?.betValue || 15);
  const [devolutionLink, setDevolutionLink] = useState(settings?.devolution?.link || '');
  const [devolutionInstance, setDevolutionInstance] = useState(settings?.devolution?.instanceName || '');
  const [devolutionToken, setDevolutionToken] = useState(settings?.devolution?.token || '');
  const [pdfLoadingRoundId, setPdfLoadingRoundId] = useState(null);
  const [adminPlayerModal, setAdminPlayerModal] = useState(null);
  const [settingsTab, setSettingsTab] = useState('whatsapp');
  // Manutenção do sistema
  const [maintenanceMode, setMaintenanceMode] = useState(!!settings?.maintenanceMode);
  const [maintenanceMessage, setMaintenanceMessage] = useState(settings?.maintenanceMessage || 'Estamos realizando uma manutenção programada para melhorar sua experiência. Por favor, tente novamente em breve.');
  const [maintenanceUntilInput, setMaintenanceUntilInput] = useState(settings?.maintenanceUntil ? new Date(settings.maintenanceUntil).toISOString().slice(0, 16) : '');
  const [maintenanceAllowedIps, setMaintenanceAllowedIps] = useState((settings?.maintenanceAllowedIps || []).join(', '));
  const [maintenanceScheduleStart, setMaintenanceScheduleStart] = useState('');
  const [maintenanceScheduleEnd, setMaintenanceScheduleEnd] = useState('');
  // WhatsApp
  const [whatsappProvider, setWhatsappProvider] = useState(settings?.whatsapp?.provider || (settings?.devolution?.link ? 'evolution' : 'cloud'));
  const [whatsappApiToken, setWhatsappApiToken] = useState(settings?.whatsapp?.apiToken || '');
  const [whatsappNumber, setWhatsappNumber] = useState(settings?.whatsapp?.number || '');
  const [whatsappNotifyEnabled, setWhatsappNotifyEnabled] = useState(settings?.whatsapp?.notifyEnabled ?? true);
  const [whatsappNotifyEvents, setWhatsappNotifyEvents] = useState(settings?.whatsapp?.notifyEvents || { charges: true, approvals: true, results: true });
  // Regras extras
  const [termsOfUse, setTermsOfUse] = useState(settings?.termsOfUse || '');
  const [systemPolicies, setSystemPolicies] = useState(settings?.systemPolicies || '');
  const [limitsRestrictions, setLimitsRestrictions] = useState(settings?.limitsRestrictions || '');
  const [complianceConfig, setComplianceConfig] = useState(settings?.complianceConfig || '');
  // Valor da aposta avançado
  const [minBet, setMinBet] = useState(settings?.betConfig?.minBet || 10);
  const [maxBet, setMaxBet] = useState(settings?.betConfig?.maxBet || 100);
  const [bonusEnabled, setBonusEnabled] = useState(settings?.betConfig?.bonus?.enabled ?? false);
  const [bonusPercent, setBonusPercent] = useState(settings?.betConfig?.bonus?.percent || 0);
  const [adminFeePercent, setAdminFeePercent] = useState(settings?.betConfig?.fees?.adminPercent ?? 10);
  const [establishmentPercent, setEstablishmentPercent] = useState(settings?.betConfig?.fees?.establishmentPercent ?? 5);
  const [limitsByTypeText, setLimitsByTypeText] = useState(settings?.betConfig?.typesLimitsText || '');
  // API de Pagamento
  const [paymentProvider, setPaymentProvider] = useState(settings?.payment?.provider || 'mercadopago');
  const [paymentPixEnabled, setPaymentPixEnabled] = useState(settings?.payment?.methods?.pix ?? true);
  const [paymentCardEnabled, setPaymentCardEnabled] = useState(settings?.payment?.methods?.card ?? false);
  const [transactionFeePercent, setTransactionFeePercent] = useState(settings?.payment?.transactionFeePercent || 0);
  const [paymentAllowedIps, setPaymentAllowedIps] = useState((settings?.payment?.allowedIps || []).join(', '));
  const [signatureHeaderName, setSignatureHeaderName] = useState(settings?.payment?.signatureHeaderName || 'x-signature');
  const [paymentRetries, setPaymentRetries] = useState(settings?.payment?.retries || 3);
  const [paymentTimeoutMs, setPaymentTimeoutMs] = useState(settings?.payment?.timeoutMs || 10000);
  const [showAdvancedPayment, setShowAdvancedPayment] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const mpWebhookUrl = origin ? `${origin}/api/payments/mercadopago/webhook` : '/api/payments/mercadopago/webhook';
  // Conexão Mercado Pago (OAuth)
  const [mpConn, setMpConn] = useState({ connected: false, email: null, nickname: null, loading: true });
  const [adminPayments, setAdminPayments] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  useEffect(() => {
    if (!currentUser?.isAdmin) return;
    const unsub = onSnapshot(doc(db, 'admins', currentUser.id), (snap) => {
      const d = snap.data() || {};
      setMpConn({
        connected: !!d?.mercado_pago_connected,
        email: d?.mercado_pago_account?.email || null,
        nickname: d?.mercado_pago_account?.nickname || null,
        loading: false
      });
    });
    return () => { try { unsub(); } catch {} };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.isAdmin) return;
    const q = query(collection(db, 'user_payments'), where('adminId', '==', currentUser.id));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAdminPayments(list);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const total = list
        .filter(p => p.status === 'approved')
        .filter(p => {
          const dt = p.createdAt?.toDate ? p.createdAt.toDate() : null;
          return dt ? dt >= monthStart : true;
        })
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      setMonthlyTotal(total);
    });
    return () => { try { unsub(); } catch {} };
  }, [currentUser?.id]);

  const connectMercadoPago = async () => {
    try {
      if (!currentUser?.id) { alert('Administrador não identificado.'); return; }
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const url = `${apiBase}/api/oauth/mp/start?adminId=${encodeURIComponent(currentUser.id)}`;
      const r = await fetch(url, { method: 'GET' });
      if (!r.ok) {
        // Ambiente local (vite) não serve /api -> orientar uso do vercel dev
        throw new Error('Endpoint /api indisponível no dev local. Use "npx vercel dev" ou teste no deploy.');
      }
      const j = await r.json();
      const authUrl = j?.authorization_url || j?.url;
      if (authUrl) {
        window.open(authUrl, 'mp-oauth', 'width=800,height=700');
      } else {
        alert('Não foi possível iniciar a conexão com o Mercado Pago.');
      }
    } catch (e) {
      alert('Erro ao conectar: ' + (e?.message || 'falha desconhecida'));
    }
  };

  const disconnectMercadoPago = async () => {
    try {
      if (!currentUser?.id) { alert('Administrador não identificado.'); return; }
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const r = await fetch(`${apiBase}/api/oauth/mp/disconnect`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: currentUser.id })
      });
      if (!r.ok) {
        throw new Error('Endpoint /api indisponível no dev local. Use "npx vercel dev" ou teste no deploy.');
      }
      const j = await r.json();
      if (j?.ok) {
        alert('Conta Mercado Pago desconectada.');
      } else {
        alert('Não foi possível desconectar.');
      }
    } catch (e) {
      alert('Erro ao desconectar: ' + (e?.message || 'falha desconhecida'));
    }
  };
  // Testes A/B
  const [abTestsEnabled, setAbTestsEnabled] = useState(settings?.abTests?.enabled ?? false);
  const [experimentDashboardPercent, setExperimentDashboardPercent] = useState(settings?.abTests?.experiments?.newDashboard || 0);
  const [experimentPaymentFlowPercent, setExperimentPaymentFlowPercent] = useState(settings?.abTests?.experiments?.paymentFlowV2 || 0);
  // Histórico
  const [settingsHistory, setSettingsHistory] = useState([]);
  // Valores padrão para regras, pontuação e desempate (usados se não houver conteúdo salvo)
  const initialBet = settings?.betValue != null ? settings.betValue : 15;
  const initialBetDisplay = Number(initialBet).toFixed(2).replace('.', ',');
  const DEFAULT_RULES_MD = `**Participação**\n- Faça seus palpites antes do início das partidas.\n- Valor por cartela: R$ ${initialBetDisplay}.\n- Somente cartelas pagas entram no ranking e na premiação.\n\n**Premiação**\n- 85% do total pago na rodada compõe o prêmio.\n- Dividido igualmente entre os vencedores com maior pontuação.`;
  const DEFAULT_SCORING_MD = `- Placar exato: **3 pontos**.\n- Resultado correto (vitória/empate): *1 ponto*.`;
  const DEFAULT_TIEBREAK_MD = `- Posição igual para empates em pontos.\n- Premiação dividida igualmente entre empatados no topo.`;
  const [rulesText, setRulesText] = useState(settings?.rulesText ?? DEFAULT_RULES_MD);
  const [scoringCriteria, setScoringCriteria] = useState(settings?.scoringCriteria ?? DEFAULT_SCORING_MD);
  const [tiebreakRules, setTiebreakRules] = useState(settings?.tiebreakRules ?? DEFAULT_TIEBREAK_MD);
  const [expandedAdminRounds, setExpandedAdminRounds] = useState({});
  const rulesTextareaRef = useRef(null);
  const saveTimerRef = useRef(null);
  const initialLoadRef = useRef(true);

  const toggleAdminRound = (roundId) => {
    setExpandedAdminRounds(prev => ({ ...prev, [roundId]: !prev[roundId] }));
  };

  // Selecionar automaticamente a rodada mais recente no dashboard
  useEffect(() => {
    const dashboardRounds = rounds.filter(r => r.status === 'finished' || r.status === 'closed');
    const toTs = (r) => {
      if (r?.closeAt) {
        const t = new Date(r.closeAt).getTime();
        if (!isNaN(t)) return t;
      }
      const ca = r?.createdAt;
      if (ca && typeof ca.toDate === 'function') {
        return ca.toDate().getTime();
      }
      if (ca && typeof ca === 'object' && typeof ca.seconds === 'number') {
        return ca.seconds * 1000;
      }
      return typeof r?.number === 'number' ? r.number : 0;
    };
    if (dashboardRounds.length > 0) {
      const latestRound = dashboardRounds.sort((a, b) => toTs(b) - toTs(a))[0];
      if (selectedDashboardRound !== latestRound.id) {
        setSelectedDashboardRound(latestRound.id);
      }
    }
  }, [rounds]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const q = query(collection(db, 'settings_history'), orderBy('createdAt', 'desc'), limit(10));
        const snap = await getDocs(q);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSettingsHistory(items);
      } catch (err) {
        console.warn('Falha ao carregar histórico:', err);
      }
    };
    loadHistory();
  }, [settings]);

  // Helpers de formatação (Markdown simples)
  const wrapSelection = (start, end) => {
    const ta = rulesTextareaRef.current;
    if (!ta) return;
    const ss = ta.selectionStart || 0;
    const se = ta.selectionEnd || ss;
    const val = rulesText || '';
    const selected = val.slice(ss, se);
    const newVal = val.slice(0, ss) + start + selected + end + val.slice(se);
    setRulesText(newVal);
    initialLoadRef.current = false;
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ss + start.length;
      ta.selectionEnd = se + start.length;
    }, 0);
  };

  const makeList = (ordered) => {
    const ta = rulesTextareaRef.current;
    const val = rulesText || '';
    let ss = 0, se = val.length;
    if (ta) { ss = ta.selectionStart || 0; se = ta.selectionEnd || ss; }
    const selected = val.slice(ss, se) || '';
    const block = selected || val;
    const lines = block.split('\n');
    const newBlock = lines.map((l, i) => {
      const prefix = ordered ? `${i + 1}. ` : '- ';
      return l ? prefix + l : prefix;
    }).join('\n');
    const newVal = val.slice(0, ss) + newBlock + val.slice(se);
    setRulesText(newVal);
    initialLoadRef.current = false;
  };

  useEffect(() => {
    console.log('Settings atualizados:', settings);
    // WhatsApp
    if (settings?.whatsappMessage) {
      console.log('Carregando mensagem WhatsApp:', settings.whatsappMessage);
      setWhatsappMessage(settings.whatsappMessage);
    } else if (settings && !settings.whatsappMessage) {
      console.log('Usando mensagem padrão');
      setWhatsappMessage('🏆 *BOLÃO BRASILEIRÃO 2025*\n\n📋 *{RODADA}*\n🎫 *Cartela: {CARTELA}*\n✅ Confirmado!\n\n{PALPITES}\n\n💰 R$ 15,00\n⚠️ *Não pode alterar após pagamento*\n\nBoa sorte! 🍀');
    }

    // Bet value
    if (settings?.betValue) {
      console.log('Carregando valor da aposta:', settings.betValue);
      setBetValue(settings.betValue);
    }

    // Charge template
    if (settings?.chargeMessageTemplate != null) {
      setChargeMessageTemplate(settings.chargeMessageTemplate);
    }

    // Devolution API fields
    setDevolutionLink(settings?.devolution?.link || '');
    setDevolutionInstance(settings?.devolution?.instanceName || '');
    setDevolutionToken(settings?.devolution?.token || '');
    // Atualiza estados de manutenção quando settings muda
    setMaintenanceMode(!!settings?.maintenanceMode);
    setMaintenanceMessage(settings?.maintenanceMessage || 'Estamos realizando uma manutenção programada para melhorar sua experiência. Por favor, tente novamente em breve.');
    setMaintenanceUntilInput(settings?.maintenanceUntil ? new Date(settings.maintenanceUntil).toISOString().slice(0, 16) : '');

    // Prefill regras/scoring/desempate mesmo sem settings (usando valor efetivo)
    const effectiveBet = settings?.betValue != null ? settings.betValue : (betValue != null ? Number(betValue) : 15);
    const betDisplay = Number(effectiveBet).toFixed(2).replace('.', ',');
    const defaultRulesMd = `**Participação**\n- Faça seus palpites antes do início das partidas.\n- Valor por cartela: R$ ${betDisplay}.\n- Somente cartelas pagas entram no ranking e na premiação.\n\n**Premiação**\n- 85% do total pago na rodada compõe o prêmio.\n- Dividido igualmente entre os vencedores com maior pontuação.`;
    const defaultScoringMd = `- Placar exato: **3 pontos**.\n- Resultado correto (vitória/empate): *1 ponto*.`;
    const defaultTiebreakMd = `- Posição igual para empates em pontos.\n- Premiação dividida igualmente entre empatados no topo.`;

    if (settings) {
      setRulesText(settings.rulesText ?? (rulesText || defaultRulesMd));
      setScoringCriteria(settings.scoringCriteria ?? (scoringCriteria || defaultScoringMd));
      setTiebreakRules(settings.tiebreakRules ?? (tiebreakRules || defaultTiebreakMd));
    } else {
      // Sem settings (ex.: offline/erro Firestore) — preencher somente se estiver vazio
      if (!rulesText) setRulesText(defaultRulesMd);
      if (!scoringCriteria) setScoringCriteria(defaultScoringMd);
      if (!tiebreakRules) setTiebreakRules(defaultTiebreakMd);
    }
  }, [settings]);

  // Auto-save das regras com debounce
  useEffect(() => {
    if (initialLoadRef.current) return; // ignora auto-save do carregamento inicial
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      updateSettings({
        rulesText,
        scoringCriteria,
        tiebreakRules
      }).catch(err => console.error('Erro ao auto-salvar regras:', err));
    }, 600);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [rulesText, scoringCriteria, tiebreakRules]);



  const handleDeleteUser = async (user) => {
    if (!confirm(`⚠️ ATENÇÃO!\n\nDeseja realmente excluir o usuário "${user.name}"?\n\nIsso também excluirá todos os palpites deste usuário!\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      const userPredictions = predictions.filter(p => p.userId === user.id);
      for (const pred of userPredictions) {
        await deleteDoc(doc(db, 'predictions', pred.id));
      }
      await deleteUser(user.id);
      alert('✅ Usuário excluído com sucesso!');
    } catch (error) {
      alert('❌ Erro ao excluir usuário: ' + error.message);
    }
  };

  const togglePaymentStatus = async (userId, roundId, cartelaCode) => {
    try {
      const cartelaPredictions = predictions.filter(p => 
        p.userId === userId && 
        p.roundId === roundId && 
        (p.cartelaCode || 'ANTIGA') === cartelaCode
      );
      
      if (cartelaPredictions.length === 0) return;
      
      const newPaidStatus = !cartelaPredictions[0].paid;
      
      for (const pred of cartelaPredictions) {
        await updatePrediction(pred.id, { paid: newPaidStatus });
      }
    } catch (error) {
      alert('Erro ao atualizar pagamento: ' + error.message);
    }
  };

  const getPaymentStatus = (userId, roundId, cartelaCode = null) => {
    if (cartelaCode) {
      const cartela = predictions.find(p => 
        p.userId === userId && 
        p.roundId === roundId && 
        (p.cartelaCode || 'ANTIGA') === cartelaCode
      );
      return cartela?.paid || false;
    }
    
    const userRoundPrediction = predictions.find(p => p.userId === userId && p.roundId === roundId);
    return userRoundPrediction?.paid || false;
  };

  const getRoundParticipants = (roundId) => {
    const participantData = {};
    
    predictions.filter(p => p.roundId === roundId).forEach(pred => {
      const key = `${pred.userId}-${pred.cartelaCode || 'ANTIGA'}`;
      if (!participantData[key]) {
        participantData[key] = {
          userId: pred.userId,
          cartelaCode: pred.cartelaCode || 'ANTIGA',
          establishmentId: pred.establishmentId || null,
          paid: pred.paid || false
        };
      }
    });
    
    return Object.values(participantData);
  };

  const getRoundFinancialSummary = (roundId, filterEstablishmentId = null, showTotalPrize = false) => {
    const betValue = settings?.betValue || 15;
    let participants = getRoundParticipants(roundId);
    
    const allParticipants = showTotalPrize ? getRoundParticipants(roundId) : participants;
    
    if (filterEstablishmentId && filterEstablishmentId !== 'all') {
      participants = participants.filter(p => p.establishmentId === filterEstablishmentId);
    }
    
    const totalParticipations = participants.length;
    const paidCount = participants.filter(p => p.paid).length;
    const pendingCount = totalParticipations - paidCount;
    const totalExpected = totalParticipations * betValue;
    const totalReceived = paidCount * betValue;
    const totalPending = pendingCount * betValue;

    // Calcular sobre TODOS os participantes pagos
    const allPaidCount = allParticipants.filter(p => p.paid).length;
    const totalReceivedAll = allPaidCount * betValue;
    
    // Premiação e Admin são sobre o TOTAL
    const prizePool = totalReceivedAll * 0.85;
    const adminFee = totalReceivedAll * 0.10;
    
    // Comissão do estabelecimento: 5% APENAS dos palpites vinculados a ele
    let establishmentFee = 0;
    if (filterEstablishmentId && filterEstablishmentId !== 'all' && filterEstablishmentId !== 'none') {
      // Se filtrou um estabelecimento específico, mostrar só a comissão dele
      const estParticipants = allParticipants.filter(p => p.establishmentId === filterEstablishmentId && p.paid);
      establishmentFee = estParticipants.length * betValue * 0.05;
    } else {
      // Se não filtrou ou filtrou "todos", somar comissões de TODOS os estabelecimentos
      const paidParticipants = allParticipants.filter(p => p.paid);
      establishmentFee = paidParticipants.reduce((sum, p) => {
        return p.establishmentId ? sum + (betValue * 0.05) : sum;
      }, 0);
    }

    return {
      totalParticipations,
      paidCount,
      pendingCount,
      totalExpected,
      totalReceived,
      totalPending,
      prizePool,
      adminFee,
      establishmentFee,
      betValue
    };
  };

  const getEstablishmentCommission = (roundId, establishmentId) => {
    const estParticipants = getRoundParticipants(roundId).filter(p => p.establishmentId === establishmentId && p.paid);
    const totalPaid = estParticipants.length * 15;
    return totalPaid * 0.05; // 5% de comissão
  };

  const getTotalFinancialSummary = () => {
    const betValue = settings?.betValue || 15;
    const finishedAndClosedRounds = rounds.filter(r => r.status === 'finished' || r.status === 'closed');
    let totalExpected = 0;
    let totalReceived = 0;
    let totalPending = 0;

    finishedAndClosedRounds.forEach(round => {
      const summary = getRoundFinancialSummary(round.id);
      totalExpected += summary.totalExpected;
      totalReceived += summary.totalReceived;
      totalPending += summary.totalPending;
    });

    const prizePool = totalReceived * 0.85;
    const adminFee = totalReceived * 0.10;
    
    // Calcular comissão total somando todas as rodadas
    let establishmentFee = 0;
    finishedAndClosedRounds.forEach(round => {
      const participants = getRoundParticipants(round.id).filter(p => p.paid);
      establishmentFee += participants.reduce((sum, p) => {
        return p.establishmentId ? sum + (betValue * 0.05) : sum;
      }, 0);
    });

    return {
      totalExpected,
      totalReceived,
      totalPending,
      prizePool,
      adminFee,
      establishmentFee
    };
  };

  const handleSaveRules = async () => {
    try {
      await updateSettings({
        rulesText,
        scoringCriteria,
        tiebreakRules
      });
      alert('✅ Regras atualizadas com sucesso!');
    } catch (error) {
      alert('❌ Erro ao salvar regras: ' + error.message);
    }
  };

  const getRoundDashboardData = (roundId) => {
    if (!roundId) return null;
    
    const round = rounds.find(r => r.id === roundId);
    if (!round || (round.status !== 'finished' && round.status !== 'closed')) return null;

    const betValue = settings?.betValue || 15;
    const participants = getRoundParticipants(roundId);
    const paidParticipations = participants.filter(p => p.paid);
    
    const totalPaid = paidParticipations.length * betValue;
    const prizePool = totalPaid * 0.85;
    const adminFee = totalPaid * 0.10;
    
    // Calcular comissão total dos estabelecimentos (soma individual)
    const establishmentFee = paidParticipations.reduce((sum, p) => {
      return p.establishmentId ? sum + (betValue * 0.05) : sum;
    }, 0);

    const ranking = paidParticipations.map(participant => {
      const user = users.find(u => u.id === participant.userId);
      if (!user) return null;
      
      const points = calculateUserRoundPoints(participant.userId, roundId, participant.cartelaCode);
      
      return { 
        user, 
        cartelaCode: participant.cartelaCode,
        establishmentId: participant.establishmentId,
        points 
      };
    }).filter(Boolean).sort((a, b) => b.points - a.points);

    let winners = [];
    let prizePerWinner = 0;
    if (round.status === 'finished') {
      const maxPoints = ranking.length > 0 ? ranking[0].points : 0;
      winners = ranking.filter(r => r.points === maxPoints);
      prizePerWinner = winners.length > 0 ? prizePool / winners.length : 0;
    }

    return {
      round,
      totalParticipations: participants.length,
      paidCount: paidParticipations.length,
      totalPaid,
      prizePool,
      adminFee,
      establishmentFee,
      winners,
      prizePerWinner,
      ranking,
      betValue
    };
  };

  const calculateUserRoundPoints = (userId, roundId, cartelaCode = null) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round || (round.status !== 'finished' && round.status !== 'closed')) return 0;
    
    if (cartelaCode) {
      const cartelaPreds = predictions.filter(p => 
        p.userId === userId && 
        p.roundId === roundId && 
        p.cartelaCode === cartelaCode
      );
      
      if (cartelaPreds.length === 0) return 0;
      const isPaid = cartelaPreds[0]?.paid;
      if (!isPaid) return 0;
      
      let points = 0;
      round.matches?.forEach(match => {
        const pred = cartelaPreds.find(p => p.matchId === match.id);
        
        if (pred && match.finished && match.homeScore !== null && match.awayScore !== null) {
          if (pred.homeScore === match.homeScore && pred.awayScore === match.awayScore) {
            points += 3;
          } else {
            const predResult = pred.homeScore > pred.awayScore ? 'home' : pred.homeScore < pred.awayScore ? 'away' : 'draw';
            const matchResult = match.homeScore > match.awayScore ? 'home' : match.homeScore < match.awayScore ? 'away' : 'draw';
            if (predResult === matchResult) {
              points += 1;
            }
          }
        }
      });
      return points;
    }
    
    const userRoundPreds = predictions.filter(p => p.userId === userId && p.roundId === roundId);
    const cartelaCodes = [...new Set(userRoundPreds.map(p => p.cartelaCode || 'ANTIGA'))];
    
    return cartelaCodes.reduce((sum, code) => {
      return sum + calculateUserRoundPoints(userId, roundId, code);
    }, 0);
  };

  // Cache do dashboard data para melhorar performance
  const dashboardData = useMemo(() => {
    return getRoundDashboardData(selectedDashboardRound);
  }, [selectedDashboardRound, rounds, predictions, users, settings]);

  // Abrir modal de palpites do participante no Admin
  const openAdminPlayerModal = (roundId, item) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round) return;
    const preds = predictions.filter(p => p.userId === item.user.id && p.roundId === roundId && (p.cartelaCode || 'ANTIGA') === item.cartelaCode);
    if (preds.length === 0) return;
    const cartela = {
      code: item.cartelaCode,
      predictions: preds,
      establishmentId: preds[0]?.establishmentId || null,
      paid: preds[0]?.paid || false
    };
    setAdminPlayerModal({ round, item, cartela });
  };

  const [isSendingCharges, setIsSendingCharges] = useState(false);
  const [commsMessage, setCommsMessage] = useState('');
  const [commSelectedTemplateKey, setCommSelectedTemplateKey] = useState('');
  const [selectedCommUserId, setSelectedCommUserId] = useState('');
  const [selectedCommRound, setSelectedCommRound] = useState(null);
  const [commPaymentFilter, setCommPaymentFilter] = useState('all');
  const [isSendingMassComms, setIsSendingMassComms] = useState(false);
  const [selectAllCommUsers, setSelectAllCommUsers] = useState(false);
  const [commSelectedUserIds, setCommSelectedUserIds] = useState([]);
  const selectAllCommRef = useRef(null);
  const [isSendingSingleComm, setIsSendingSingleComm] = useState(false);
  const [commFeedback, setCommFeedback] = useState(null); // { type: 'success'|'error', text }
  const [commDeadline, setCommDeadline] = useState('');
  const [commResultsDate, setCommResultsDate] = useState('');
  const [commPdfUrl, setCommPdfUrl] = useState('');
  const [commAppLink, setCommAppLink] = useState(typeof window !== 'undefined' ? window.location.origin : '');
  const [commActiveTab, setCommActiveTab] = useState('envio');
  const [commsDelayMs, setCommsDelayMs] = useState(1200);

  // Automatiza prazo final (closeAt), divulgação (createdAt) e link de ranking
  useEffect(() => {
    try {
      const round = selectedCommRound ? rounds.find(r => r.id === selectedCommRound) : null;
      const deadline = formatPtBrFlexible(round?.closeAt) || '';
      const publish = formatPtBrFlexible(round?.createdAt) || '';
      const rankingUrl = buildRankingLink(round?.id) || '';
      setCommDeadline(deadline);
      setCommResultsDate(publish);
      setCommPdfUrl(rankingUrl);
    } catch {}
  }, [selectedCommRound, rounds, commAppLink]);

  // Atualiza estado visual (indeterminate) do checkbox "Selecionar todos"
  useEffect(() => {
    if (!selectAllCommRef.current) return;
    const eligible = (users || []).filter(u => !u.isAdmin && !!u.whatsapp);
    const isMixed = selectAllCommUsers && commSelectedUserIds.length > 0 && commSelectedUserIds.length < eligible.length;
    selectAllCommRef.current.indeterminate = isMixed;
  }, [selectAllCommUsers, commSelectedUserIds, users]);

  const formatPhoneBR = (phone) => {
    let formatted = (phone || '').replace(/\D/g, '');
    if (!formatted.startsWith('55')) formatted = '55' + formatted;
    return formatted;
  };

  const formatChargeMessage = (userName, roundName, amount, cartelaCode) => {
    const tpl = chargeMessageTemplate || 'Olá {NOME},\n\nIdentificamos que o pagamento da sua cartela da {RODADA} ainda está pendente.\n\nValor: R$ {VALOR}\nCartela: {CARTELA}\n\nPor favor, conclua o pagamento para validar sua participação no ranking e na premiação. Obrigado! 🙏';
    return tpl
      .replace('{NOME}', userName || '')
      .replace('{RODADA}', roundName || '')
      .replace('{VALOR}', Number(amount || settings?.betValue || 15).toFixed(2))
      .replace('{CARTELA}', cartelaCode || '');
  };

  // Envia texto via EvolutionAPI
  const sendTextViaEvolution = async (phoneNumber, text) => {
    let base = devolutionLink || settings?.devolution?.link;
    let instance = devolutionInstance || settings?.devolution?.instanceName;
    const token = devolutionToken || settings?.devolution?.token;
    if (!base || !instance || !token) {
      throw new Error('EvolutionAPI não configurada. Defina link, instância e token em Configurações.');
    }

    // Decide caminho: proxy em produção (evita erro de certificado no navegador), direto no DEV
    const isBrowser = typeof window !== 'undefined';
    const host = isBrowser ? window.location.hostname : '';
    const isLocal = /^(localhost|127\.0\.0\.1)$/.test(host);
    const useProxy = isBrowser && !isLocal;

    // Sanitização: remover espaços, barras/ pontos finais, e forçar HTTPS (para chamada direta)
    let cleanBase = (base || '').trim().replace(/\/$/, '').replace(/\.$/, '');
    let cleanInstance = (instance || '').trim().replace(/\.$/, '');



    const directUrl = `${cleanBase}/message/sendText/${encodeURIComponent(cleanInstance)}`;

    try {
      if (useProxy) {
        // Usa função serverless para contornar TLS inválido no cliente
        const res = await fetch('/api/evolution/sendText', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: phoneNumber, text, link: base, instance, token })
        });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`Falha EvolutionAPI via proxy: ${res.status} ${body}`);
        }
        const data = await res.json().catch(() => null);
        return data;
      } else {
        // Chamado diretamente no DEV
        const res = await fetch(directUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': token
          },
          body: JSON.stringify({ number: phoneNumber, text })
        });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`Falha EvolutionAPI: ${res.status} ${body}`);
        }
        const data = await res.json().catch(() => null);
        return data;
      }
    } catch (err) {
      const target = useProxy ? 'via proxy /api' : directUrl;
      throw new Error(`Falha ao conectar à EvolutionAPI (${target}). Verifique o host, HTTPS e CSP. Detalhe: ${err?.message || 'erro de rede'}`);
    }
  };

  const sendChargeWhatsApp = async (userId, cartelaCode) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user?.whatsapp) throw new Error('Usuário sem WhatsApp');
      const round = rounds.find(r => r.id === selectedFinanceRound);
      const amount = settings?.betValue || 15;
      const message = formatChargeMessage(user.name, round?.name, amount, cartelaCode);
      const phone = formatPhoneBR(user.whatsapp);
      const result = await sendTextViaEvolution(phone, message);

      if (addCommunication) {
        await addCommunication({
          type: 'charge',
          userId: user.id,
          roundId: selectedFinanceRound,
          cartelaCode,
          amount,
          message,
          channel: 'whatsapp',
          status: 'sent',
          createdBy: currentUser?.id || null
        });
      }
      alert(`Cobrança enviada para ${user.name}.`);
    } catch (err) {
      console.error('Erro ao enviar cobrança:', err);
      alert('Erro ao iniciar cobrança: ' + err.message);
      if (addCommunication) {
        try {
          await addCommunication({
            type: 'charge',
            userId,
            roundId: selectedFinanceRound,
            cartelaCode,
            amount: settings?.betValue || 15,
            message: 'Falha: ' + (err?.message || 'erro desconhecido'),
            channel: 'whatsapp',
            status: 'error',
            createdBy: currentUser?.id || null
          });
        } catch {}
      }
    }
  };

  const sendGeneralCommunication = async () => {
    try {
      setIsSendingSingleComm(true);
      const user = users.find(u => u.id === selectedCommUserId);
      if (!user) throw new Error('Selecione um destinatário');
      if (!user.whatsapp) throw new Error('Destinatário sem WhatsApp');
      const base = commsMessage || '';
      const ctx = { ...getTemplateContext(), userName: user.name || '' };
      const message = compileTemplate(base, ctx);
      const phone = formatPhoneBR(user.whatsapp);
      await sendTextViaEvolution(phone, message);

      if (addCommunication) {
        await addCommunication({
          type: 'communication',
          userId: user.id,
          message,
          channel: 'whatsapp',
          status: 'sent',
          createdBy: currentUser?.id || null
        });
      }
      setCommFeedback({ type: 'success', text: `Mensagem enviada para ${user.name}.` });
      setTimeout(() => setCommFeedback(null), 2000);
    } catch (err) {
      console.error('Erro ao enviar comunicado:', err);
      setCommFeedback({ type: 'error', text: 'Erro ao enviar comunicado: ' + err.message });
      setTimeout(() => setCommFeedback(null), 3000);
      if (addCommunication && selectedCommUserId) {
        try {
          await addCommunication({
            type: 'communication',
            userId: selectedCommUserId,
            message: 'Falha: ' + (err?.message || 'erro desconhecido'),
            channel: 'whatsapp',
            status: 'error',
            createdBy: currentUser?.id || null
          });
        } catch {}
      }
    } finally {
      setIsSendingSingleComm(false);
    }
  };

  const getEligibleCommUsers = () => {
    if (selectAllCommUsers) {
      return (users || []).filter(u => !u.isAdmin && !!u.whatsapp);
    }
    if (!selectedCommRound) return [];
    const list = getRoundParticipants(selectedCommRound) || [];
    return list
      .filter(p => {
        const u = users.find(x => x.id === p.userId);
        if (!u?.whatsapp) return false;
        if (commPaymentFilter === 'paid') return !!p.paid;
        if (commPaymentFilter === 'pending') return !p.paid;
        return true;
      })
      .map(p => users.find(x => x.id === p.userId))
      .filter(Boolean);
  };

  const handleToggleSelectAllComm = (checked) => {
    setSelectAllCommUsers(checked);
    if (checked) {
      const eligible = (users || []).filter(u => !u.isAdmin && !!u.whatsapp);
      setCommSelectedUserIds(eligible.map(u => u.id));
      setSelectedCommUserId('');
    } else {
      setCommSelectedUserIds([]);
    }
  };

  const toggleCommUser = (userId, checked) => {
    setCommSelectedUserIds(prev => {
      const set = new Set(prev);
      if (checked) set.add(userId); else set.delete(userId);
      return Array.from(set);
    });
  };

  const getCommRecipients = () => {
    if (selectAllCommUsers) {
      const eligible = (users || []).filter(u => !u.isAdmin && !!u.whatsapp);
      const sel = new Set(commSelectedUserIds);
      return eligible
        .filter(u => sel.has(u.id))
        .map(u => ({ userId: u.id, paid: false }));
    }
    if (!selectedCommRound) return [];
    const list = getRoundParticipants(selectedCommRound) || [];
    return list.filter(p => {
      const u = users.find(x => x.id === p.userId);
      if (!u?.whatsapp) return false;
      if (commPaymentFilter === 'paid') return !!p.paid;
      if (commPaymentFilter === 'pending') return !p.paid;
      return true;
    });
  };

  const sendMassCommunications = async () => {
    try {
      const recipients = getCommRecipients();
      if (!commsMessage) throw new Error('Digite a mensagem a enviar.');
      if (recipients.length === 0) throw new Error('Nenhum destinatário selecionado.');
      setIsSendingMassComms(true);
      let okCount = 0;
      let failCount = 0;
      for (const p of recipients) {
        const user = users.find(u => u.id === p.userId);
        const ctx = { ...getTemplateContext(), userName: user?.name || '' };
        const msg = compileTemplate(commsMessage || '', ctx);
        const phone = formatPhoneBR(user.whatsapp);
        try {
          await sendTextViaEvolution(phone, msg);
          okCount++;
          if (addCommunication) {
            await addCommunication({ type: 'communication', userId: user.id, roundId: selectAllCommUsers ? null : selectedCommRound, message: msg, channel: 'whatsapp', status: 'sent', createdBy: currentUser?.id || null });
          }
        } catch (e) {
          failCount++;
          if (addCommunication) {
            try { await addCommunication({ type: 'communication', userId: user.id, roundId: selectAllCommUsers ? null : selectedCommRound, message: 'Falha: ' + (e?.message || 'erro'), channel: 'whatsapp', status: 'error', createdBy: currentUser?.id || null }); } catch {}
          }
        }
        await new Promise(r => setTimeout(r, commsDelayMs));
      }
      alert(`Envio concluído: ${okCount} sucesso, ${failCount} falhas.`);
    } catch (err) {
      alert('Erro no envio em massa: ' + err.message);
    } finally {
      setIsSendingMassComms(false);
    }
  };

  const getBrandName = () => (settings?.brandName || 'Bolão Brasileiro 2025');

  // Formata datas vindas como string ISO ou Firestore Timestamp
  const formatPtBrFlexible = (value) => {
    try {
      if (!value) return '';
      let dt = null;
      if (value && typeof value.toDate === 'function') dt = value.toDate();
      else if (value && typeof value === 'object' && typeof value.seconds === 'number') dt = new Date(value.seconds * 1000);
      else dt = new Date(value);
      if (isNaN(dt.getTime())) return '';
      return dt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '';
    }
  };

  const buildRankingLink = (roundId) => {
    const base = commAppLink || (typeof window !== 'undefined' ? window.location.origin : '');
    if (!roundId) return base;
    const url = new URL(base);
    // Preserva host e esquema, força query para ranking da rodada
    url.searchParams.set('view', 'user');
    url.searchParams.set('tab', 'ranking');
    url.searchParams.set('round', roundId);
    return url.toString();
  };

  const getTemplateContext = () => {
    const fallbackRound = !selectedCommRound
      ? (rounds.find(r => r.status === 'open')
        || rounds.find(r => r.status === 'upcoming')
        || ([...rounds].sort((a, b) => ((b?.number ?? 0) - (a?.number ?? 0)))[0])
        || null)
      : null;
    const round = selectedCommRound ? rounds.find(r => r.id === selectedCommRound) : fallbackRound;
    const roundName = round?.name || 'Rodada';
    const user = selectedCommUserId ? users.find(u => u.id === selectedCommUserId) : null;
    const userName = user?.name || '{NOME}';
    const link = commAppLink || (typeof window !== 'undefined' ? window.location.origin : '');
    const deadline = round?.closeAt ? formatPtBrFlexible(round?.closeAt) : '{LIMITE}';
    const publish = round?.createdAt ? formatPtBrFlexible(round?.createdAt) : '{DIVULGACAO}';
    const ranking = round?.id ? buildRankingLink(round?.id) : '{RANKING_URL}';
    const brand = getBrandName();
    // Inclui também chaves em maiúsculas esperadas pelos templates
    return {
      roundName,
      userName,
      link,
      deadline,
      publish,
      ranking,
      brand,
      RODADA: roundName,
      NOME: userName,
      LINK: link,
      LIMITE: deadline,
      DIVULGACAO: publish,
      RANKING_URL: ranking,
      BRAND: brand
    };
  };

  const buildTemplateText = (key, mode = 'rich') => {
    const context = getTemplateContext();
    return buildTemplateTextUtil(key, mode, context);
  };

  const applyTemplate = (key, mode = 'rich') => {
    const round = selectedCommRound ? rounds.find(r => r.id === selectedCommRound) : null;
    if (key === 'final-result') {
      if (!round || round.status !== 'finished') {
        alert('Apenas rodadas com status "Finalizada" permitem gerar o Resultado Final.');
        return;
      }
    }
    const text = buildTemplateText(key, mode);
    setCommsMessage(text);
    setCommSelectedTemplateKey(key);
  };

  const copyTemplate = async (key, mode = 'plain') => {
    try {
      const text = buildTemplateText(key, mode);
      await navigator.clipboard.writeText(text);
      alert('Texto copiado para a área de transferência.');
    } catch (e) {
      alert('Não foi possível copiar o texto.');
    }
  };

  const handleSaveWhatsAppMessage = async () => {
    try {
      // validações básicas
      
      const dataToSave = {
        whatsappMessage: whatsappMessage,
        betValue: parseFloat(betValue),
        chargeMessageTemplate: chargeMessageTemplate,
        devolution: {
          link: devolutionLink,
          instanceName: devolutionInstance,
          token: devolutionToken
        },
        maintenanceMode: !!maintenanceMode,
        maintenanceMessage: maintenanceMessage,
        maintenanceUntil: maintenanceUntilInput ? Date.parse(maintenanceUntilInput) : null,
        maintenanceAllowedIps: (maintenanceAllowedIps || '').split(',').map(s => s.trim()).filter(Boolean),
        maintenanceSchedule: {
          start: maintenanceScheduleStart ? Date.parse(maintenanceScheduleStart) : null,
          end: maintenanceScheduleEnd ? Date.parse(maintenanceScheduleEnd) : null
        },
        whatsapp: {
          provider: whatsappProvider,
          apiToken: whatsappApiToken,
          number: whatsappNumber,
          notifyEnabled: !!whatsappNotifyEnabled,
          notifyEvents: whatsappNotifyEvents,
          defaultTemplates: { confirm: whatsappMessage, charge: chargeMessageTemplate }
        },
        betConfig: {
          minBet: parseFloat(minBet) || null,
          maxBet: parseFloat(maxBet) || null,
          bonus: { enabled: !!bonusEnabled, percent: parseFloat(bonusPercent) || 0 },
          fees: { adminPercent: parseFloat(adminFeePercent) || 10, establishmentPercent: parseFloat(establishmentPercent) || 5 },
          typesLimitsText: limitsByTypeText || ''
        },
        payment: {
          provider: paymentProvider,
          mercadopago: { webhookUrl: mpWebhookUrl },
          methods: { pix: !!paymentPixEnabled, card: !!paymentCardEnabled },
          transactionFeePercent: parseFloat(transactionFeePercent) || 0,
          allowedIps: (paymentAllowedIps || '').split(',').map(s => s.trim()).filter(Boolean),
          signatureHeaderName,
          retries: parseInt(paymentRetries) || 3,
          timeoutMs: parseInt(paymentTimeoutMs) || 10000
        },
        abTests: {
          enabled: !!abTestsEnabled,
          experiments: { newDashboard: Number(experimentDashboardPercent) || 0, paymentFlowV2: Number(experimentPaymentFlowPercent) || 0 }
        },
        rulesText,
        scoringCriteria,
        tiebreakRules,
        termsOfUse,
        systemPolicies,
        limitsRestrictions,
        complianceConfig
      };

      // Buscar o documento de settings
      const settingsSnapshot = await getDocs(collection(db, 'settings'));
      let settingsId = null;
      if (settingsSnapshot.empty) {
        const docRef = await addDoc(collection(db, 'settings'), { ...dataToSave, createdAt: serverTimestamp() });
        settingsId = docRef.id;
      } else {
        settingsId = settingsSnapshot.docs[0].id;
        await updateDoc(doc(db, 'settings', settingsId), dataToSave);
      }

      // Log de manutenção (toggle)
      try {
        const prevMaintenance = !!settings?.maintenanceMode;
        const nextMaintenance = !!dataToSave.maintenanceMode;
        if (prevMaintenance !== nextMaintenance) {
          await addDoc(collection(db, 'logs'), {
            type: 'maintenance_toggle',
            maintenance: nextMaintenance,
            actorId: currentUser?.id || null,
            actorName: currentUser?.name || 'Admin',
            message: maintenanceMessage,
            until: maintenanceUntilInput ? Date.parse(maintenanceUntilInput) : null,
            createdAt: serverTimestamp()
          });
        }
      } catch (logErr) {
        console.warn('Falha ao registrar log de manutenção:', logErr);
      }

      // Histórico de alterações
      try {
        const prev = settings || {};
        const keysToCheck = ['whatsappMessage','chargeMessageTemplate','betValue','devolution','maintenanceMode','maintenanceMessage','maintenanceUntil','maintenanceAllowedIps','maintenanceSchedule','whatsapp','betConfig','payment','abTests','rulesText','scoringCriteria','tiebreakRules','termsOfUse','systemPolicies','limitsRestrictions','complianceConfig'];
        const changedFields = [];
        keysToCheck.forEach(k => {
          const prevVal = prev ? prev[k] : undefined;
          if (JSON.stringify(prevVal) !== JSON.stringify(dataToSave[k])) changedFields.push(k);
        });
        if (changedFields.length > 0) {
          await addDoc(collection(db, 'settings_history'), {
            changedFields,
            actorId: currentUser?.id || null,
            actorName: currentUser?.name || 'Admin',
            createdAt: serverTimestamp()
          });
        }
      } catch (histErr) {
        console.warn('Falha ao registrar histórico:', histErr);
      }

      alert('✅ Configurações atualizadas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      alert('❌ Erro ao salvar: ' + (error?.message || 'erro'));
    }
  };

  const generateTop5PDF = async (roundId) => {
    try {
      setPdfLoadingRoundId('top5-' + roundId);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      const data = getRoundDashboardData(roundId);
      if (!data) { alert('⚠️ Rodada inválida ou não finalizada.'); return; }

      const { round, ranking, winners, prizePerWinner, prizePool, paidCount } = data;
      if (!ranking || ranking.length === 0) { alert('⚠️ Não há participantes pagos nesta rodada.'); return; }
      const top5 = ranking.slice(0, 5);

      // Paleta
      const primary = [22, 163, 74];
      const primaryDark = [16, 122, 56];
      const gray700 = [55, 65, 81];
      const lightBg = [248, 250, 252];
      const border = [229, 231, 235];
      const stripe = [245, 247, 250];

      // Helper: truncar com elipse respeitando largura
      const truncate = (txt, maxW, fontSize = 10, fontStyle = 'normal') => {
        if (!txt) return '-';
        pdf.setFontSize(fontSize);
        pdf.setFont(undefined, fontStyle);
        if (pdf.getTextWidth(txt) <= maxW) return txt;
        const ellipsis = '…';
        let low = 0, high = txt.length, best = ellipsis;
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          const candidate = txt.slice(0, mid) + ellipsis;
          if (pdf.getTextWidth(candidate) <= maxW) { best = candidate; low = mid + 1; } else { high = mid - 1; }
        }
        return best;
      };

      // Metadados
      try { pdf.setProperties && pdf.setProperties({ title: `Top 5 — ${round.name}`, subject: 'Ranking da Rodada', author: 'Bolão Brasileirão 2025' }); } catch (_) {}

      // Cabeçalho
      const drawHeader = () => {
        pdf.setFillColor(...primary);
        pdf.rect(0, 0, pageWidth, 26, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('TOP 5 — BOLÃO BRASILEIRÃO 2025', margin, 11);
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'normal');
        pdf.text(round.name, margin, 19);
        pdf.setFontSize(9);
        pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - margin, 11, { align: 'right' });
        pdf.setTextColor(0, 0, 0);
        return 32;
      };

      // Cards resumo
      const drawSummary = (y) => {
        const gap = 6;
        const cardW = (contentWidth - gap) / 2;
        const cardH = 20;
        const cards = [
          { title: 'Cartelas pagas', value: String(paidCount) },
          { title: 'Premiação total (85%)', value: `R$ ${prizePool.toFixed(2)}` },
        ];
        let x = margin;
        cards.forEach((c) => {
          pdf.setFillColor(...lightBg);
          pdf.setDrawColor(...border);
          pdf.roundedRect(x, y, cardW, cardH, 3, 3, 'FD');
          pdf.setFontSize(8);
          pdf.setTextColor(...gray700);
          pdf.text(c.title, x + 8, y + 8);
          pdf.setFont(undefined, 'bold');
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          pdf.text(c.value, x + 8, y + 15);
          pdf.setFont(undefined, 'normal');
          x += cardW + gap;
        });
        return y + cardH + 10;
      };

      let y = drawHeader();
      y = drawSummary(y);

      // Tabela Top 5
      const cols = [
        { key: 'pos', label: 'COLOCAÇÃO', w: 22, align: 'center' },
        { key: 'name', label: 'NOMES', w: contentWidth - 22 - 70 - 32, align: 'left' },
        { key: 'est', label: 'ESTABELECIMENTO', w: 70, align: 'left' },
        { key: 'pts', label: 'PONTUAÇÃO', w: 32, align: 'center' },
      ];

      const rowH = 10; // linhas mais altas
      const headerH = 12;
      const tableH = headerH + rowH * top5.length;
      pdf.setFillColor(...lightBg);
      pdf.setDrawColor(...border);
      pdf.roundedRect(margin, y, contentWidth, tableH + 8, 4, 4, 'FD');

      // Títulos
      let x = margin + 8;
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      cols.forEach((col) => {
        const headerX = x + (col.align === 'center' ? col.w / 2 : col.align === 'right' ? col.w : 0);
        pdf.text(col.label, headerX, y + 8, { align: col.align });
        x += col.w;
      });

      // Divisores verticais
      pdf.setDrawColor(...border);
      let sepX = margin + 8;
      cols.forEach((col, i) => {
        if (i > 0) {
          pdf.line(sepX, y + headerH, sepX, y + headerH + rowH * top5.length + 4);
        }
        sepX += col.w;
      });

      // Linhas
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);

      let rowTop = y + headerH + 4;
      top5.forEach((item, idx) => {
        // fundo listrado
        if (idx % 2 === 1) {
          pdf.setFillColor(...stripe);
          pdf.rect(margin + 3, rowTop - 7, contentWidth - 6, rowH, 'F');
        }

        // medal para top 3
        const medalColors = [
          [234, 179, 8],
          [148, 163, 184],
          [217, 119, 6],
        ];
        const startX = margin + 8;
        const posCellW = cols[0].w;
        if (idx < 3) {
          pdf.setFillColor(...medalColors[idx]);
          const centerX = startX + posCellW / 2;
          pdf.circle(centerX, rowTop - 2, 3, 'F');
        }

        const userName = item.user?.name || '-';
        const est = establishments.find((e) => e.id === item.establishmentId)?.name || '-';
        const pts = item.points;

        let cx = margin + 8;
        const cells = [
          { text: String(idx + 1), w: cols[0].w, align: 'center', style: 'bold' },
          { text: truncate(userName, cols[1].w - 2), w: cols[1].w, align: 'left' },
          { text: truncate(est, cols[2].w - 2), w: cols[2].w, align: 'left' },
          { text: String(pts), w: cols[3].w, align: 'center' },
        ];

        cells.forEach((cell) => {
          if (cell.style === 'bold') pdf.setFont(undefined, 'bold');
          else pdf.setFont(undefined, 'normal');
          const tx = cx + (cell.align === 'center' ? cell.w / 2 : cell.align === 'right' ? cell.w - 1 : 1);
          const ty = rowTop;
          pdf.text(cell.text, tx, ty, { align: cell.align });
          cx += cell.w;
        });

        // destaque campeão
        if (idx === 0) {
          pdf.setDrawColor(...primaryDark);
          pdf.setLineWidth(0.3);
          pdf.line(margin + 4, rowTop + 2, margin + contentWidth - 4, rowTop + 2);
        }

        rowTop += rowH;
      });

      // Rodapé
      pdf.setFontSize(8);
      pdf.setTextColor(...gray700);
      pdf.text('Relatório Top 5 — Bolão Brasileirão 2025', margin, pageHeight - 8);

      pdf.save(`Top5_${round.name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar Top 5 PDF:', err);
      alert('❌ Erro ao gerar PDF Top 5: ' + err.message);
    } finally {
      setPdfLoadingRoundId(null);
    }
  };



  const generateRoundPDF = async (roundId) => {
    try {
      setPdfLoadingRoundId(roundId);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      const round = rounds.find(r => r.id === roundId);
      if (!round) return;

      const allParticipants = getRoundParticipants(roundId);
      const paidParticipants = allParticipants.filter(p => p.paid);
      
      if (paidParticipants.length === 0) {
        alert('⚠️ Nenhum participante com pagamento confirmado nesta rodada!');
        return;
      }

      // Índices para acesso O(1)
      const usersById = new Map(users.map(u => [u.id, u]));
      const teamsById = new Map(teams.map(t => [t.id, t]));
      const predsByKey = new Map();
      predictions.forEach(p => {
        const key = `${p.userId}-${p.roundId}-${p.matchId}-${p.cartelaCode || 'ANTIGA'}`;
        if (!predsByKey.has(key)) predsByKey.set(key, p);
      });

      // Paleta e helpers de layout
      const primary = [22, 163, 74]; // verde
      const primaryDark = [16, 122, 56];
      const gray700 = [55, 65, 81];
      const lightBg = [248, 250, 252];
      const border = [229, 231, 235];

      // Metadados
      try { pdf.setProperties && pdf.setProperties({ title: `Bolão - ${round.name}`, subject: 'Cartelas confirmadas', author: 'Bolão Brasileirão 2025' }); } catch (_) {}

      const drawPageHeader = () => {
        pdf.setFillColor(...primary);
        pdf.rect(0, 0, pageWidth, 24, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('BOLÃO BRASILEIRÃO 2025', margin, 10);
        pdf.setFontSize(11);
        pdf.text(round.name, margin, 18);
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - margin, 10, { align: 'right' });
        pdf.setTextColor(0, 0, 0);
        return 30; // y inicial do conteúdo
      };

      const drawSummaryCards = (y) => {
        const gap = 6;
        const cardW = (contentWidth - gap * 2) / 3;
        const cardH = 18;
        const cards = [
          { title: 'Cartelas pagas', value: paidParticipants.length },
          { title: 'Participantes únicos', value: [...new Set(paidParticipants.map(p => p.userId))].length },
          { title: 'Estabelecimentos', value: [...new Set(paidParticipants.map(p => p.establishmentId))].length || 0 },
        ];
        let x = margin;
        cards.forEach(c => {
          pdf.setFillColor(...lightBg);
          pdf.setDrawColor(...border);
          pdf.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');
          pdf.setFontSize(8);
          pdf.setTextColor(...gray700);
          pdf.text(c.title, x + 6, y + 7);
          pdf.setFont(undefined, 'bold');
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          pdf.text(String(c.value), x + 6, y + 14);
          pdf.setFont(undefined, 'normal');
          x += cardW + gap;
        });
        return y + cardH + 8;
      };

      let y = drawPageHeader();
      y = drawSummaryCards(y);

      // Agrupar cartelas por usuário
      const userCartelas = {};
      paidParticipants.forEach(participant => {
        const userId = participant.userId;
        if (!userCartelas[userId]) userCartelas[userId] = [];
        userCartelas[userId].push(participant);
      });

      const ensureSpace = (needed) => {
        if (y + needed > pageHeight - 18) {
          pdf.addPage();
          y = drawPageHeader();
        }
      };

      let participantIndex = 0;
      const matches = round.matches || [];
      const rowH = 6;

      // Para cada usuário
      Object.entries(userCartelas).forEach(([userId, cartelas]) => {
        const user = usersById.get(userId);
        if (!user) return;
        
        cartelas.forEach((participant) => {
          participantIndex++;

          const rowsPerCol = Math.ceil((matches?.length || 0) / 2) || 0;
          // Limites da coluna esquerda (dados do participante)
          const leftTextX = margin + 8;
          const leftColRight = margin + contentWidth / 2 - 8;
          const leftTextMaxW = leftColRight - leftTextX;

          // Quebra de linha para evitar invasão da coluna direita
          const establishment = establishments.find(e => e.id === participant.establishmentId);
          const estText = establishment ? `Estabelecimento: ${establishment.name}` : '';
          const estLines = estText ? (pdf.splitTextToSize ? pdf.splitTextToSize(estText, leftTextMaxW) : [estText]) : [];

          // Altura dinâmica do cabeçalho para não sobrepor palpites
          const lineSpacing = 6;
          const headerH = 24 + lineSpacing * estLines.length;
          const innerPad = 10;
          const tableH = rowsPerCol * rowH;
          const cardH = headerH + tableH + innerPad;

          ensureSpace(cardH + 8);

          // Cartão do participante
          pdf.setFillColor(...lightBg);
          pdf.setDrawColor(...border);
          pdf.roundedRect(margin, y, contentWidth, cardH, 3, 3, 'FD');

          // Cabeçalho
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text(`${participantIndex}. ${user.name}`, margin + 8, y + 8);

          // Bloco de informações (com largura limitada à metade esquerda)
          pdf.setFontSize(9);
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(...gray700);
          let infoY = y + 14;
          pdf.text(`Cartela: ${participant.cartelaCode}`, leftTextX, infoY);
          if (estLines.length) {
            estLines.forEach((line) => {
              infoY += lineSpacing;
              pdf.text(line, leftTextX, infoY);
            });
          }
          pdf.setTextColor(0, 0, 0);

          // Badge de status PAGO
          const badgeW = 24, badgeH = 8;
          const badgeX = margin + contentWidth - badgeW - 8;
          const badgeY = y + 6;
          pdf.setFillColor(...primary);
          pdf.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(9);
          pdf.setFont(undefined, 'bold');
          pdf.text('PAGO', badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
          pdf.setFont(undefined, 'normal');

          // Palpites em 2 colunas (começam abaixo do cabeçalho dinâmico)
          const startPredY = y + headerH;
          const col1X = margin + 10;
          const col2X = margin + contentWidth / 2 + 6;
          matches?.forEach((match, idx) => {
            const homeTeam = teamsById.get(match.homeTeamId);
            const awayTeam = teamsById.get(match.awayTeamId);
            const pred = predsByKey.get(`${user.id}-${roundId}-${match.id}-${participant.cartelaCode}`);
            if (!pred) return;

            const col = idx < rowsPerCol ? 1 : 2;
            const row = idx % rowsPerCol;
            const x = col === 1 ? col1X : col2X;
            const yLine = startPredY + row * rowH;
            pdf.setFontSize(9);
            const matchText = `${idx + 1}) ${homeTeam?.name} ${pred.homeScore} x ${pred.awayScore} ${awayTeam?.name}`;
            pdf.text(matchText, x, yLine);
          });

          y += cardH + 8;
        });
      });

      // Rodapé
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(120, 120, 120);
        pdf.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
      }

      // Salvar PDF
      const safeRound = (round.name || 'Rodada').replace(/[^\w]+/g, '_');
      pdf.save(`Bolao_${safeRound}_CONFIRMADOS_${new Date().getTime()}.pdf`);
      alert(`✅ PDF gerado com sucesso!\n\n📄 ${paidParticipants.length} cartelas confirmadas\n👥 ${Object.keys(userCartelas).length} participantes únicos`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('❌ Erro ao gerar PDF: ' + error.message);
    } finally {
      setPdfLoadingRoundId(null);
    }
  };

  // Gerar relatório financeiro por rodada e estabelecimento
  const generateFinancialReportPDF = async (roundId, establishmentId) => {
    try {
      if (!roundId) {
        alert('Selecione uma rodada para gerar o relatório.');
        return;
      }
      if (!establishmentId || establishmentId === 'all' || establishmentId === 'none') {
        alert('Selecione um estabelecimento específico para gerar o relatório.');
        return;
      }

      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;

      const round = rounds.find(r => r.id === roundId);
      const establishment = establishments.find(e => e.id === establishmentId);
      const betValue = settings?.betValue || 15;

      // Participantes filtrados por estabelecimento
      const allParticipants = getRoundParticipants(roundId);
      const estParticipants = allParticipants.filter(p => p.establishmentId === establishmentId);
      const paidParticipants = estParticipants.filter(p => p.paid);
      const pendingParticipants = estParticipants.filter(p => !p.paid);

      const totalCount = estParticipants.length;
      const paidCount = paidParticipants.length;
      const pendingCount = pendingParticipants.length;
      const establishmentFee = paidParticipants.length * betValue * 0.05;

      // Paleta
      const primary = [22, 163, 74];
      const gray700 = [55, 65, 81];
      const lightBg = [248, 250, 252];
      const border = [229, 231, 235];
      const danger = [239, 68, 68];
      const success = [16, 185, 129];
      const orange = [251, 146, 60];
      const orangeLight = [255, 237, 213];

      const drawPageHeader = () => {
        pdf.setFillColor(...primary);
        pdf.rect(0, 0, pageWidth, 24, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text('Controle Financeiro', margin, 10);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const subtitle = `Rodada: ${round?.name || '-'}  •  Estabelecimento: ${establishment?.name || '-'}`;
        pdf.text(subtitle, margin, 18);
        pdf.setTextColor(0, 0, 0);
        return 32;
      };

      const drawCards = (y) => {
        const gap = 8;
        const cardW = (contentWidth - gap * 3) / 4;
        const cardH = 20;
        const cards = [
          { title: 'Participantes', value: String(totalCount), fill: lightBg, stroke: border, text: [0,0,0] },
          { title: 'Pagos', value: String(paidCount), fill: lightBg, stroke: border, text: [0,0,0] },
          { title: 'Pendentes', value: String(pendingCount), fill: lightBg, stroke: border, text: [0,0,0] },
          { title: 'Comissão (5%)', value: `R$ ${establishmentFee.toFixed(2)}`, fill: orangeLight, stroke: [252, 196, 120], text: [180, 83, 9] },
        ];
        let x = margin;
        cards.forEach(c => {
          pdf.setFillColor(...c.fill);
          pdf.setDrawColor(...c.stroke);
          pdf.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');
          pdf.setFontSize(8);
          pdf.setTextColor(...gray700);
          pdf.text(c.title, x + 6, y + 7);
          pdf.setFont(undefined, 'bold');
          pdf.setFontSize(12);
          pdf.setTextColor(...c.text);
          pdf.text(c.value, x + 6, y + 15);
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(0,0,0);
          x += cardW + gap;
        });
        return y + cardH + 10;
      };

      const drawBars = (y) => {
        const boxH = 26;
        pdf.setFillColor(...lightBg);
        pdf.setDrawColor(...border);
        pdf.roundedRect(margin, y, contentWidth, boxH, 2, 2, 'FD');
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...gray700);
        pdf.text('Resumo visual', margin + 6, y + 8);
        pdf.setTextColor(0,0,0);

        const startX = margin + 90;
        const innerW = contentWidth - (startX - margin) - 10;
        const scale = totalCount > 0 ? innerW / totalCount : 0;
        const barH = 6;
        const y1 = y + 12;
        const y2 = y + 12 + barH + 4;

        // Pago
        pdf.setFontSize(9);
        pdf.setTextColor(...gray700);
        pdf.text('Pagos', startX - 10, y1 + barH - 1);
        pdf.setFillColor(...success);
        pdf.rect(startX, y1, Math.max(2, paidCount * scale), barH, 'F');
        pdf.setTextColor(255,255,255);
        pdf.setFont(undefined, 'bold');
        pdf.text(String(paidCount), startX + Math.max(10, paidCount * scale) - 4, y1 + barH - 1, { align: 'right' });

        // Pendentes
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(...gray700);
        pdf.text('Pendentes', startX - 10, y2 + barH - 1);
        pdf.setFillColor(...danger);
        pdf.rect(startX, y2, Math.max(2, pendingCount * scale), barH, 'F');
        pdf.setTextColor(255,255,255);
        pdf.setFont(undefined, 'bold');
        pdf.text(String(pendingCount), startX + Math.max(10, pendingCount * scale) - 4, y2 + barH - 1, { align: 'right' });
        pdf.setTextColor(0,0,0);

        return y + boxH + 10;
      };

      const drawTable = (yStart) => {
        let y = yStart;
        const headerH = 10;
        const rowH = 9.5;
        const colParticipanteX = margin + 4;
        const colCartelaX = margin + Math.min(140, contentWidth * 0.54);
        const colValorX = margin + contentWidth - 45;
        const colStatusX = margin + contentWidth - 15;
        const colValorW = 30;
        const colStatusW = 22;
        const colValorCenterX = colValorX + colValorW / 2;
        const colStatusCenterX = colStatusX + colStatusW / 2;

        const drawHeader = () => {
          pdf.setFillColor(...primary);
          pdf.rect(margin, y, contentWidth, headerH, 'F');
          pdf.setFontSize(10);
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(255,255,255);
          pdf.text('Participante', colParticipanteX, y + headerH / 2, { baseline: 'middle' });
          pdf.text('Cartela', colCartelaX, y + headerH / 2, { baseline: 'middle' });
          pdf.text('Valor', colValorCenterX, y + headerH / 2, { baseline: 'middle', align: 'center' });
          pdf.text('Status', colStatusCenterX, y + headerH / 2, { baseline: 'middle', align: 'center' });
          pdf.setTextColor(0,0,0);
          y += headerH;
        };

        const ensurePage = () => {
          if (y > pageHeight - 25) {
            pdf.addPage();
            y = drawPageHeader();
            drawHeader();
          }
        };

        drawHeader();

        estParticipants.forEach((p, idx) => {
          ensurePage();

          // Zebra row background
          if (idx % 2 === 0) {
            pdf.setFillColor(250,250,250);
            pdf.rect(margin, y, contentWidth, rowH, 'F');
          }

          const user = users.find(u => u.id === p.userId);
          const nome = user?.name || `Participante ${idx + 1}`;
          const cartelaRaw = p.cartelaCode || 'ANTIGA';
          const cartela = cartelaRaw.length > 24 ? `${cartelaRaw.slice(0, 24)}…` : cartelaRaw;

          // Text columns
          pdf.setFontSize(9.5);
          pdf.setFont(undefined, 'normal');
          const textY = y + rowH / 2 + 0.5;
          pdf.text(nome, colParticipanteX, textY, { baseline: 'middle' });
          pdf.text(cartela, colCartelaX, textY, { baseline: 'middle' });
          pdf.text(`R$ ${betValue.toFixed(2)}`, colValorCenterX, textY, { baseline: 'middle', align: 'center' });

          // Status pill
          const status = p.paid ? 'Pago' : 'Não pago';
          const pillFill = p.paid ? success : danger;
          const pillText = [255,255,255];
          const pillPad = 3;
          const pillW = pdf.getTextWidth(status) + pillPad * 2;
          const pillH = 6.5;
          const pillX = colStatusCenterX - pillW / 2;
          const pillY = y + (rowH - pillH) / 2;
          pdf.setFillColor(...pillFill);
          pdf.roundedRect(pillX, pillY, pillW, pillH, 3, 3, 'F');
          pdf.setTextColor(...pillText);
          pdf.setFontSize(9);
          pdf.setFont(undefined, 'bold');
          pdf.text(status, colStatusCenterX, textY - 0.5, { align: 'center', baseline: 'middle' });
          pdf.setTextColor(0,0,0);
          pdf.setFont(undefined, 'normal');

          y += rowH;
        });

        return y;
      };

      let y = drawPageHeader();
      y = drawCards(y);
      y = drawBars(y);
      y = drawTable(y);

      // Devedores
      if (pendingParticipants.length > 0) {
        if (y > pageHeight - 40) {
          pdf.addPage();
          y = drawPageHeader();
        }
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...danger);
        pdf.text('Devedores (não pagos)', margin, y + 10);
        pdf.setTextColor(0,0,0);
        y += 16;
        pdf.setFontSize(9.5);
        pendingParticipants.forEach((p, i) => {
          const user = users.find(u => u.id === p.userId);
          pdf.text(`• ${user?.name || 'Participante'}  —  Cartela: ${p.cartelaCode || 'ANTIGA'}`, margin, y);
          y += 6.5;
        });
      }

      const fileName = `Financeiro_${round?.name || 'Rodada'}_${establishment?.name || 'Estabelecimento'}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Erro ao gerar PDF financeiro:', error);
      alert('❌ Erro ao gerar PDF.');
    }
  };

  // Relatório oficial da rodada finalizada: cards por participante com Jogo | Palpite | Placar Final | Pts
  const generateFinalizedRoundReportPDF = async (roundId) => {
    try {
      if (!roundId) { alert('Selecione uma rodada finalizada.'); return; }
      setPdfLoadingRoundId('final-' + roundId);

      const round = rounds.find(r => r.id === roundId);
      if (!round || round.status !== 'finished') {
        alert('Rodada inválida ou ainda não finalizada.');
        return;
      }

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      const participants = getRoundParticipants(roundId).filter(p => p.paid);
      if (participants.length === 0) { alert('Não há participantes pagos nesta rodada.'); return; }

      const usersById = new Map(users.map(u => [u.id, u]));
      const teamsById = new Map(teams.map(t => [t.id, t]));
      const matches = round.matches || [];

      // Paleta
      const primary = [22, 163, 74];
      const gray700 = [55, 65, 81];
      const lightBg = [248, 250, 252];
      const border = [229, 231, 235];

      // Helpers
      const formatDate = (ts) => {
        try {
          const d = round?.closeAt ? new Date(round.closeAt) : (round?.createdAt?.toDate ? round.createdAt.toDate() : new Date());
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${dd}/${mm}/${yyyy}`;
        } catch { return new Date().toLocaleDateString('pt-BR'); }
      };

      const extractRoundNumber = () => {
        const m = (round.name || '').match(/(\d+)/);
        return m ? m[1] : '';
      };

      const resultLabel = (home, away) => {
        if (home > away) return 'Mandante';
        if (home < away) return 'Visitante';
        return 'Empate';
      };

      const scorePoints = (ph, pa, rh, ra) => {
        if (ph === rh && pa === ra) return 3;
        return resultLabel(ph, pa) === resultLabel(rh, ra) ? 1 : 0;
      };

      // Metadados
      try {
        pdf.setProperties({
          title: `Relatório Rodada ${round.name}`,
          subject: 'Comprovante oficial da rodada',
          author: 'Bolão Brasileirão 2025',
          keywords: 'bolão, brasileirão, relatório, rodada, pdf',
          creator: 'Bolão App'
        });
      } catch {}

      const drawHeader = () => {
        pdf.setFillColor(...primary);
        pdf.rect(0, 0, pageWidth, 26, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(14);
        pdf.text('BOLÃO BRASILEIRÃO 2025', margin, 11);
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(11);
        pdf.text(`Relatório da ${round.name}`, margin, 19);
        pdf.setFontSize(9);
        pdf.text(`Data da rodada: ${formatDate(round?.closeAt)}`, pageWidth - margin, 11, { align: 'right' });
        pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - margin, 19, { align: 'right' });
        pdf.setTextColor(0,0,0);
        return 32;
      };

      const drawFooterPagination = () => {
        const pageCount = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(120, 120, 120);
          pdf.setFont(undefined, 'normal');
          pdf.text(`Relatório oficial da rodada • v1.0`, margin, pageHeight - 8);
          pdf.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
        }
      };

      let y = drawHeader();

      // Lista completa – cartões por participante
      const rowH = 7; // altura por linha de jogo
      const headerH = 22; // cabeçalho do cartão
      const tablePad = 8; // padding interno

      // Tabela com 4 colunas: Jogo | Palpite | Placar Final | Pts
      const cols = [
        { key: 'jogo', label: 'Jogo', w: contentWidth * 0.40, align: 'left' },
        { key: 'palpite', label: 'Palpite', w: contentWidth * 0.22, align: 'center' },
        { key: 'placar', label: 'Placar Final', w: contentWidth * 0.26, align: 'center' },
        { key: 'pts', label: 'Pts', w: contentWidth * 0.12, align: 'center' },
      ];

      let idx = 0;
      participants.forEach((p) => {
        const user = usersById.get(p.userId);
        if (!user) return;

        const tableH = rowH * matches.length + tablePad * 2 + 12; // inclui header da tabela
        const cardH = headerH + tableH;
        if (y + cardH > pageHeight - 16) { pdf.addPage(); y = drawHeader(); }

        // Cartão
        pdf.setFillColor(...lightBg);
        pdf.setDrawColor(...border);
        pdf.roundedRect(margin, y, contentWidth, cardH, 3, 3, 'FD');

        // Cabeçalho do cartão
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${++idx}. ${user.name}`, margin + 8, y + 10);
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(...gray700);
        const est = establishments.find(e => e.id === p.establishmentId)?.name || 'Nenhum';
        pdf.text(`Cartela: ${p.cartelaCode}  •  Estabelecimento: ${est}`, margin + 8, y + 16);
        pdf.setTextColor(0,0,0);

        // Tabela – cabeçalho
        let tx = margin + 8;
        let ty = y + headerH + 10;
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(9);
        cols.forEach((c) => {
          const hx = tx + (c.align === 'center' ? c.w/2 : c.align === 'right' ? c.w - 1 : 1);
          pdf.text(c.label, hx, ty, { align: c.align });
          tx += c.w;
        });

        // Linhas da tabela
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(9);
        let rowY = ty + 6;
        matches.forEach((m, i) => {
          const home = teamsById.get(m.homeTeamId);
          const away = teamsById.get(m.awayTeamId);
          const pred = predictions.find(x => x.userId === p.userId && x.roundId === roundId && x.matchId === m.id && (x.cartelaCode || 'ANTIGA') === p.cartelaCode);
          const homeScore = m.homeScore ?? 0;
          const awayScore = m.awayScore ?? 0;
          const ph = pred?.homeScore ?? '-';
          const pa = pred?.awayScore ?? '-';
          const pts = pred && m.finished && m.homeScore != null && m.awayScore != null ? scorePoints(ph, pa, homeScore, awayScore) : 0;

          let cx = margin + 8;
          const cells = [
            { text: `${i+1}) ${home?.name} x ${away?.name}`, w: cols[0].w, align: 'left' },
            { text: `${ph} x ${pa}`, w: cols[1].w, align: 'center' },
            { text: `${homeScore} x ${awayScore}`, w: cols[2].w, align: 'center' },
            { text: String(pts), w: cols[3].w, align: 'center' },
          ];
          cells.forEach((cell) => {
            const tx2 = cx + (cell.align === 'center' ? cell.w/2 : cell.align === 'right' ? cell.w - 1 : 1);
            pdf.text(cell.text, tx2, rowY, { align: cell.align });
            cx += cell.w;
          });
          rowY += rowH;
        });

        y += cardH + 8;
      });

      // Rodapé com paginação e metadados
      drawFooterPagination();

      // Nome do arquivo padrão: Relatorio_Rodada_[Número]_[Data].pdf
      const num = extractRoundNumber();
      const dateSafe = formatDate(round?.closeAt).replace(/\//g, '-');
      const fileName = `Relatorio_Rodada_${num || round.name.replace(/\s+/g,'_')}_${dateSafe}.pdf`;
      pdf.save(fileName);

    } catch (err) {
      console.error('Erro ao gerar PDF finalizado:', err);
      alert('Erro ao gerar PDF: ' + (err?.message || 'erro'));
    } finally {
      setPdfLoadingRoundId(null);
    }
  };

  const handleResetTeams = async () => {
    if (!confirm('⚠️ ATENÇÃO!\n\nIsso irá DELETAR todos os times cadastrados e recarregar apenas os 20 times oficiais da Série A 2025.\n\n⚠️ CUIDADO: Se houver rodadas criadas com times antigos, elas podem ficar quebradas!\n\nDeseja continuar?')) {
      return;
    }
    try {
      await resetTeamsToSerieA2025();
      alert('✅ Times resetados com sucesso!\n\n20 times oficiais da Série A 2025 foram carregados.');
    } catch (error) {
      alert('❌ Erro ao resetar times: ' + error.message);
    }
  };

  // Corrige times duplicados por nome e relinca rodadas para o ID canônico
  const handleFixTeamsDuplicates = async () => {
    if (!confirm('🔧 Esta ação vai unificar times com o mesmo nome e atualizar todas as rodadas para apontarem ao time canônico.\n\nÉ recomendado fazer backup antes. Deseja continuar?')) {
      return;
    }
    try {
      // Buscar todos os times
      const teamsSnap = await getDocs(collection(db, 'teams'));
      const allTeams = teamsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const normalizeName = (s) => s?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const groups = {};
      allTeams.forEach(t => {
        const key = normalizeName(t.name || '');
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
      });

      const idMap = {}; // id duplicado => id canônico
      const toDelete = [];
      Object.values(groups).forEach(group => {
        if (group.length > 1) {
          const canonical = group[0];
          group.slice(1).forEach(dup => {
            idMap[dup.id] = canonical.id;
            toDelete.push(dup.id);
          });
        }
      });

      if (Object.keys(idMap).length === 0) {
        alert('✅ Nenhuma duplicação encontrada por nome.');
        return;
      }

      // Atualizar todas as rodadas substituindo IDs duplicados pelo canônico
      const roundsSnap = await getDocs(collection(db, 'rounds'));
      let roundsChanged = 0;
      for (const rd of roundsSnap.docs) {
        const data = rd.data();
        const matches = Array.isArray(data.matches) ? data.matches : [];
        let changed = false;
        const updatedMatches = matches.map(m => {
          const home = idMap[m.homeTeamId] ? idMap[m.homeTeamId] : m.homeTeamId;
          const away = idMap[m.awayTeamId] ? idMap[m.awayTeamId] : m.awayTeamId;
          if (home !== m.homeTeamId || away !== m.awayTeamId) changed = true;
          return { ...m, homeTeamId: home, awayTeamId: away };
        });
        if (changed) {
          await updateDoc(doc(db, 'rounds', rd.id), { matches: updatedMatches });
          roundsChanged++;
        }
      }

      // Remover times duplicados
      for (const id of toDelete) {
        await deleteDoc(doc(db, 'teams', id));
      }

      alert(`✅ Correção concluída!\nTimes unificados: ${toDelete.length}\nRodadas atualizadas: ${roundsChanged}`);
    } catch (error) {
      console.error('Erro ao corrigir duplicados:', error);
      alert('❌ Erro ao corrigir duplicados: ' + error.message);
    }
  };

  const saveRound = async (roundData) => {
    try {
      if (editingRound) {
        await updateRound(editingRound.id, roundData);
      } else {
        await addRound(roundData);
      }
      setEditingRound(null);
      setShowRoundForm(false);
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const saveTeam = async (teamData) => {
    try {
      if (editingTeam) {
        await updateTeam(editingTeam.id, teamData);
      } else {
        await addTeam(teamData);
      }
      setEditingTeam(null);
      setShowTeamForm(false);
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const saveEstablishment = async (estData) => {
    try {
      if (editingEstablishment) {
        await updateEstablishment(editingEstablishment.id, estData);
      } else {
        await addEstablishment(estData);
      }
      setEditingEstablishment(null);
      setShowEstablishmentForm(false);
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const savePassword = async (newPassword) => {
    try {
      await updateUser(editingPassword.id, { password: newPassword });
      alert('✅ Senha alterada com sucesso!');
      setEditingPassword(null);
    } catch (error) {
      alert('❌ Erro ao alterar senha: ' + error.message);
    }
  };

  const changeStatus = async (id, newStatus) => {
    const round = rounds.find(r => r.id === id);
    if (round) {
      await updateRound(id, { ...round, status: newStatus });
      
      if (newStatus === 'finished') {
        setTimeout(() => {
          generateRoundPDF(id);
        }, 500);
        // Geração automática do relatório oficial da rodada finalizada
        setTimeout(() => {
          generateFinalizedRoundReportPDF(id);
        }, 1200);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: 'Futura', color: 'bg-gray-100 text-gray-700', icon: '🔜' },
      open: { text: 'Aberta', color: 'bg-green-100 text-green-700', icon: '✅' },
      closed: { text: 'Fechada', color: 'bg-yellow-100 text-yellow-700', icon: '🔒' },
      finished: { text: 'Finalizada', color: 'bg-blue-100 text-blue-700', icon: '🏁' }
    };
    return badges[status] || badges.upcoming;
  };

  const isRoundTimedClosed = (round) => {
    if (!round?.closeAt) return false;
    const ts = new Date(round.closeAt).getTime();
    return !isNaN(ts) && Date.now() >= ts;
  };

  const formatDateTime = (value) => {
    if (!value) return null;
    const dt = new Date(value);
    if (isNaN(dt.getTime())) return null;
    return dt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  const openRounds = rounds.filter(r => r.status === 'open' && !isRoundTimedClosed(r));
  // Rodadas disponíveis para palpites: abertas ou futuras, desde que não fechadas pelo cronograma
  const predictableRounds = rounds.filter(r => (r.status === 'open' || r.status === 'upcoming') && !isRoundTimedClosed(r));
  const closedRounds = rounds.filter(r => r.status === 'closed' || (r.status === 'open' && isRoundTimedClosed(r)));
  const finishedRounds = rounds.filter(r => r.status === 'finished');
  const upcomingRounds = rounds.filter(r => r.status === 'upcoming');

  const renderRoundCard = (round) => {
    const effectiveStatus = (round.status === 'open' && isRoundTimedClosed(round)) ? 'closed' : round.status;
    const badge = getStatusBadge(effectiveStatus);
    const isExpanded = expandedAdminRounds[round.id];
    
    return (
      <div key={round.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold">{round.name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.icon} {badge.text}</span>
              </div>
              <p className="text-gray-600">{round.matches?.length || 0} jogos</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {round.status === 'upcoming' && <button onClick={() => changeStatus(round.id, 'open')} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm">Abrir</button>}
              {round.status === 'open' && <button onClick={() => changeStatus(round.id, 'closed')} className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm">Fechar</button>}
              {round.status === 'closed' && <button onClick={() => changeStatus(round.id, 'finished')} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm">Finalizar</button>}
              {(round.status === 'closed' || round.status === 'finished') && (
                <button
                  onClick={() => generateRoundPDF(round.id)}
                  className={`p-2 rounded-lg ${pdfLoadingRoundId === round.id ? 'bg-purple-100 text-purple-400 opacity-60 cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                  title="Gerar PDF"
                  aria-label="Gerar PDF"
                  aria-busy={pdfLoadingRoundId === round.id}
                  disabled={pdfLoadingRoundId === round.id}
                >
                  {pdfLoadingRoundId === round.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Download size={18} />
                  )}
                </button>
              )}
              {round.status === 'finished' && (
                <button
                  onClick={() => generateFinalizedRoundReportPDF(round.id)}
                  className={`p-2 rounded-lg ${pdfLoadingRoundId === ('final-' + round.id) ? 'bg-purple-100 text-purple-400 opacity-60 cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                  title="Relatório oficial da rodada (PDF)"
                  aria-label="Relatório oficial da rodada (PDF)"
                  aria-busy={pdfLoadingRoundId === ('final-' + round.id)}
                  disabled={pdfLoadingRoundId === ('final-' + round.id)}
                >
                  {pdfLoadingRoundId === ('final-' + round.id) ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <FileText size={18} />
                  )}
                </button>
              )}
              <button onClick={() => { setEditingRound(round); setShowRoundForm(true); }} className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Edit2 size={18} /></button>
              <button onClick={() => confirm('Excluir?') && deleteRound(round.id)} className="p-2 bg-red-100 text-red-700 rounded-lg"><Trash2 size={18} /></button>
              <button onClick={() => toggleAdminRound(round.id)} className="p-2 bg-gray-100 text-gray-700 rounded-lg">
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </div>
          
          {isExpanded && (
            <div className="space-y-2 mt-4 pt-4 border-t">
              {round.matches?.map((match) => {
                const homeTeam = teams.find(t => t.id === match.homeTeamId);
                const awayTeam = teams.find(t => t.id === match.awayTeamId);
                return (
                  <div key={match.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img src={getSafeLogo(homeTeam)} alt={homeTeam?.name || 'Time'} className="w-8 h-8 object-contain rounded bg-white ring-1 ring-gray-200" width={32} height={32} />
                      <span className="font-medium">{homeTeam?.name}</span>
                      <span className="text-gray-400 font-bold">VS</span>
                      <img src={getSafeLogo(awayTeam)} alt={awayTeam?.name || 'Time'} className="w-8 h-8 object-contain rounded bg-white ring-1 ring-gray-200" width={32} height={32} />
                      <span className="font-medium">{awayTeam?.name}</span>
                    </div>
                    {match.finished && match.homeScore !== null && (
                      <div className="bg-green-600 text-white px-3 py-1 rounded-full font-bold">{match.homeScore} x {match.awayScore}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <Trophy size={32} />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Painel Administrativo</h1>
              <p className="text-green-100 text-xs sm:text-sm">Bolão Brasileirão 2025</p>
            </div>
          </div>
          <button onClick={() => { logout(); setView('login'); }} className="w-full sm:w-auto justify-center flex items-center gap-2 bg-green-700 px-3 py-2 rounded-lg text-sm">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex gap-3 sm:gap-6 overflow-x-auto -mx-2 px-2 sm:mx-0">
            {['dashboard', 'rounds', 'teams', 'establishments', 'participants', 'financial', 'communications', 'settings'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 sm:py-4 px-2 text-sm sm:text-base border-b-2 font-medium whitespace-nowrap ${activeTab === tab ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}>
                {tab === 'dashboard' && <><Trophy className="inline mr-2" size={18} />Dashboard</>}
                {tab === 'rounds' && <><Calendar className="inline mr-2" size={18} />Rodadas</>}
                {tab === 'teams' && <><Users className="inline mr-2" size={18} />Times</>}
                {tab === 'establishments' && <><Store className="inline mr-2" size={18} />Estabelecimentos</>}
                {tab === 'participants' && <><TrendingUp className="inline mr-2" size={18} />Participantes</>}
                {tab === 'financial' && <><DollarSign className="inline mr-2" size={18} />Financeiro</>}
                {tab === 'communications' && <><Megaphone className="inline mr-2" size={18} />Comunicados</>}
                {tab === 'settings' && <><Edit2 className="inline mr-2" size={18} />Configurações</>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {activeTab === 'dashboard' && (
          <div>
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Dashboard por Rodada</h2>
                <p className="text-gray-600 mt-1">Premiação: 85% • Admin: 10% • Estabelecimentos: 5% por palpite vinculado</p>
              </div>
              <div className="w-full md:w-64">
                <label className="block text-xs md:text-sm font-medium mb-2">Selecione a Rodada</label>
                <select
                  value={selectedDashboardRound || ''}
                  onChange={(e) => setSelectedDashboardRound(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-white"
                >
                  {rounds.filter(r => r.status === 'finished' || r.status === 'closed').length === 0 && (
                    <option value="">Nenhuma rodada fechada ou finalizada</option>
                  )}
                  {rounds
                    .filter(r => r.status === 'finished' || r.status === 'closed')
                    .sort((a, b) => {
                      const toTs = (r) => {
                        if (r?.closeAt) {
                          const t = new Date(r.closeAt).getTime();
                          if (!isNaN(t)) return t;
                        }
                        const ca = r?.createdAt;
                        if (ca && typeof ca.toDate === 'function') return ca.toDate().getTime();
                        if (ca && typeof ca === 'object' && typeof ca.seconds === 'number') return ca.seconds * 1000;
                        return typeof r?.number === 'number' ? r.number : 0;
                      };
                      return toTs(b) - toTs(a);
                    })
                    .map(round => (
                      <option key={round.id} value={round.id}>
                        {round.name} {round.status === 'closed' ? '• Parcial' : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            
            {(() => {
              if (!dashboardData) {
                return (
                  <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed">
                    <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-xl font-semibold mb-2">Nenhuma rodada fechada ou finalizada</h3>
                    <p className="text-gray-500">O dashboard aparece para rodadas fechadas (parcial) e finalizadas (final)</p>
                  </div>
                );
              }

              // Calcular comissões individuais por estabelecimento
              const establishmentCommissions = {};
              dashboardData.ranking.forEach(r => {
                if (r.establishmentId) {
                  if (!establishmentCommissions[r.establishmentId]) {
                    establishmentCommissions[r.establishmentId] = {
                      total: 0,
                      count: 0
                    };
                  }
                  // 5% sobre CADA palpite deste estabelecimento
                  establishmentCommissions[r.establishmentId].total += dashboardData.betValue * 0.05;
                  establishmentCommissions[r.establishmentId].count += 1;
                }
              });

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <DollarSign className="text-blue-500" size={32} />
                      </div>
                      <p className="text-blue-600 text-sm font-medium mb-1">Total Arrecadado</p>
                      <p className="text-3xl font-bold text-blue-900">R$ {dashboardData.totalPaid.toFixed(2)}</p>
                      <p className="text-xs text-blue-600 mt-1">{dashboardData.paidCount} pagamentos</p>
                    </div>

                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Trophy className="text-green-500" size={32} />
                    </div>
                    <p className="text-green-600 text-sm font-medium mb-1">Premiação (85%)</p>
                    <p className="text-3xl font-bold text-green-900">R$ {dashboardData.prizePool.toFixed(2)}</p>
                    {dashboardData.round.status === 'finished' && (
                      <p className="text-xs text-green-600 mt-1">Para {dashboardData.winners.length} vencedor(es)</p>
                    )}
                    {dashboardData.round.status === 'closed' && (
                      <p className="text-xs text-green-600 mt-1">Definida na finalização da rodada</p>
                    )}
                  </div>

                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Award className="text-purple-500" size={32} />
                      </div>
                      <p className="text-purple-600 text-sm font-medium mb-1">Taxa Admin (10%)</p>
                      <p className="text-3xl font-bold text-purple-900">R$ {dashboardData.adminFee.toFixed(2)}</p>
                    </div>

                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Store className="text-orange-500" size={32} />
                      </div>
                      <p className="text-orange-600 text-sm font-medium mb-1">Estabelecimentos (5%)</p>
                      <p className="text-3xl font-bold text-orange-900">R$ {dashboardData.establishmentFee.toFixed(2)}</p>
                      <p className="text-xs text-orange-600 mt-1">Por palpite vinculado</p>
                    </div>

                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Users className="text-gray-500" size={32} />
                      </div>
                      <p className="text-gray-600 text-sm font-medium mb-1">Participantes</p>
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.totalParticipations}</p>
                      <p className="text-xs text-gray-600 mt-1">{dashboardData.paidCount} pagos</p>
                    </div>
                  </div>

                  {/* Comissões por Estabelecimento */}
                  {Object.keys(establishmentCommissions).length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Store size={24} className="text-orange-600" />
                        Comissões por Estabelecimento (5% por palpite vinculado)
                      </h3>
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>💡 Como funciona:</strong> Cada estabelecimento recebe 5% apenas dos palpites feitos nele.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.entries(establishmentCommissions).map(([estId, data]) => {
                          const est = establishments.find(e => e.id === estId);
                          if (!est) return null;
                          return (
                            <div key={estId} className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <p className="font-bold text-lg flex-1">{est.name}</p>
                                <Store className="text-orange-600 flex-shrink-0" size={20} />
                              </div>
                              <p className="text-3xl font-bold text-orange-600 mb-2">R$ {data.total.toFixed(2)}</p>
                              <div className="text-xs text-gray-600 space-y-1">
                                <p><strong>{data.count}</strong> palpite(s) neste estabelecimento</p>
                                <p className="text-orange-700 font-medium">
                                  {data.count} × R$ {dashboardData.betValue.toFixed(2)} × 5% = R$ {data.total.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Total de comissões:</strong> R$ {Object.values(establishmentCommissions).reduce((sum, d) => sum + d.total, 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Vencedores / Premiação (apenas quando finalizada) */}
                  {dashboardData.round.status === 'finished' && (
                  <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-xl p-8 text-white">
                    <div className="flex items-center gap-3 mb-6">
                      <Trophy size={48} />
                      <div>
                        <h3 className="text-3xl font-bold">Premiação - {dashboardData.round.name}</h3>
                        <p className="text-yellow-100">
                          {dashboardData.winners.length > 1 ? `${dashboardData.winners.length} Vencedores (Empate)` : 'Campeão da Rodada'}
                        </p>
                      </div>
                    </div>

                    {dashboardData.winners.length === 0 ? (
                      <div className="bg-white bg-opacity-20 rounded-xl p-8 text-center">
                        <p className="text-xl font-semibold">Nenhum participante pagou</p>
                        <p className="text-yellow-100 mt-2">Aguardando confirmação de pagamentos</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-white bg-opacity-20 rounded-xl p-6">
                          <div className="text-center mb-4">
                            <p className="text-yellow-100 text-sm font-medium">PRÊMIO {dashboardData.winners.length > 1 ? 'POR VENCEDOR' : 'TOTAL'} (85%)</p>
                            <p className="text-5xl font-bold mt-2">R$ {dashboardData.prizePerWinner.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="bg-white bg-opacity-20 rounded-xl p-6">
                          <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Award size={24} />
                            {dashboardData.winners.length > 1 ? 'Vencedores' : '🏆 Campeão'}
                          </h4>
                          <div className="space-y-3">
                            {dashboardData.winners.map((winner) => {
                              const est = establishments.find(e => e.id === winner.establishmentId);
                              return (
                                <div key={`${winner.user.id}-${winner.cartelaCode}`} className="bg-white rounded-lg p-4 text-gray-900 flex justify-between items-center">
                                  <div>
                                    <p className="font-bold text-lg">{winner.user.name}</p>
                                    <p className="text-sm text-gray-600">{winner.user.whatsapp}</p>
                                    <p className="text-xs text-blue-600 font-mono mt-1">🎫 {winner.cartelaCode}</p>
                                    {est && <p className="text-xs text-orange-600 mt-1">🏪 {est.name}</p>}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-2xl font-bold text-green-600">{winner.points} pts</p>
                                    <p className="text-sm font-medium text-green-700">R$ {dashboardData.prizePerWinner.toFixed(2)}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {dashboardData.winners.length > 1 && (
                          <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
                            <p className="text-sm">⚠️ Empate! Premiação dividida igualmente entre os vencedores.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  {/* Ranking Completo da Rodada */}
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">Ranking Completo</h3>
                        <div className="flex items-center gap-2">
                          {dashboardData.round.status === 'closed' && (
                            <span className="text-xs font-medium text-yellow-600">Resultados parciais (rodada fechada)</span>
                          )}
                          <button
                            onClick={() => generateTop5PDF(dashboardData.round.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm ${pdfLoadingRoundId === 'top5-' + dashboardData.round.id ? 'bg-purple-100 text-purple-400 opacity-60 cursor-not-allowed' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                            aria-busy={pdfLoadingRoundId === 'top5-' + dashboardData.round.id}
                            disabled={pdfLoadingRoundId === 'top5-' + dashboardData.round.id}
                          >
                            {pdfLoadingRoundId === 'top5-' + dashboardData.round.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Download size={16} />
                            )}
                            <span>Top 5 PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estabelecimento</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pontos</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Prêmio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {dashboardData.ranking.map((item, index) => {
                            const isWinner = dashboardData.winners.some(w => w.user.id === item.user.id && w.cartelaCode === item.cartelaCode);
                            const est = establishments.find(e => e.id === item.establishmentId);
                            
                            // Calcular posição considerando empates
                            let position = 1;
                            let uniqueScores = [];
                            
                            // Coletar pontuações únicas maiores que a pontuação atual
                            for (let i = 0; i < dashboardData.ranking.length; i++) {
                              if (dashboardData.ranking[i].points > item.points && !uniqueScores.includes(dashboardData.ranking[i].points)) {
                                uniqueScores.push(dashboardData.ranking[i].points);
                              }
                            }
                            
                            // A posição é o número de pontuações únicas maiores + 1
                            position = uniqueScores.length + 1;
                            
                            return (
                              <tr key={`${item.user.id}-${item.cartelaCode}`} onClick={() => openAdminPlayerModal(dashboardData.round.id, item)} className={`${isWinner ? 'bg-yellow-50' : ''} cursor-pointer hover:bg-gray-50`}>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold">{position}º</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-medium">{item.user.name}</p>
                                    <p className="text-xs text-gray-500">{item.user.whatsapp}</p>
                                    <p className="text-xs text-blue-600 font-mono">🎫 {item.cartelaCode}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  {est ? (
                                    <span className="text-sm text-orange-600 font-medium">{est.name}</span>
                                  ) : (
                                    <span className="text-xs text-gray-400">Nenhum</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="font-bold text-green-600">{item.points}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {isWinner ? (
                                    <span className="font-bold text-green-600">R$ {dashboardData.prizePerWinner.toFixed(2)}</span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'establishments' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Estabelecimentos/Indicadores</h2>
                <p className="text-gray-600 mt-1">Gerenciar locais que indicam participantes • Comissão: 5%</p>
              </div>
              <button onClick={() => { setEditingEstablishment(null); setShowEstablishmentForm(true); }} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm sm:text-base">
                <Plus size={20} /> Novo Estabelecimento
              </button>
            </div>
            {establishments.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed">
                <Store className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold mb-2">Nenhum estabelecimento cadastrado</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {establishments.map((est) => (
                  <div key={est.id} className="bg-white rounded-lg shadow-sm border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="bg-orange-100 p-2 rounded-md">
                          <Store className="text-orange-600" size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[12rem] sm:max-w-[16rem]">{est.name}</p>
                          <p className="text-[11px] text-gray-600 truncate">{est.contact || 'Sem contato'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingEstablishment(est); setShowEstablishmentForm(true); }} className="p-1.5 bg-blue-100 text-blue-700 rounded-md"><Edit2 size={14} /></button>
                        <button onClick={() => confirm('Excluir?') && deleteEstablishment(est.id)} className="p-1.5 bg-red-100 text-red-700 rounded-md"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Telefone</span>
                        <span className="font-medium truncate">{est.phone || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Comissão</span>
                        <span className="font-bold text-orange-600">{est.commission || 5}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Configurações</h2>
            <div className="bg-white rounded-xl border p-2 mb-6">
              <div className="flex gap-3 overflow-x-auto">
                {[
                  { key: 'whatsapp', label: 'Configurações do WhatsApp', icon: Send },
                  { key: 'maintenance', label: 'Modo de Manutenção', icon: AlertCircle },
                  { key: 'rules', label: 'Regras', icon: FileText },
                  { key: 'bet', label: 'Valor de Aposta', icon: DollarSign },
                  { key: 'payment', label: 'API de Pagamento', icon: Key },
                  { key: 'abtests', label: 'Testes A/B', icon: TrendingUp }
                ].map(t => (
                  <button key={t.key} onClick={() => setSettingsTab(t.key)} className={`px-3 py-2 rounded-lg border ${settingsTab === t.key ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-700'}`}>
                    <span className="inline-flex items-center gap-2"><t.icon size={18} />{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* WhatsApp Settings */}
            {settingsTab === 'whatsapp' && (
              <div className="space-y-6 max-w-3xl">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-bold mb-4">Credenciais e Notificações</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Provedor do WhatsApp</label>
                      <select value={whatsappProvider} onChange={(e) => setWhatsappProvider(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
                        <option value="evolution">Evolution API</option>
                        <option value="cloud">WhatsApp Cloud API</option>
                      </select>
                    </div>
                  </div>
                  {whatsappProvider === 'cloud' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Token da API</label>
                        <input type="text" value={whatsappApiToken} onChange={(e) => setWhatsappApiToken(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="token" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Número associado (WhatsApp)</label>
                        <input type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="5599999999999" />
                      </div>
                    </div>
                  )}
                  {whatsappProvider === 'evolution' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium mb-2">Link do servidor (Evolution)</label>
                        <input type="text" value={devolutionLink} onChange={(e) => setDevolutionLink(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="https://seu-servidor-evolution" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Instância (Evolution)</label>
                        <input type="text" value={devolutionInstance} onChange={(e) => setDevolutionInstance(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="minha-instancia" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Token (Evolution)</label>
                        <input type="text" value={devolutionToken} onChange={(e) => setDevolutionToken(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="apikey" />
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={whatsappNotifyEnabled} onChange={(e) => setWhatsappNotifyEnabled(e.target.checked)} />
                      <span>Ativar notificações</span>
                    </label>
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!whatsappNotifyEvents.charges} onChange={(e) => setWhatsappNotifyEvents({ ...whatsappNotifyEvents, charges: e.target.checked })} />Cobranças</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!whatsappNotifyEvents.approvals} onChange={(e) => setWhatsappNotifyEvents({ ...whatsappNotifyEvents, approvals: e.target.checked })} />Confirmações</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!whatsappNotifyEvents.results} onChange={(e) => setWhatsappNotifyEvents({ ...whatsappNotifyEvents, results: e.target.checked })} />Resultados</label>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-bold mb-4">Template de Mensagens Padrão</h3>
                  <p className="text-gray-600 text-sm mb-4">Use {'{RODADA}'}, {'{CARTELA}'}, {'{PALPITES}'}.</p>
                  <textarea value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} className="w-full px-4 py-3 border rounded-lg font-mono text-sm" rows="8" />
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Template de Cobrança</label>
                    <textarea value={chargeMessageTemplate} onChange={(e) => setChargeMessageTemplate(e.target.value)} className="w-full px-4 py-3 border rounded-lg font-mono text-sm" rows="6" />
                  </div>
                  <div className="flex sm:justify-end gap-3 mt-4">
                    <button onClick={() => { setWhatsappApiToken(''); setWhatsappNumber(''); setDevolutionLink(''); setDevolutionInstance(''); setDevolutionToken(''); setWhatsappNotifyEnabled(true); setWhatsappNotifyEvents({ charges: true, approvals: true, results: true }); setWhatsappMessage(settings?.whatsappMessage || '🏆 *BOLÃO BRASILEIRÃO 2025*\n\n📋 *{RODADA}*\n🎫 *Cartela: {CARTELA}*\n✅ Confirmado!\n\n{PALPITES}\n\n💰 R$ 15,00\n⚠️ *Não pode alterar após pagamento*\n\nBoa sorte! 🍀'); setChargeMessageTemplate(settings?.chargeMessageTemplate || 'Olá {NOME},\n\nIdentificamos que o pagamento da sua cartela da {RODADA} ainda está pendente.\n\nValor: R$ {VALOR}\nCartela: {CARTELA}\n\nPor favor, conclua o pagamento para validar sua participação no ranking e na premiação. Obrigado! 🙏'); }} className="px-6 py-2 border rounded-lg inline-flex items-center gap-2"><RefreshCcw size={16} />Restaurar Padrões</button>
                    <button onClick={handleSaveWhatsAppMessage} className="px-6 py-2 bg-green-600 text-white rounded-lg">Salvar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance */}
            {settingsTab === 'maintenance' && (
              <div className="space-y-6 max-w-3xl">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-bold mb-4">Modo de Manutenção</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} /><span>Ativar</span></label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium mb-2">Mensagem</label>
                      <textarea value={maintenanceMessage} onChange={(e) => setMaintenanceMessage(e.target.value)} className="w-full px-4 py-3 border rounded-lg" rows="4" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Retorno Estimado</label>
                      <input type="datetime-local" value={maintenanceUntilInput} onChange={(e) => setMaintenanceUntilInput(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium mb-2">Acesso por IP (durante manutenção)</label>
                      <input type="text" value={maintenanceAllowedIps} onChange={(e) => setMaintenanceAllowedIps(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="127.0.0.1, 10.0.0.1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Agendar início</label>
                      <input type="datetime-local" value={maintenanceScheduleStart} onChange={(e) => setMaintenanceScheduleStart(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Agendar fim</label>
                      <input type="datetime-local" value={maintenanceScheduleEnd} onChange={(e) => setMaintenanceScheduleEnd(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                  </div>
                  <div className="flex sm:justify-end gap-3 mt-4">
                    <button onClick={() => { setMaintenanceMode(false); setMaintenanceMessage('Estamos realizando uma manutenção programada para melhorar sua experiência. Por favor, tente novamente em breve.'); setMaintenanceUntilInput(''); setMaintenanceAllowedIps(''); setMaintenanceScheduleStart(''); setMaintenanceScheduleEnd(''); }} className="px-6 py-2 border rounded-lg inline-flex items-center gap-2"><RefreshCcw size={16} />Restaurar Padrões</button>
                    <button onClick={handleSaveWhatsAppMessage} className="px-6 py-2 bg-green-600 text-white rounded-lg">Salvar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Rules */}
            {settingsTab === 'rules' && (
              <div className="space-y-6 max-w-3xl">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-bold mb-4">Termos, Políticas e Compliance</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Termos de Uso</label>
                      <textarea value={termsOfUse} onChange={(e) => setTermsOfUse(e.target.value)} className="w-full px-4 py-3 border rounded-lg text-sm" rows="4" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Políticas do Sistema</label>
                      <textarea value={systemPolicies} onChange={(e) => setSystemPolicies(e.target.value)} className="w-full px-4 py-3 border rounded-lg text-sm" rows="4" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Limites e Restrições</label>
                      <textarea value={limitsRestrictions} onChange={(e) => setLimitsRestrictions(e.target.value)} className="w-full px-4 py-3 border rounded-lg text-sm" rows="4" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Configurações de Compliance</label>
                      <textarea value={complianceConfig} onChange={(e) => setComplianceConfig(e.target.value)} className="w-full px-4 py-3 border rounded-lg text-sm" rows="4" />
                    </div>
                  </div>
                  <div className="flex sm:justify-end gap-3 mt-4">
                    <button onClick={() => { setTermsOfUse(''); setSystemPolicies(''); setLimitsRestrictions(''); setComplianceConfig(''); }} className="px-6 py-2 border rounded-lg inline-flex items-center gap-2"><RefreshCcw size={16} />Restaurar Padrões</button>
                    <button onClick={handleSaveWhatsAppMessage} className="px-6 py-2 bg-green-600 text-white rounded-lg">Salvar</button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText size={24} className="text-green-600" />Regras do Bolão</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => wrapSelection('**','**')} className="px-3 py-2 border rounded-lg text-sm font-semibold">N</button>
                      <button onClick={() => wrapSelection('*','*')} className="px-3 py-2 border rounded-lg text-sm italic">I</button>
                      <button onClick={() => makeList(false)} className="px-3 py-2 border rounded-lg text-sm">• Lista</button>
                      <button onClick={() => makeList(true)} className="px-3 py-2 border rounded-lg text-sm">1. Lista</button>
                    </div>
                    <textarea ref={rulesTextareaRef} value={rulesText} onChange={(e) => { initialLoadRef.current = false; setRulesText(e.target.value); }} className="w-full px-4 py-3 border rounded-lg text-sm" rows="8" />
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Prévia formatada</h4>
                      <div className="text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: markdownToHtml(rulesText) }} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-bold mb-4">Critérios de Pontuação</h3>
                  <textarea value={scoringCriteria} onChange={(e) => { initialLoadRef.current = false; setScoringCriteria(e.target.value); }} className="w-full px-4 py-3 border rounded-lg text-sm" rows="6" />
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg"><div className="text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: markdownToHtml(scoringCriteria) }} /></div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-bold mb-4">Regras de Desempate</h3>
                  <textarea value={tiebreakRules} onChange={(e) => { initialLoadRef.current = false; setTiebreakRules(e.target.value); }} className="w-full px-4 py-3 border rounded-lg text-sm" rows="6" />
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg"><div className="text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: markdownToHtml(tiebreakRules) }} /></div>
                  <div className="flex sm:justify-end gap-3 mt-4">
                    <button onClick={() => { setRulesText(DEFAULT_RULES_MD); setScoringCriteria(DEFAULT_SCORING_MD); setTiebreakRules(DEFAULT_TIEBREAK_MD); }} className="px-6 py-2 border rounded-lg inline-flex items-center gap-2"><RefreshCcw size={16} />Restaurar Padrões</button>
                    <button onClick={handleSaveWhatsAppMessage} className="px-6 py-2 bg-green-600 text-white rounded-lg">Salvar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Bet Value */}
            {settingsTab === 'bet' && (
              <div className="space-y-6 max-w-3xl">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><DollarSign size={24} className="text-green-600" />Valor de Aposta</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Valor por Cartela (R$)</label>
                      <input type="number" min="1" step="0.50" value={betValue} onChange={(e) => setBetValue(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Mínimo (R$)</label>
                      <input type="number" min="0" step="0.50" value={minBet} onChange={(e) => setMinBet(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Máximo (R$)</label>
                      <input type="number" min="0" step="0.50" value={maxBet} onChange={(e) => setMaxBet(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Limites por tipo de aposta</label>
                    <textarea value={limitsByTypeText} onChange={(e) => setLimitsByTypeText(e.target.value)} className="w-full px-4 py-3 border rounded-lg text-sm" rows="4" placeholder="Defina regras por tipo, ex.: Simples: máx 1 cartela; Duplas: máx 2, etc." />
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={!!bonusEnabled} onChange={(e) => setBonusEnabled(e.target.checked)} />
                      <span>Bônus ativo</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Bônus (%)</label>
                      <input type="number" min="0" max="100" step="0.5" value={bonusPercent} onChange={(e) => setBonusPercent(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                    <div className="hidden sm:block"></div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Taxa Admin (%)</label>
                      <input type="number" min="0" max="100" step="0.5" value={adminFeePercent} onChange={(e) => setAdminFeePercent(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Comissão Estabelecimento (%)</label>
                      <input type="number" min="0" max="100" step="0.5" value={establishmentPercent} onChange={(e) => setEstablishmentPercent(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                  </div>
                  <div className="flex sm:justify-end gap-3 mt-4">
                    <button onClick={() => { setBetValue(15); setMinBet(10); setMaxBet(100); setBonusEnabled(false); setBonusPercent(0); setAdminFeePercent(10); setEstablishmentPercent(5); setLimitsByTypeText(''); }} className="px-6 py-2 border rounded-lg inline-flex items-center gap-2"><RefreshCcw size={16} />Restaurar Padrões</button>
                    <button onClick={handleSaveWhatsAppMessage} className="px-6 py-2 bg-green-600 text-white rounded-lg">Salvar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Payment API */}
            {settingsTab === 'payment' && (
              <div className="space-y-6 max-w-3xl">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-bold mb-4">Pagamentos (Mercado Pago)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Provedor</label>
                      <select value={paymentProvider} onChange={(e) => setPaymentProvider(e.target.value)} className="w-full px-4 py-3 border rounded-lg">
                        <option value="mercadopago">Mercado Pago</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2"></div>
                  </div>
                  {paymentProvider === 'mercadopago' && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <p className="text-sm font-medium mb-2">Status da Conexão</p>
                        {mpConn.loading ? (
                          <p className="text-gray-500">Carregando...</p>
                        ) : mpConn.connected ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"><CheckCircle size={16} /> Conectado</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm"><XCircle size={16} /> Desconectado</span>
                        )}
                        <div className="mt-3">
                          <p className="text-sm font-medium">Conta Mercado Pago</p>
                          <p className="text-gray-700">{mpConn.nickname || '—'} <span className="text-gray-500">{mpConn.email || ''}</span></p>
                        </div>
                        <div className="mt-3 flex gap-2">
                          {!mpConn.connected ? (
                            <button onClick={connectMercadoPago} className="px-4 py-2 bg-blue-600 text-white rounded-lg inline-flex items-center gap-2"><ExternalLink size={16} /> Conectar minha conta</button>
                          ) : (
                            <button onClick={disconnectMercadoPago} className="px-4 py-2 border rounded-lg inline-flex items-center gap-2"><LogOut size={16} /> Desconectar conta</button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">A conexão é 100% automática via OAuth. Nenhum token é exposto no front-end.</p>
                      </div>
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <p className="text-sm font-medium mb-2">Total recebido no mês</p>
                        <p className="text-2xl font-bold text-green-700">R$ {monthlyTotal.toFixed(2)}</p>
                        <div className="mt-4">
                          <label className="block text-sm font-medium mb-2">Webhook URL</label>
                          <div className="flex items-center gap-2">
                            <input type="text" value={mpWebhookUrl} readOnly className="flex-1 px-4 py-3 border rounded-lg" />
                            <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(mpWebhookUrl); alert('URL copiada'); } catch {} }} className="px-3 py-2 border rounded-lg inline-flex items-center gap-2"><Copy size={16} />Copiar</button>
                          </div>
                          <p className="text-xs text-gray-600 mt-2">Cole esta URL no painel do Mercado Pago em Webhooks.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={paymentPixEnabled} onChange={(e) => setPaymentPixEnabled(e.target.checked)} />Pix</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={paymentCardEnabled} onChange={(e) => setPaymentCardEnabled(e.target.checked)} />Cartão</label>
                    <div>
                      <label className="block text-sm font-medium mb-2">Taxa de Transação (%)</label>
                      <input type="number" min="0" max="100" step="0.1" value={transactionFeePercent} onChange={(e) => setTransactionFeePercent(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">IPs permitidos (Webhook/Callbacks)</label>
                    <input type="text" value={paymentAllowedIps} onChange={(e) => setPaymentAllowedIps(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="187.191.64.0/20, 10.0.0.2" />
                  </div>
                  <div className="mt-4">
                    <button type="button" onClick={() => setShowAdvancedPayment(!showAdvancedPayment)} className="px-4 py-2 border rounded-lg">Configurações Avançadas</button>
                  </div>
                  {showAdvancedPayment && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Cabeçalho de Assinatura</label>
                        <input type="text" value={signatureHeaderName} onChange={(e) => setSignatureHeaderName(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="x-signature" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Tentativas</label>
                        <input type="number" min="0" step="1" value={paymentRetries} onChange={(e) => setPaymentRetries(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Timeout (ms)</label>
                        <input type="number" min="1000" step="100" value={paymentTimeoutMs} onChange={(e) => setPaymentTimeoutMs(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
                      </div>
                    </div>
                  )}
                  <div className="flex sm:justify-end gap-3 mt-4">
                    <button onClick={() => { setPaymentProvider('mercadopago'); setPaymentPixEnabled(true); setPaymentCardEnabled(false); setTransactionFeePercent(0); setPaymentAllowedIps(''); setSignatureHeaderName('x-signature'); setPaymentRetries(3); setPaymentTimeoutMs(10000); setShowAdvancedPayment(false); }} className="px-6 py-2 border rounded-lg inline-flex items-center gap-2"><RefreshCcw size={16} />Restaurar Padrões</button>
                    <button onClick={handleSaveWhatsAppMessage} className="px-6 py-2 bg-green-600 text-white rounded-lg">Salvar</button>
                  </div>
                </div>

                {/* Histórico de Pagamentos */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h4 className="text-md font-bold mb-3">Pagamentos realizados</h4>
                  {adminPayments.length === 0 ? (
                    <p className="text-gray-500 text-sm">Nenhum pagamento registrado ainda.</p>
                  ) : (
                    <div className="overflow-x-auto -mx-2 sm:mx-0">
                      <table className="min-w-[720px] w-full text-xs sm:text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Usuário</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Valor</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminPayments.slice(0,100).map((p) => {
                            const u = users.find(u => u.id === p.userId);
                            const dt = p.createdAt?.toDate ? p.createdAt.toDate() : null;
                            const dateStr = dt ? dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
                            return (
                              <tr key={p.id} className="border-b">
                                <td className="px-4 sm:px-6 py-3 sm:py-4">{dateStr}</td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4">{u?.name || p.userId}</td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4">R$ {(Number(p.amount) || 0).toFixed(2)}</td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                  {p.status === 'approved' ? (
                                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium"><CheckCircle size={16} /> Pago</span>
                                  ) : p.status === 'pending' ? (
                                    <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">Pendente</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium"><XCircle size={16} /> Recusado</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* A/B Tests */}
            {settingsTab === 'abtests' && (
              <div className="space-y-6 max-w-3xl">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-bold mb-4">Testes A/B</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={abTestsEnabled} onChange={(e) => setAbTestsEnabled(e.target.checked)} /><span>Ativar Testes A/B</span></label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Novo Dashboard (%)</label>
                      <input type="number" min="0" max="100" step="1" value={experimentDashboardPercent} onChange={(e) => setExperimentDashboardPercent(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Fluxo de Pagamento V2 (%)</label>
                      <input type="number" min="0" max="100" step="1" value={experimentPaymentFlowPercent} onChange={(e) => setExperimentPaymentFlowPercent(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                  </div>
                  <div className="flex sm:justify-end gap-3 mt-4">
                    <button onClick={() => { setAbTestsEnabled(false); setExperimentDashboardPercent(0); setExperimentPaymentFlowPercent(0); }} className="px-6 py-2 border rounded-lg inline-flex items-center gap-2"><RefreshCcw size={16} />Restaurar Padrões</button>
                    <button onClick={handleSaveWhatsAppMessage} className="px-6 py-2 bg-green-600 text-white rounded-lg">Salvar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Histórico de alterações */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border p-6 max-w-3xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><History size={20} />Histórico de Alterações</h3>
              {settingsHistory.length === 0 ? (
                <p className="text-sm text-gray-600">Nenhuma alteração registrada ainda.</p>
              ) : (
                <div className="space-y-3">
                  {settingsHistory.map(item => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <p className="text-sm text-gray-800"><span className="font-medium">Autor:</span> {item.actorName || 'Admin'}</p>
                      <p className="text-sm text-gray-800"><span className="font-medium">Campos:</span> {(item.changedFields || []).join(', ')}</p>
                      <p className="text-xs text-gray-600">{item.createdAt && typeof item.createdAt.toDate === 'function' ? item.createdAt.toDate().toLocaleString('pt-BR') : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'rounds' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold">Gerenciar Rodadas</h2>
              <button onClick={() => { setEditingRound(null); setShowRoundForm(true); }} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm sm:text-base">
                <Plus size={20} /> Nova Rodada
              </button>
            </div>
            {rounds.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold mb-2">Nenhuma rodada</h3>
              </div>
            ) : (
              <div className="space-y-8">
                {openRounds.length > 0 && <div><h3 className="text-lg font-semibold mb-3"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm mr-2">{openRounds.length}</span>Abertas</h3><div className="grid gap-4">{openRounds.map(renderRoundCard)}</div></div>}
                {closedRounds.length > 0 && <div><h3 className="text-lg font-semibold mb-3"><span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm mr-2">{closedRounds.length}</span>Fechadas</h3><div className="grid gap-4">{closedRounds.map(renderRoundCard)}</div></div>}
                {finishedRounds.length > 0 && <div><h3 className="text-lg font-semibold mb-3"><span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm mr-2">{finishedRounds.length}</span>Finalizadas</h3><div className="grid gap-4">{finishedRounds.map(renderRoundCard)}</div></div>}
                {upcomingRounds.length > 0 && <div><h3 className="text-lg font-semibold mb-3"><span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm mr-2">{upcomingRounds.length}</span>Futuras</h3><div className="grid gap-4">{upcomingRounds.map(renderRoundCard)}</div></div>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'teams' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Gerenciar Times</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${teams.length === 20 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {teams.length} times cadastrados
                  </span>
                  {teams.length !== 20 && (
                    <span className="text-sm text-orange-600">⚠️ Deve ter exatamente 20 times</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:items-end">

                <button onClick={handleFixTeamsDuplicates} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 text-sm sm:text-base">
                  <CheckCircle size={20} /> Corrigir duplicados
                </button>
                <button onClick={() => { setEditingTeam(null); setShowTeamForm(true); }} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm sm:text-base">
                  <Plus size={20} /> Novo Time
                </button>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold">Fila de Importação de Times</h3>
                  <p className="text-sm text-gray-600">Requisições pendentes aguardando aprovação</p>
                </div>
                <button onClick={submitImportRequestsFromApi} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
                  <RefreshCcw size={18} /> Buscar times da API
                </button>
              </div>
              <div className="space-y-2">
                {(teamImportRequests || []).filter(r => r.status === 'pending').length === 0 ? (
                  <div className="text-sm text-gray-500">Nenhuma solicitação pendente.</div>
                ) : (
                  (teamImportRequests || []).filter(r => r.status === 'pending').map(req => (
                    <div key={req.id} className="flex items-center justify-between border rounded p-3">
                      <div className="flex items-center gap-3">
                        <img src={getSafeLogo({ name: req.name, logo: req.logo })} alt={req.name} className="w-8 h-8 object-contain rounded bg-white ring-1 ring-gray-200" />
                        <div>
                          <div className="font-medium">{req.name}</div>
                          <div className="text-xs text-gray-500">{req.normalizedName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700">pendente</span>
                        <button onClick={() => approveImportRequest(req.id)} className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-sm">Aprovar</button>
                        <button onClick={() => {
                          const reason = window.prompt('Motivo da rejeição (opcional):') || '';
                          rejectImportRequest(req.id, reason);
                        }} className="text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-sm">Rejeitar</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {teams.map((team) => {
                const protectedStatuses = new Set(['open','closed','finished']);
                const isProtected = rounds.some(r => protectedStatuses.has(r?.status) && Array.isArray(r?.matches) && r.matches.some(m => m.homeTeamId === team.id || m.awayTeamId === team.id));
                return (
                  <div key={team.id} className="bg-white rounded-lg shadow-sm border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={getSafeLogo(team)} alt={team.name} className="w-12 h-12 object-contain rounded bg-white ring-1 ring-gray-200" width={48} height={48} />
                        <span className="font-medium truncate max-w-[12rem] sm:max-w-[16rem]">{team.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingTeam(team); setShowTeamForm(true); }} className="p-1.5 bg-blue-100 text-blue-700 rounded-md"><Edit2 size={14} /></button>
                        <button disabled={isProtected} onClick={() => !isProtected && confirm('Excluir?') && deleteTeam(team.id)} className={`p-1.5 rounded-md ${isProtected ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-100 text-red-700'}`} title={isProtected ? 'Time vinculado a rodadas — exclusão bloqueada' : 'Excluir'}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {isProtected && (<p className="text-[11px] text-amber-600 mt-1">Vinculado a rodadas ativas/fechadas/finalizadas</p>)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Participantes</h2>
            <div className="grid gap-4">
              {users.filter(u => !u.isAdmin).map((user) => {
                const userPreds = predictions.filter(p => p.userId === user.id);
                return (
                  <div key={user.id} className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div>
                        <h3 className="text-lg font-bold">{user.name}</h3>
                        <p className="text-gray-600 text-sm">{user.whatsapp}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">

                        <button 
                          onClick={() => setEditingPassword(user)} 
                          className="flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-200 transition"
                        >
                          <Key size={18} />
                          <span className="hidden sm:inline">Senha</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user)} 
                          className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition"
                        >
                          <Trash2 size={18} />
                          <span className="hidden sm:inline">Excluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
              <div>
        <h2 className="text-xl sm:text-2xl font-bold">Controle Financeiro</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Gerencie os pagamentos por rodada.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                <div className="w-full sm:w-64">
                  <label className="block text-xs sm:text-sm font-medium mb-2">Filtrar por Estabelecimento</label>
                  <select
                    value={establishmentFilter}
                    onChange={(e) => setEstablishmentFilter(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="all">Todos</option>
                    <option value="none">Sem estabelecimento</option>
                    {establishments.map(est => (
                      <option key={est.id} value={est.id}>{est.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-64">
                  <label className="block text-xs sm:text-sm font-medium mb-2">Selecione a Rodada</label>
                  <select
                    value={selectedFinanceRound || ''}
                    onChange={(e) => setSelectedFinanceRound(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="">Todas as rodadas</option>
                    {rounds.filter(r => r.status !== 'upcoming').sort((a, b) => b.number - a.number).map(round => (
                      <option key={round.id} value={round.id}>
                        {round.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => generateFinancialReportPDF(selectedFinanceRound, establishmentFilter)}
                  className="inline-flex items-center justify-center gap-2 bg-orange-600 text-white px-3 sm:px-4 py-2 text-sm rounded-lg hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-500 w-full sm:w-auto"
                  disabled={
                    !selectedFinanceRound ||
                    !establishmentFilter ||
                    establishmentFilter === 'all' ||
                    establishmentFilter === 'none'
                  }
                  title={
                    !selectedFinanceRound || establishmentFilter === 'all' || establishmentFilter === 'none'
                      ? 'Selecione rodada e estabelecimento específicos'
                      : 'Gerar relatório PDF'
                  }
                >
                  <Download size={18} /> Gerar PDF
                </button>
              </div>
            </div>

            {selectedFinanceRound ? (
              (() => {
                const round = rounds.find(r => r.id === selectedFinanceRound);
                let participants = getRoundParticipants(selectedFinanceRound);
                
                // Filtrar por estabelecimento
                if (establishmentFilter !== 'all') {
                  if (establishmentFilter === 'none') {
                    participants = participants.filter(p => !p.establishmentId);
                  } else {
                    participants = participants.filter(p => p.establishmentId === establishmentFilter);
                  }
                }
                
                const summary = getRoundFinancialSummary(selectedFinanceRound, establishmentFilter !== 'all' ? establishmentFilter : null, true);
                
                const filteredParticipants = participants.filter(p => {
                  if (paymentFilter === 'paid') return p.paid;
                  if (paymentFilter === 'pending') return !p.paid;
                  return true;
                });

                return (
                  <div className="space-y-6">
                    {/* Resumo Financeiro */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-600 text-sm font-medium">Total Esperado</p>
                            <p className="text-xl sm:text-2xl font-bold text-blue-900">R$ {summary.totalExpected.toFixed(2)}</p>
                            <p className="text-xs text-blue-600 mt-1">{summary.totalParticipations} cartelas</p>
                          </div>
                          <Users className="text-blue-400" size={28} />
                        </div>
                      </div>

                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-600 text-sm font-medium">Recebido</p>
                            <p className="text-xl sm:text-2xl font-bold text-green-900">R$ {summary.totalReceived.toFixed(2)}</p>
                            <p className="text-xs text-green-600 mt-1">{summary.paidCount} pagamentos</p>
                          </div>
                          <CheckCircle className="text-green-400" size={28} />
                        </div>
                      </div>

                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-yellow-600 text-sm font-medium">Premiação (85%)</p>
                            <p className="text-xl sm:text-2xl font-bold text-yellow-900">R$ {summary.prizePool.toFixed(2)}</p>
                          </div>
                          <Trophy className="text-yellow-400" size={28} />
                        </div>
                      </div>

                      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-600 text-sm font-medium">Admin (10%)</p>
                            <p className="text-xl sm:text-2xl font-bold text-purple-900">R$ {summary.adminFee.toFixed(2)}</p>
                          </div>
                          <Award className="text-purple-400" size={28} />
                        </div>
                      </div>

                      <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-600 text-sm font-medium">Estabelec. (5%)</p>
                            <p className="text-xl sm:text-2xl font-bold text-orange-900">R$ {summary.establishmentFee.toFixed(2)}</p>
                          </div>
                          <Store className="text-orange-400" size={28} />
                        </div>
                      </div>
                    </div>

                    {/* Filtros */}
                        <div className="bg-white rounded-xl shadow-sm border p-4">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between flex-wrap gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-gray-700">Filtrar:</span>
                          <button
                            onClick={() => setPaymentFilter('all')}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                              paymentFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Todos ({summary.totalParticipations})
                          </button>
                          <button
                            onClick={() => setPaymentFilter('paid')}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                              paymentFilter === 'paid' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            Pagos ({summary.paidCount})
                          </button>
                          <button
                            onClick={() => setPaymentFilter('pending')}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                              paymentFilter === 'pending' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            Pendentes ({summary.pendingCount})
                          </button>
                            </div>
                            
                            {establishmentFilter !== 'all' && establishmentFilter !== 'none' && (
                              <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 w-full md:w-auto md:ml-auto">
                                <p className="text-xs sm:text-sm text-orange-800">
                                  <Store size={14} className="inline mr-1" />
                                  <strong>Comissão deste estabelecimento:</strong> R$ {summary.establishmentFee.toFixed(2)}
                                </p>
                              </div>
                            )}
                            <div className="w-full md:w-auto md:ml-auto">
                              {(() => {
                                const pendingCount = filteredParticipants.filter(p => !p.paid).length;
                                return (
                                  <button
                                    onClick={async () => {
                                      try {
                                        setIsSendingCharges(true);
                                        const toCharge = filteredParticipants.filter(p => !p.paid);
                                        for (const p of toCharge) {
                                          await sendChargeWhatsApp(p.userId, p.cartelaCode);
                                          await new Promise(r => setTimeout(r, 300));
                                        }
                                        alert(`Cobranças iniciadas para ${toCharge.length} pendentes.`);
                                      } catch (err) {
                                        alert('Erro ao enviar cobranças: ' + err.message);
                                      } finally {
                                        setIsSendingCharges(false);
                                      }
                                    }}
                                    disabled={isSendingCharges || pendingCount === 0}
                                    className={`inline-flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg text-sm font-semibold ${pendingCount === 0 ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'} ${isSendingCharges ? 'opacity-75' : ''}`}
                                    title={pendingCount === 0 ? 'Nenhum participante pendente' : 'Cobrar todos os pendentes via WhatsApp'}
                                  >
                                    <Megaphone size={18} /> {isSendingCharges ? 'Enviando...' : `Cobrar pendentes (${pendingCount})`}
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                    {/* Lista de Cartelas */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                        <h3 className="font-bold text-lg">{round?.name}</h3>
                        <p className="text-sm text-green-100 mt-1">
                          {establishmentFilter === 'all' && 'Todos os estabelecimentos'}
                          {establishmentFilter === 'none' && 'Sem estabelecimento'}
                          {establishmentFilter !== 'all' && establishmentFilter !== 'none' && 
                            `Estabelecimento: ${establishments.find(e => e.id === establishmentFilter)?.name}`
                          }
                        </p>
                      </div>
                      
                      {filteredParticipants.length === 0 ? (
                        <div className="p-12 text-center">
                          <Users className="mx-auto text-gray-400 mb-4" size={48} />
                          <h3 className="text-xl font-semibold mb-2">
                            {paymentFilter === 'paid' && 'Nenhum pagamento confirmado'}
                            {paymentFilter === 'pending' && 'Todos os pagamentos confirmados! 🎉'}
                            {paymentFilter === 'all' && 'Nenhuma participação nesta rodada'}
                          </h3>
                        </div>
                      ) : (
                        <div className="overflow-x-auto -mx-2 sm:mx-0">
                        <table className="min-w-[720px] w-full text-xs sm:text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Participante</th>
                              <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Cartela</th>
                              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Estabelecimento</th>
                              <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Valor</th>
                              <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {filteredParticipants.map((participant) => {
                              const user = users.find(u => u.id === participant.userId);
                              const establishment = establishments.find(e => e.id === participant.establishmentId);
                              if (!user) return null;
                               
                              return (
                                <tr key={`${participant.userId}-${participant.cartelaCode}`} className={participant.paid ? 'bg-green-50' : ''}>
                                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    <div>
                                      <span className="font-medium">{user.name}</span>
                                      <p className="text-xs text-gray-500">{user.whatsapp}</p>
                                    </div>
                                  </td>
                                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                                    <span className="font-mono text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                      {participant.cartelaCode}
                                    </span>
                                  </td>
                                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    {establishment ? (
                                      <div>
                                        <p className="font-medium text-sm text-orange-600">{establishment.name}</p>
                                        <p className="text-xs text-gray-500">{establishment.contact}</p>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">Nenhum</span>
                                    )}
                                  </td>
                                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                                    <span className="text-base md:text-lg font-bold text-gray-900">R$ {summary.betValue.toFixed(2)}</span>
                                  </td>
                                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                                    {participant.paid ? (
                                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                        <CheckCircle size={16} /> Pago
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                                        <XCircle size={16} /> Pendente
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                                    <button
                                      onClick={() => togglePaymentStatus(participant.userId, selectedFinanceRound, participant.cartelaCode)}
                                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                                        participant.paid
                                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                          : 'bg-green-600 text-white hover:bg-green-700'
                                      }`}
                                    >
                                      {participant.paid ? 'Marcar Pendente' : 'Marcar Pago'}
                                    </button>
                                    {!participant.paid && (
                                      <button
                                        onClick={() => sendChargeWhatsApp(participant.userId, participant.cartelaCode)}
                                        className="ml-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1"
                                        title="Cobrar via WhatsApp"
                                      >
                                        <Send size={16} /> Cobrar
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed">
                <DollarSign className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold mb-2">Selecione uma rodada</h3>
                <p className="text-gray-500">Escolha uma rodada acima para visualizar os pagamentos</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'communications' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Comunicados</h2>
                <p className="text-gray-600 mt-1">Envie mensagens aos participantes e acompanhe o histórico.</p>
              </div>
            </div>

            {/* Sub-abas dentro de Comunicados */}
            <div role="tablist" aria-label="Seções de Comunicados" className="flex gap-3 border-b mb-6">
              <button
                role="tab"
                aria-selected={commActiveTab === 'envio'}
                onClick={() => setCommActiveTab('envio')}
                className={`py-3 px-2 border-b-2 font-medium ${commActiveTab === 'envio' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}
              >
                <Megaphone className="inline mr-2" size={18} />Envio
              </button>
              <button
                role="tab"
                aria-selected={commActiveTab === 'historico'}
                onClick={() => setCommActiveTab('historico')}
                className={`py-3 px-2 border-b-2 font-medium ${commActiveTab === 'historico' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}
              >
                <Calendar className="inline mr-2" size={18} />Histórico
              </button>
            </div>

            {commActiveTab === 'envio' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Megaphone size={22} className="text-green-600" />
                  Enviar comunicado
                </h3>
                <div className="space-y-4">
                  {/* Filtros de destinatários por rodada e pagamento */}
                  <fieldset className="border rounded-lg p-3">
                    <legend className="text-sm font-semibold text-gray-700">Destinatários</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Rodada</label>
                      <select
                        value={selectedCommRound || ''}
                        onChange={(e) => setSelectedCommRound(e.target.value || null)}
                        className="w-full border rounded-lg p-2 text-sm"
                      >
                        <option value="">Selecione uma rodada</option>
                        {rounds.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      {!selectedCommRound && !selectAllCommUsers && (
                        <p id="err-comm-round" className="text-xs text-red-600 mt-1">Selecione uma rodada.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Filtro de pagamento</label>
                      <select
                        value={commPaymentFilter}
                        onChange={(e) => setCommPaymentFilter(e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm"
                      >
                        <option value="all">Todos</option>
                        <option value="paid">Apenas pagos</option>
                        <option value="pending">Apenas pendentes</option>
                      </select>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium mb-2">Destinatário</label>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            ref={selectAllCommRef}
                            type="checkbox"
                            className="w-4 h-4"
                            checked={selectAllCommUsers}
                            onChange={(e)=>handleToggleSelectAllComm(e.target.checked)}
                            aria-label="Selecionar todos os usuários"
                            aria-checked={selectAllCommUsers && commSelectedUserIds.length > 0 && commSelectedUserIds.length < (users.filter(u => !u.isAdmin && !!u.whatsapp).length) ? 'mixed' : selectAllCommUsers}
                          />
                          Selecionar todos os usuários
                        </label>
                      </div>
                      <select
                        value={selectedCommUserId}
                        onChange={(e) => setSelectedCommUserId(e.target.value)}
                        disabled={selectAllCommUsers}
                        className={`w-full border rounded-lg p-2 text-sm ${selectAllCommUsers ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
                        aria-invalid={!selectAllCommUsers && !selectedCommUserId}
                        aria-describedby={!selectAllCommUsers && !selectedCommUserId ? 'err-comm-user' : undefined}
                      >
                        <option value="">Selecione um participante</option>
                        {users.filter(u => !u.isAdmin).map(u => (
                          <option key={u.id} value={u.id}>{u.name} {u.whatsapp ? `• ${u.whatsapp}` : '• sem WhatsApp'}</option>
                        ))}
                      </select>
                      {!selectAllCommUsers && !selectedCommUserId && (
                        <p id="err-comm-user" className="text-xs text-red-600 mt-1">Selecione um participante ou marque "Selecionar todos".</p>
                      )}
                      {selectAllCommUsers && (() => {
                        const eligible = users.filter(u => !u.isAdmin && !!u.whatsapp);
                        return (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600" aria-live="polite">Selecionados: {commSelectedUserIds.length} de {eligible.length}</p>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {eligible.map(u => {
                                const checked = commSelectedUserIds.includes(u.id);
                                return (
                                  <label
                                    key={u.id}
                                    htmlFor={`comm-user-${u.id}`}
                                    className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${checked ? 'bg-green-50 border-green-400 ring-1 ring-green-300' : 'hover:bg-gray-50'}`}
                                  >
                                    <input
                                      id={`comm-user-${u.id}`}
                                      type="checkbox"
                                      className="w-4 h-4"
                                      checked={checked}
                                      onChange={(e) => toggleCommUser(u.id, e.target.checked)}
                                      aria-label={`Selecionar ${u.name}`}
                                    />
                                    <span className="text-sm">{u.name} {u.whatsapp ? `• ${u.whatsapp}` : '• sem WhatsApp'}</span>
                                  </label>
                                );
                              })}
                            </div>
                            {commSelectedUserIds.length === 0 && (
                              <p className="text-xs text-red-600 mt-1">Selecione ao menos um participante.</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    </div>
                  </fieldset>

                  

                  <div>
                    <label className="block text-sm font-medium mb-2">Mensagem</label>
                    <textarea
                      value={commsMessage}
                      onChange={(e) => setCommsMessage(e.target.value)}
                      rows={6}
                      placeholder="Use {NOME} para inserir o nome do destinatário"
                      className="w-full border rounded-lg p-2 font-mono text-sm"
                      aria-invalid={!commsMessage}
                      aria-describedby={!commsMessage ? 'err-comm-msg' : undefined}
                    />
                    {!commsMessage && (
                      <p id="err-comm-msg" className="text-xs text-red-600 mt-1">Informe uma mensagem.</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Variáveis: {'{NOME}'} • Dica: personalize com contexto curto.</p>

                    {(() => {
                      const context = getTemplateContext();
                      const { unknownTags, missingTags } = validateMessageTags(commsMessage || '', context);
                      const hasIssues = (unknownTags.length + missingTags.length) > 0;
                      if (!hasIssues) return null;
                      return (
                        <div className="mt-2 p-2 border rounded-lg bg-yellow-50 text-yellow-800 text-xs">
                          {unknownTags.length > 0 && (
                            <p><strong>Tags desconhecidas:</strong> {unknownTags.join(', ')}</p>
                          )}
                          {missingTags.length > 0 && (
                            <p><strong>Tags sem valor no contexto:</strong> {missingTags.join(', ')}</p>
                          )}
                          <div className="mt-2">
                            <button
                              onClick={() => setCommsMessage(normalizeTags(commsMessage || ''))}
                              className="px-3 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700"
                            >Corrigir tags</button>
                          </div>
                        </div>
                      );
                    })()}

                  </div>

                  {/* Personalização rápida para modelos */}
                  <div className="bg-gray-50 border rounded-lg p-3">
                    <p className="text-sm font-medium mb-2">Personalização rápida</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Prazo final (fechamento programado)</label>
                        <input type="text" value={commDeadline} readOnly disabled placeholder="Selecionar uma rodada" className="w-full border rounded-lg p-2 text-sm bg-gray-100 text-gray-700" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Data divulgação (criação da rodada)</label>
                        <input type="text" value={commResultsDate} readOnly disabled placeholder="Selecionar uma rodada" className="w-full border rounded-lg p-2 text-sm bg-gray-100 text-gray-700" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Link do sistema</label>
                        <input type="text" value={commAppLink} onChange={(e)=>setCommAppLink(e.target.value)} placeholder="https://seusistema.com" className="w-full border rounded-lg p-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Link do ranking (gerado automaticamente)</label>
                        <input type="text" value={commPdfUrl} readOnly disabled placeholder="Selecionar uma rodada" className="w-full border rounded-lg p-2 text-sm bg-gray-100 text-gray-700" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {(() => {
                      const recipients = getCommRecipients();
                      const disabled = selectAllCommUsers ? (recipients.length === 0 || !commsMessage || isSendingMassComms) : (!selectedCommUserId || !commsMessage || isSendingSingleComm);
                      const handleClick = () => selectAllCommUsers ? sendMassCommunications() : sendGeneralCommunication();
                      return (
                        <>
                          <button
                            onClick={handleClick}
                            disabled={disabled}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${disabled ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                          >
                            {(isSendingMassComms && selectAllCommUsers) || (isSendingSingleComm && !selectAllCommUsers) ? (<Loader2 size={18} className="animate-spin" />) : (<Send size={18} />)}
                            Enviar Mensagem
                          </button>
                          <span className="text-xs text-gray-500">{selectAllCommUsers ? `Todos os elegíveis (${recipients.length}) via EvolutionAPI.` : 'Envia via EvolutionAPI e registra no histórico.'}</span>
                          {commFeedback?.text && (
                            <span role="status" aria-live="polite" className={`text-xs ${commFeedback?.type === 'error' ? 'text-red-600' : 'text-green-600'} ml-2`}>
                              {commFeedback.text}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Envio em massa conforme filtros */}
                  <div className="mt-2 p-3 bg-gray-50 border rounded-lg">
                    {(() => {
                      const recipients = getCommRecipients();
                      const count = recipients.length;
                      return (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <p className="text-xs sm:text-sm text-gray-700">
                            Destinatários filtrados: <strong>{count}</strong> {selectedCommRound ? `• ${rounds.find(r => r.id === selectedCommRound)?.name}` : ''}
                          </p>
                          <button
                            onClick={sendMassCommunications}
                            disabled={count === 0 || !commsMessage || isSendingMassComms}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${count === 0 || !commsMessage || isSendingMassComms ? 'bg-gray-200 text-gray-600 cursor-not-allowed' : 'bg-green-700 text-white hover:bg-green-800'}`}
                          >
                            {isSendingMassComms ? (<Loader2 size={18} className="animate-spin" />) : (<Send size={18} />)}
                            Enviar para filtrados{count ? ` (${count})` : ''}
                          </button>
                        </div>
                      );
                    })()}
                    <p className="text-[11px] text-gray-500 mt-2">Valida WhatsApp e registra cada envio com status.</p>
                  </div>

                  {/* Modelos (seleção rápida + pré-configurados) */}

                  {/* Modelos: dropdown categorizado com preview e ações */}
                  <div className="mt-4">
                    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-3 rounded-t-lg">
                      <h4 className="font-semibold text-sm">Modelos • {settings?.brandName || 'Bolão Brasileiro 2025'}</h4>
                    </div>
                    <div className="border rounded-b-lg p-3 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                        <div>
                          <label className="block text-xs font-medium mb-2">Seleção de modelo</label>
                          <select
                            value={commSelectedTemplateKey}
                            onChange={(e) => {
                              const key = e.target.value;
                              setCommSelectedTemplateKey(key);
                              if (key) {
                                const text = buildTemplateText(key, 'rich');
                                setCommsMessage(text);
                              }
                            }}
                            className="w-full border rounded-lg p-2 text-sm"
                          >
                            <option value="">Selecione um modelo</option>
                            {TEMPLATE_CATEGORIES.map(cat => (
                              <optgroup key={cat.label} label={cat.label}>
                                {cat.items.map(item => {
                                  const plainPreview = buildTemplateText(item.key, 'plain');
                                  const isFinal = item.key === 'final-result';
                                  const round = selectedCommRound ? rounds.find(r => r.id === selectedCommRound) : null;
                                  const disabled = isFinal && (!round || round.status !== 'finished');
                                  return (
                                    <option key={item.key} value={item.key} title={plainPreview.slice(0, 120)} disabled={disabled}>
                                      {item.label}{disabled ? ' (indisponível)' : ''}
                                    </option>
                                  );
                                })}
                              </optgroup>
                            ))}
                          </select>
                          <p className="text-[11px] text-gray-500 mt-1">Passe o mouse nas opções para ver a prévia curta.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { if (commSelectedTemplateKey) applyTemplate(commSelectedTemplateKey, 'rich'); }}
                            disabled={!commSelectedTemplateKey}
                            className={`px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1 ${commSelectedTemplateKey ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-600 cursor-not-allowed'}`}
                          >
                            <Send size={14}/> Inserir
                          </button>
                          <button
                            onClick={() => { if (commSelectedTemplateKey) copyTemplate(commSelectedTemplateKey, 'plain'); }}
                            disabled={!commSelectedTemplateKey}
                            className={`px-3 py-2 rounded-lg text-xs inline-flex items-center gap-1 ${commSelectedTemplateKey ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                          >
                            <Copy size={14}/> Copiar texto puro
                          </button>
                        </div>
                      </div>
                      {commSelectedTemplateKey && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Prévia do modelo selecionado</p>
                          <pre className="whitespace-pre-wrap font-mono text-xs border rounded-lg p-3 bg-gray-50 text-gray-800">{buildTemplateText(commSelectedTemplateKey, 'rich')}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {commActiveTab === 'historico' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Calendar size={22} className="text-green-600" />
                  Histórico de comunicados
                </h3>
                {communications && communications.length > 0 ? (
                  <div className="overflow-auto max-h-[28rem]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left">Data</th>
                          <th className="px-4 py-2 text-left">Tipo</th>
                          <th className="px-4 py-2 text-left">Participante</th>
                          <th className="px-4 py-2 text-left">Canal</th>
                          <th className="px-4 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {communications.slice().reverse().map((c) => {
                          const u = users.find(x => x.id === c.userId);
                          const ts = c.createdAt && c.createdAt.seconds ? new Date(c.createdAt.seconds * 1000) : null;
                          const dateStr = ts ? ts.toLocaleString('pt-BR') : '-';
                          return (
                            <tr key={c.id} className="border-t">
                              <td className="px-4 py-2">{dateStr}</td>
                              <td className="px-4 py-2">{c.type}</td>
                              <td className="px-4 py-2">{u ? u.name : c.userId || '-'}</td>
                              <td className="px-4 py-2">{c.channel || '-'}</td>
                              <td className="px-4 py-2">{c.status || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center border-2 border-dashed rounded-lg">
                    <Megaphone className="mx-auto text-gray-400 mb-4" size={36} />
                    <p className="text-gray-600">Nenhum comunicado registrado ainda</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showRoundForm && <RoundForm round={editingRound} teams={teams} rounds={rounds} onSave={saveRound} onCancel={() => { setEditingRound(null); setShowRoundForm(false); }} />}
      {showTeamForm && <TeamForm team={editingTeam} onSave={saveTeam} onCancel={() => { setEditingTeam(null); setShowTeamForm(false); }} />}
      {showEstablishmentForm && <EstablishmentForm establishment={editingEstablishment} onSave={saveEstablishment} onCancel={() => { setEditingEstablishment(null); setShowEstablishmentForm(false); }} />}
      {editingPassword && <PasswordModal user={editingPassword} onSave={savePassword} onCancel={() => setEditingPassword(null)} />}

      {adminPlayerModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setAdminPlayerModal(null)}>
          <div className="bg-white w-[95%] max-w-3xl rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-bold">Palpites do Participante</h3>
                <p className="text-sm text-gray-500">{adminPlayerModal.round?.name}</p>
              </div>
              <button className="p-2 rounded hover:bg-gray-100" onClick={() => setAdminPlayerModal(null)} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">{adminPlayerModal.item?.user?.name}</p>
                  <p className="text-xs text-gray-500">{adminPlayerModal.item?.user?.whatsapp}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">{adminPlayerModal.cartela?.code}</span>
                  {(() => {
                    const data = getRoundDashboardData(adminPlayerModal.round.id);
                    const isWinner = data?.winners?.some(w => w.user.id === adminPlayerModal.item.user.id && w.cartelaCode === adminPlayerModal.item.cartelaCode);
                    return isWinner ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        <Award size={16} /> Campeão — R$ {data?.prizePerWinner?.toFixed(2)}
                      </span>
                    ) : null;
                  })()}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg border">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Jogo</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600">Palpite</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600">Placar Final</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-600">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(adminPlayerModal.round?.matches || []).map((match) => {
                      const pred = adminPlayerModal.cartela?.predictions?.find(p => p.matchId === match.id);
                      if (!pred) return null;
                      const homeTeam = teams.find(t => t.id === match.homeTeamId) || teams.find(t => t.name === match.homeTeam);
                      const awayTeam = teams.find(t => t.id === match.awayTeamId) || teams.find(t => t.name === match.awayTeam);
                      let pts = 0;
                      if (match.finished && match.homeScore !== null && match.awayScore !== null) {
                        if (pred.homeScore === match.homeScore && pred.awayScore === match.awayScore) {
                          pts = 3;
                        } else {
                          const predRes = pred.homeScore > pred.awayScore ? 'home' : pred.homeScore < pred.awayScore ? 'away' : 'draw';
                          const matchRes = match.homeScore > match.awayScore ? 'home' : match.homeScore < match.awayScore ? 'away' : 'draw';
                          if (predRes === matchRes) pts = 1;
                        }
                      }
                      return (
                        <tr key={match.id}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <img src={getSafeLogo(homeTeam || { name: match.homeTeam })} alt={homeTeam?.name || match.homeTeam} className="w-6 h-6 object-contain rounded bg-white ring-1 ring-gray-200 flex-shrink-0" width={24} height={24} />
                              <span className="text-gray-900">{homeTeam?.name || match.homeTeam}</span>
                              <span className="text-gray-400">vs</span>
                              <img src={getSafeLogo(awayTeam || { name: match.awayTeam })} alt={awayTeam?.name || match.awayTeam} className="w-6 h-6 object-contain rounded bg-white ring-1 ring-gray-200 flex-shrink-0" width={24} height={24} />
                              <span className="text-gray-900">{awayTeam?.name || match.awayTeam}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center font-mono">{pred.homeScore} x {pred.awayScore}</td>
                          <td className="px-3 py-2 text-center font-mono">{match.finished ? `${match.homeScore} x ${match.awayScore}` : '-'}</td>
                          <td className="px-3 py-2 text-center font-semibold">{pts}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UserPanel = ({ setView }) => {
  const { currentUser, setCurrentUser, logout, teams, rounds, predictions, users, establishments, addPrediction, settings, deleteCartelaPredictions } = useApp();
  const [activeTab, setActiveTab] = useState('predictions');
  const [selectedRound, setSelectedRound] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPredictions, setPendingPredictions] = useState(null);
  const [expandedRounds, setExpandedRounds] = useState({});
  const [selectedRankingRound, setSelectedRankingRound] = useState(null);
  const [editingPredictions, setEditingPredictions] = useState(null);
  const [selectedEstablishment, setSelectedEstablishment] = useState(null);
  const [showEstablishmentModal, setShowEstablishmentModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [cartelaDetails, setCartelaDetails] = useState(null);
  // Estados para a aba "Rodadas Finalizadas"
  const [selectedFinishedRound, setSelectedFinishedRound] = useState(null);
  const [finishedStartDate, setFinishedStartDate] = useState('');
  const [finishedEndDate, setFinishedEndDate] = useState('');
  const [finishedPeriod, setFinishedPeriod] = useState('all'); // all | 3m | 6m | 12m
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentContext, setPaymentContext] = useState(null);
  const [paymentLocks, setPaymentLocks] = useState({});

  // Deep-link para ranking: ?view=user&tab=ranking&round=<id>
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const roundId = params.get('round');
      if (tab === 'ranking') setActiveTab('ranking');
      if (roundId) setSelectedRankingRound(roundId);
    } catch {}
  }, []);

  const toggleRound = (roundId) => {
    setExpandedRounds(prev => ({ ...prev, [roundId]: !prev[roundId] }));
  };

  // Helper local para fechar rodada por horário, compartilhando a mesma regra do Admin
  const isRoundTimedClosed = (round) => {
    if (!round?.closeAt) return false;
    const ts = new Date(round.closeAt).getTime();
    return !isNaN(ts) && Date.now() >= ts;
  };

  // Helper local de formatação de data/hora (pt-BR)
  const formatDateTime = (value) => {
    if (!value) return null;
    const dt = new Date(value);
    if (isNaN(dt.getTime())) return null;
    return dt.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  const openRounds = rounds.filter(r => r.status === 'open' && !isRoundTimedClosed(r));
  const closedRounds = rounds.filter(r => r.status === 'closed' || (r.status === 'open' && isRoundTimedClosed(r))).sort((a, b) => b.number - a.number);
  const finishedRounds = rounds.filter(r => r.status === 'finished').sort((a, b) => b.number - a.number);
  const rankableRounds = rounds
    .filter(r => r.status === 'finished' || r.status === 'closed')
    .sort((a, b) => {
      const toTs = (r) => {
        if (r?.closeAt) {
          const t = new Date(r.closeAt).getTime();
          if (!isNaN(t)) return t;
        }
        const ca = r?.createdAt;
        if (ca && typeof ca.toDate === 'function') return ca.toDate().getTime();
        if (ca && typeof ca === 'object' && typeof ca.seconds === 'number') return ca.seconds * 1000;
        return typeof r?.number === 'number' ? r.number : 0;
      };
      return toTs(b) - toTs(a);
    });
  const upcomingRounds = rounds.filter(r => r.status === 'upcoming').sort((a, b) => a.number - b.number);
  const predictableRounds = rounds.filter(r => (r.status === 'open' || r.status === 'upcoming') && !isRoundTimedClosed(r));

  // Minhas rodadas: apenas as que o usuário está participando
  const myRoundIds = new Set(
    predictions
      .filter(p => p.userId === currentUser.id)
      .map(p => p.roundId)
  );
  const myOpenOrUpcomingRounds = rounds
    .filter(r => myRoundIds.has(r.id) && (r.status === 'open' || r.status === 'upcoming') && !isRoundTimedClosed(r))
    .sort((a, b) => a.number - b.number);
  const myClosedRounds = rounds
    .filter(r => myRoundIds.has(r.id) && (r.status === 'closed' || (r.status === 'open' && isRoundTimedClosed(r))))
    .sort((a, b) => b.number - a.number);
  const myFinishedRounds = rounds
    .filter(r => myRoundIds.has(r.id) && r.status === 'finished')
    .sort((a, b) => b.number - a.number);

  useEffect(() => {
    if (rankableRounds.length > 0) {
      const latestRound = rankableRounds[0];
      if (selectedRankingRound !== latestRound.id) {
        setSelectedRankingRound(latestRound.id);
      }
    }
  }, [rankableRounds]);

  const getRoundPredictions = (roundId) => {
    return predictions.filter(p => p.userId === currentUser.id && p.roundId === roundId);
  };

  const getUserCartelasForRound = (roundId) => {
    const userPreds = predictions.filter(p => p.userId === currentUser.id && p.roundId === roundId);
    const cartelaMap = {};
    
    userPreds.forEach(pred => {
      const code = pred.cartelaCode || 'ANTIGA';
      if (!cartelaMap[code]) {
        cartelaMap[code] = {
          code,
          predictions: [],
          paid: pred.paid || false,
          establishmentId: pred.establishmentId
        };
      }
      cartelaMap[code].predictions.push(pred);
    });
    
    return Object.values(cartelaMap);
  };

  // Abrir detalhes da cartela a partir de uma linha do ranking
  const openRankingCartelaDetails = (roundId, item) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round) return;
    const preds = predictions.filter(p => p.userId === item.user.id && p.roundId === roundId && (p.cartelaCode || 'ANTIGA') === item.cartelaCode);
    if (preds.length === 0) return;
    const cartela = {
      code: item.cartelaCode,
      predictions: preds,
      establishmentId: preds[0]?.establishmentId || null,
      paid: preds[0]?.paid || false
    };
    setCartelaDetails({ round, cartela });
  };

  const calculateRoundPoints = (roundId) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round) return null;
    const canScore = round.status === 'finished' || round.status === 'closed' || isRoundTimedClosed(round);
    if (!canScore) return null;
    
    const cartelas = getUserCartelasForRound(roundId);
    const cartelaPoints = {};
    
    cartelas.forEach(cartela => {
      if (!cartela.paid) {
        cartelaPoints[cartela.code] = 0;
        return;
      }
      
      let points = 0;
      round.matches?.forEach(match => {
        const pred = cartela.predictions.find(p => p.matchId === match.id);
        
        if (pred && match.finished && match.homeScore !== null && match.awayScore !== null) {
          if (pred.homeScore === match.homeScore && pred.awayScore === match.awayScore) {
            points += 3;
          } else {
            const predResult = pred.homeScore > pred.awayScore ? 'home' : pred.homeScore < pred.awayScore ? 'away' : 'draw';
            const matchResult = match.homeScore > match.awayScore ? 'home' : match.homeScore < match.awayScore ? 'away' : 'draw';
            if (predResult === matchResult) {
              points += 1;
            }
          }
        }
      });
      cartelaPoints[cartela.code] = points;
    });
    
    return cartelaPoints;
  };

  const handleStartPrediction = (round) => {
    // Bloqueio automático por fechamento programado
    if (isRoundTimedClosed(round)) {
      alert('Rodada fechada para palpites pelo cronograma definido.');
      return;
    }
    setSelectedRound(round);
    if (establishments.length > 0) {
      setShowEstablishmentModal(true);
    } else {
      setSelectedEstablishment(null);
    }
  };

  const handleEstablishmentSelected = (estId) => {
    setSelectedEstablishment(estId);
    setShowEstablishmentModal(false);
  };

  const handleDeleteCartela = async (roundId, cartelaCode) => {
    const confirmed = window.confirm('Excluir palpites desta cartela pendente? Esta ação não pode ser desfeita.');
    if (!confirmed) return;
    try {
      await deleteCartelaPredictions(currentUser.id, roundId, cartelaCode);
    } catch (err) {
      alert('Erro ao excluir cartela: ' + err.message);
    }
  };

  const EstablishmentModal = ({ onSelect, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b sticky top-0 bg-white">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Store size={22} className="text-orange-600" />
            Selecione o Estabelecimento
          </h3>
          <p className="text-gray-600 text-xs mt-1">Escolha onde você está participando</p>
        </div>
        <div className="p-4 space-y-2">
          <button
            onClick={() => onSelect(null)}
            className="group w-full p-3 border rounded-lg text-left transition hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <p className="font-medium text-sm">Nenhum estabelecimento</p>
            <p className="text-xs text-gray-500">Participação direta</p>
          </button>
          {establishments.map(est => (
            <button
              key={est.id}
              onClick={() => onSelect(est.id)}
              className="group w-full p-3 border rounded-lg text-left transition hover:bg-orange-50 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <div className="flex items-start gap-2">
                <div className="bg-orange-100 p-1.5 rounded-lg">
                  <Store size={18} className="text-orange-600" />
                </div>
                <div className="leading-tight">
                  <p className="font-medium text-sm">{est.name}</p>
                  {est.contact && <p className="text-xs text-gray-600">{est.contact}</p>}
                  {est.phone && <p className="text-[11px] text-gray-500">{est.phone}</p>}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="p-4 border-t sticky bottom-0 bg-white">
          <button onClick={onCancel} className="w-full px-4 py-2 border rounded-lg text-sm">Cancelar</button>
        </div>
      </div>
    </div>
  );

  const RoundAccordion = ({ round }) => {
    const isExpanded = expandedRounds[round.id];
    const userCartelas = getUserCartelasForRound(round.id);
    const hasPredictions = userCartelas.length > 0;
    const points = calculateRoundPoints(round.id);
    const timedClosed = isRoundTimedClosed(round);
    const isOpenOrUpcoming = round.status === 'open' || round.status === 'upcoming';
    const canPredictNoExisting = isOpenOrUpcoming && !timedClosed && !hasPredictions;
    const isTimedClosedOpenOrUpcoming = isOpenOrUpcoming && timedClosed;
    const totalMatches = round.matches?.length || 0;
    const finishedMatchesCount = round.matches?.filter(m => m.finished && m.homeScore !== null && m.awayScore !== null).length || 0;
    const hasAnyFinished = finishedMatchesCount > 0;
    const progressPercent = totalMatches ? Math.round((finishedMatchesCount / totalMatches) * 100) : 0;
    
    const getStatusInfo = () => {
      const effStatus = (round.status === 'open' && timedClosed) ? 'closed' : round.status;
      switch (effStatus) {
        case 'upcoming':
          return { text: 'Futura', color: 'bg-gray-100 text-gray-700', icon: '🔜' };
        case 'open':
          return { text: hasPredictions ? 'Palpites Feitos' : 'Aberta', color: hasPredictions ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700', icon: hasPredictions ? '✅' : '⏰' };
        case 'closed':
          return { text: 'Aguardando', color: 'bg-yellow-100 text-yellow-700', icon: '🔒' };
        case 'finished':
          return { text: 'Finalizada', color: 'bg-purple-100 text-purple-700', icon: '🏁' };
        default:
          return { text: 'Status', color: 'bg-gray-100 text-gray-700', icon: '❓' };
      }
    };

    const status = getStatusInfo();
    const totalPoints = points ? Object.values(points).reduce((a, b) => a + b, 0) : 0;

    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <button
          onClick={() => toggleRound(round.id)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${status.color}`}>
              {round.number}
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold">{round.name}</h3>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                  {status.icon} {status.text}
                </span>
                {round.closeAt && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                    Fecha: {formatDateTime(round.closeAt) || round.closeAt}
                  </span>
                )}
                {hasPredictions && (
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    {userCartelas.length} cartela(s)
                  </span>
                )}
                {((round.status === 'finished') || ((round.status === 'closed' || timedClosed) && hasAnyFinished)) && (
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {totalPoints} pontos total
                  </span>
                )}
                {(round.status === 'closed' || timedClosed) && hasAnyFinished && (
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
                    Parcial
                  </span>
                )}
                {(round.status === 'finished' || round.status === 'closed' || timedClosed) && totalMatches > 0 && (
                  <span className="flex items-center gap-2 ml-2">
                    <span className="w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <span className="block h-2 bg-green-600" style={{ width: `${progressPercent}%` }} />
                    </span>
                    <span className="text-xs text-gray-600">{finishedMatchesCount}/{totalMatches}</span>
                  </span>
                )}
                {canPredictNoExisting && (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                    Sem palpites
                  </span>
                )}
                {isTimedClosedOpenOrUpcoming && (
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                    Fechada automaticamente
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{round.matches?.length || 0} jogos</span>
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        </button>

        {isExpanded && (
          <div className="border-t bg-gray-50 p-6">
            {canPredictNoExisting && (
              <div className="text-center py-8">
                <Target className="mx-auto text-orange-500 mb-3" size={48} />
                <p className="text-gray-800 font-bold mb-2">Você ainda não fez seus palpites!</p>
                <button
                  onClick={() => handleStartPrediction(round)}
                  className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Fazer Palpites Agora
                </button>
              </div>
            )}
            {isTimedClosedOpenOrUpcoming && (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto text-yellow-600 mb-3" size={48} />
                <p className="text-gray-800 font-bold">Rodada fechada automaticamente para palpites.</p>
                {round.closeAt && (
                  <p className="text-gray-600 text-sm mt-1">Fechada em {formatDateTime(round.closeAt) || round.closeAt}</p>
                )}
              </div>
            )}

            {hasPredictions && (
              <div className="space-y-6">
                {userCartelas.map((cartela, cartelaIndex) => {
                  const est = establishments.find(e => e.id === cartela.establishmentId);
                  const cartelaPoints = points ? points[cartela.code] || 0 : 0;
                  
                  return (
                    <div key={cartela.code} className="bg-white rounded-lg border-2 border-blue-200 overflow-hidden">
                      <div className="bg-blue-50 p-4 border-b border-blue-200">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <p className="font-mono text-lg font-bold text-blue-700">🎫 {cartela.code}</p>
                            {est && (
                              <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                                <Store size={12} /> {est.name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${cartela.paid ? 'bg-green-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
                              {cartela.paid ? '💰 Pago' : '⚠️ Pendente'}
                            </span>
                            {((round.status === 'finished') || ((round.status === 'closed' || timedClosed) && hasAnyFinished)) && (
                              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                {cartelaPoints} pontos
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        {round.matches?.map((match) => {
                          const homeTeam = teams.find(t => t.id === match.homeTeamId);
                          const awayTeam = teams.find(t => t.id === match.awayTeamId);
                          const pred = cartela.predictions.find(p => p.matchId === match.id);

                          let matchPoints = null;
                          if ((round.status === 'finished' || round.status === 'closed' || timedClosed) && match.finished && pred && cartela.paid) {
                            if (pred.homeScore === match.homeScore && pred.awayScore === match.awayScore) {
                              matchPoints = 3;
                            } else {
                              const predResult = pred.homeScore > pred.awayScore ? 'home' : pred.homeScore < pred.awayScore ? 'away' : 'draw';
                              const matchResult = match.homeScore > match.awayScore ? 'home' : match.homeScore < match.awayScore ? 'away' : 'draw';
                              if (predResult === matchResult) {
                                matchPoints = 1;
                              } else {
                                matchPoints = 0;
                              }
                            }
                          }

                          return (
                            <div key={match.id} className="bg-gray-50 rounded-lg p-3 border">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <img src={getSafeLogo(homeTeam)} alt={homeTeam?.name || ''} className="w-6 h-6 object-contain rounded bg-white ring-1 ring-gray-200 flex-shrink-0" width={24} height={24} />
                                    <span className="font-medium text-xs truncate">{homeTeam?.name}</span>
                                  </div>
                                  <span className="text-gray-400 font-bold text-xs px-1 flex-shrink-0">VS</span>
                                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                    <span className="font-medium text-xs truncate">{awayTeam?.name}</span>
                                    <img src={getSafeLogo(awayTeam)} alt={awayTeam?.name || ''} className="w-6 h-6 object-contain rounded bg-white ring-1 ring-gray-200 flex-shrink-0" width={24} height={24} />
                                  </div>
                                </div>
                                
                                {pred && (
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-xs text-gray-500">Palpite:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold text-sm">{pred.homeScore}</span>
                                      <span className="text-gray-400 font-bold text-xs">X</span>
                                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold text-sm">{pred.awayScore}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {match.finished && match.homeScore !== null && (
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-xs text-gray-500">Real:</span>
                                    <div className="flex items-center gap-2">
                                      <span className="bg-green-600 text-white px-2 py-1 rounded font-bold text-sm">{match.homeScore}</span>
                                      <span className="text-gray-400 font-bold text-xs">X</span>
                                      <span className="bg-green-600 text-white px-2 py-1 rounded font-bold text-sm">{match.awayScore}</span>
                                    </div>
                                  </div>
                                )}

                                {matchPoints !== null && (
                                  <div className="flex justify-center pt-2">
                                    {matchPoints === 3 && <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold">+3</span>}
                                    {matchPoints === 1 && <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">+1</span>}
                                    {matchPoints === 0 && <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">0</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {round.status === 'finished' && !cartela.paid && (
                        <div className="p-3 bg-orange-50 border-t border-orange-200">
                          <p className="text-xs text-orange-700 font-medium text-center">
                            ⚠️ Pagamento pendente - Pontos não computados
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {(() => {
                  const pendingCartelas = userCartelas.filter(c => !c.paid);
                  const pendingCodes = pendingCartelas.map(c => c.code);
                  const totalAmount = (settings?.betValue || 15) * pendingCartelas.length;
                  if (pendingCartelas.length === 0) return null;
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" aria-live="polite">
                      <div className="flex items-center gap-2">
                        <DollarSign className="text-blue-600" size={20} />
                        <p className="text-sm text-blue-800">
                          Você tem {pendingCartelas.length} participação(ões) pendentes nesta rodada.
                        </p>
                      </div>
                      <button
                        onClick={() => openPaymentForRound(round, pendingCodes, totalAmount)}
                        disabled={!!paymentLocks[round.id]}
                        className={`px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 ${paymentLocks[round.id] ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400'}`}
                        aria-label={`Gerar pagamento de ${fmtBRL(totalAmount)} para ${pendingCartelas.length} participação(ões)`}
                      >
                        {paymentLocks[round.id] ? 'Processando...' : `Gerar Pagamento • ${fmtBRL(totalAmount)}`}
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const openPaymentForRound = (round, cartelaCodes, amount) => {
    if (paymentLocks[round.id]) return;
    setPaymentLocks(prev => ({ ...prev, [round.id]: true }));
    setPaymentContext({ roundId: round.id, roundName: round.name, cartelaCodes, amount });
    setPaymentModalOpen(true);
  };

  const PredictionForm = ({ round, initialPredictions = null }) => {
    const [localPreds, setLocalPreds] = useState({});
    const [cartelaCode] = useState(generateCartelaCode());
    const timedClosed = isRoundTimedClosed(round);
    
    useEffect(() => {
      if (initialPredictions) {
        const predsObj = {};
        initialPredictions.forEach(pred => {
          predsObj[pred.match.id] = {
            home: pred.homeScore,
            away: pred.awayScore
          };
        });
        setLocalPreds(predsObj);
      }
    }, [initialPredictions]);

    const handleSubmit = () => {
      if (timedClosed) {
        alert('Rodada fechada para palpites pelo cronograma definido.');
        return;
      }
      if (!Array.isArray(round.matches) || round.matches.length === 0) {
        alert('Rodada sem jogos configurados. Aguarde o administrador adicionar os confrontos.');
        return;
      }
      const allPreds = round.matches.map(match => ({
        match,
        homeScore: localPreds[match.id]?.home !== undefined ? parseInt(localPreds[match.id].home) : null,
        awayScore: localPreds[match.id]?.away !== undefined ? parseInt(localPreds[match.id].away) : null
      }));

      // Validar preenchimento e faixas válidas (apenas inteiros entre 0 e 20)
      const hasEmpty = allPreds.some(p => p.homeScore === null || p.awayScore === null);
      if (hasEmpty) {
        alert('Preencha todos os palpites!');
        return;
      }
      const invalidValues = allPreds.some(p => {
        const hs = p.homeScore; const as = p.awayScore;
        return !Number.isInteger(hs) || !Number.isInteger(as) || hs < 0 || as < 0 || hs > 20 || as > 20;
      });
      if (invalidValues) {
        alert('Insira pontuações válidas (0–20) inteiras em todos os jogos.');
        return;
      }

      setPendingPredictions({ round, predictions: allPreds, cartelaCode, establishmentId: selectedEstablishment });
      setShowConfirmModal(true);
    };

    const selectedEst = establishments.find(e => e.id === selectedEstablishment);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b sticky top-0 bg-white">
            <h3 className="text-2xl font-bold">{round.name}</h3>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-mono font-bold">
                🎫 {cartelaCode}
              </span>
              <span className="text-gray-600 text-sm">R$ {settings?.betValue?.toFixed(2) || '15,00'}</span>
              {selectedEst && (
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                  <Store size={14} /> {selectedEst.name}
                </span>
              )}
            </div>
          </div>
          <div className="p-6 space-y-4">
            {timedClosed && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                🔒 Rodada fechada automaticamente {round.closeAt && (<span>em {formatDateTime(round.closeAt) || round.closeAt}</span>)}.
              </div>
            )}
            {round.matches?.map((match) => {
              const homeTeam = teams.find(t => t.id === match.homeTeamId);
              const awayTeam = teams.find(t => t.id === match.awayTeamId);
              return (
                <div key={match.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <img src={getSafeLogo(homeTeam)} alt={homeTeam?.name || ''} className="w-8 h-8 object-contain rounded bg-white ring-1 ring-gray-200 flex-shrink-0" width={32} height={32} />
                        <span className="font-medium text-sm truncate">{homeTeam?.name}</span>
                      </div>
                      <span className="text-gray-400 font-bold px-2">VS</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="font-medium text-sm truncate">{awayTeam?.name}</span>
                        <img src={getSafeLogo(awayTeam)} alt={awayTeam?.name || ''} className="w-8 h-8 object-contain rounded bg-white ring-1 ring-gray-200 flex-shrink-0" width={32} height={32} />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-3">
                      <input 
                        type="number" 
                        min="0" 
                        max="20" 
                        value={localPreds[match.id]?.home ?? ''} 
                        onChange={(e) => setLocalPreds({ ...localPreds, [match.id]: { ...localPreds[match.id], home: e.target.value } })} 
                        disabled={timedClosed}
                        className="w-16 px-2 py-2 border rounded text-center font-bold" 
                        placeholder="0" 
                      />
                      <span className="font-bold text-gray-400">X</span>
                      <input 
                        type="number" 
                        min="0" 
                        max="20" 
                        value={localPreds[match.id]?.away ?? ''} 
                        onChange={(e) => setLocalPreds({ ...localPreds, [match.id]: { ...localPreds[match.id], away: e.target.value } })} 
                        disabled={timedClosed}
                        className="w-16 px-2 py-2 border rounded text-center font-bold" 
                        placeholder="0" 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-6 border-t flex gap-3 sticky bottom-0 bg-white">
            <button onClick={() => { setSelectedRound(null); setEditingPredictions(null); setPendingPredictions(null); setSelectedEstablishment(null); }} className="px-6 py-2 border rounded-lg">Cancelar</button>
            <button onClick={handleSubmit} disabled={timedClosed} className={`px-6 py-2 rounded-lg ${timedClosed ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white'}`}>Confirmar</button>
          </div>
        </div>
      </div>
    );
  };

  const ConfirmModal = ({ round, predictionsData, cartelaCode, establishmentId, onConfirm, onCancel }) => {
    const handleRevisar = () => {
      setEditingPredictions(predictionsData);
      setShowConfirmModal(false);
    };

    const selectedEst = establishments.find(e => e.id === establishmentId);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <Award size={32} />
              <div>
                <h3 className="text-2xl font-bold">Confirmar Palpites</h3>
                <p className="text-yellow-100">{round.name}</p>
                <p className="text-yellow-100 font-mono text-sm mt-1">🎫 {cartelaCode}</p>
                {selectedEst && (
                  <p className="text-yellow-100 text-sm mt-1 flex items-center gap-1">
                    <Store size={14} /> {selectedEst.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-red-500 text-white p-2 rounded-full"><X size={20} /></div>
                <div>
                  <h4 className="font-bold text-red-900 text-lg mb-2">⚠️ Atenção!</h4>
                  <p className="text-red-800 font-medium">Após confirmar, você <span className="underline">NÃO PODERÁ MAIS</span> alterar!</p>
                  <p className="text-red-700 text-sm mt-2">💰 Lembre-se de efetuar o pagamento de R$ 15,00 para validar seus pontos.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 max-h-60 overflow-y-auto">
              <h4 className="font-semibold mb-3">Seus palpites:</h4>
              <div className="space-y-2">
                {(round?.matches || []).map((match) => {
                  const pred = predictionsData.find(p => p.match?.id === match.id);
                  if (!pred) return null;
                  const homeTeam = teams.find(t => t.id === match.homeTeamId);
                  const awayTeam = teams.find(t => t.id === match.awayTeamId);
                  return (
                    <div key={match.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                      <div className="flex items-center gap-2 text-sm">
                        <img src={getSafeLogo(homeTeam)} alt={homeTeam?.name || ''} className="w-6 h-6 object-contain rounded bg-white ring-1 ring-gray-200" width={24} height={24} />
                        <span className="font-medium">{homeTeam?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-green-600">
                        <span className="bg-green-100 px-3 py-1 rounded">{pred.homeScore}</span>
                        <span className="text-gray-400">X</span>
                        <span className="bg-green-100 px-3 py-1 rounded">{pred.awayScore}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <img src={getSafeLogo(awayTeam)} alt={awayTeam?.name || ''} className="w-6 h-6 object-contain rounded bg-white ring-1 ring-gray-200" width={24} height={24} />
                        <span className="font-medium">{awayTeam?.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex justify-between">
                <span className="text-green-800 font-medium">Valor:</span>
                <span className="text-2xl font-bold text-green-600">R$ {settings?.betValue?.toFixed(2) || '15,00'}</span>
              </div>
            </div>
          </div>
          <div className="p-6 border-t flex gap-3">
            <button onClick={handleRevisar} className="flex-1 px-6 py-3 border-2 rounded-lg font-semibold hover:bg-gray-50">Revisar Palpites</button>
            <button onClick={onConfirm} className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800">Confirmar Definitivo</button>
          </div>
        </div>
      </div>
    );
  };

  const CartelaDetailsModal = ({ round, cartela, onClose }) => {
    const { teams, establishments } = useApp();
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white w-[95%] max-w-3xl rounded-xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h3 className="text-lg font-bold">Palpites do Participante</h3>
              <p className="text-sm text-gray-500">{round?.name}</p>
            </div>
            <button className="p-2 rounded hover:bg-gray-100" onClick={onClose} aria-label="Fechar">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">{cartela?.code}</span>
                {cartela?.establishmentId && (
                  <span className="inline-flex items-center gap-1 text-xs text-orange-600">
                    <Store size={12} /> {(establishments.find(e => e.id === cartela.establishmentId) || {}).name}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg border">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Jogo</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600">Palpite</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600">Placar Final</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-600">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(round?.matches || []).map((match) => {
                    const p = cartela?.predictions?.find(pr => pr.matchId === match.id);
                    if (!p) return null;
                    const homeTeam = teams.find(t => t.id === match.homeTeamId) || teams.find(t => t.name === match.homeTeam);
                    const awayTeam = teams.find(t => t.id === match.awayTeamId) || teams.find(t => t.name === match.awayTeam);

                    let pts = 0;
                    if (match.finished && match.homeScore !== null && match.awayScore !== null) {
                      if (p.homeScore === match.homeScore && p.awayScore === match.awayScore) {
                        pts = 3;
                      } else {
                        const predRes = p.homeScore > p.awayScore ? 'home' : p.homeScore < p.awayScore ? 'away' : 'draw';
                        const matchRes = match.homeScore > match.awayScore ? 'home' : match.homeScore < match.awayScore ? 'away' : 'draw';
                        if (predRes === matchRes) pts = 1;
                      }
                    }

                    return (
                      <tr key={match.id}>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <img src={getSafeLogo(homeTeam)} alt={homeTeam?.name || ''} className="w-5 h-5 object-contain rounded bg-white ring-1 ring-gray-200" width={20} height={20} />
                            <span className="truncate max-w-[8rem]">{homeTeam?.name}</span>
                            <span className="text-gray-400 font-bold mx-2">X</span>
                            <span className="truncate max-w-[8rem]">{awayTeam?.name}</span>
                            <img src={getSafeLogo(awayTeam)} alt={awayTeam?.name || ''} className="w-5 h-5 object-contain rounded bg-white ring-1 ring-gray-200" width={20} height={20} />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex items-center gap-2">
                            <span className="text-sm font-bold bg-gray-100 px-2 py-1 rounded">{p.homeScore}</span>
                            <span className="text-sm font-bold bg-gray-100 px-2 py-1 rounded">{p.awayScore}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {match.finished ? (
                            <span className="text-xs text-gray-700">{match.homeScore} x {match.awayScore}</span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${pts > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{pts}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 border-t">
            <button onClick={onClose} className="w-full px-4 py-2 border rounded-lg">Fechar</button>
          </div>
        </div>
      </div>
    );
  };

  const PaymentModal = ({ open, onClose, context, currentUser, onStart, onApproved, onError }) => {
    const { users, settings, predictions } = useApp();
    const [stage, setStage] = useState('collect'); // collect | creating | showing | approved | error
    const [error, setError] = useState('');
    const [tx, setTx] = useState(null);
    const [copied, setCopied] = useState('');
    const [timeLeftMs, setTimeLeftMs] = useState(0);
    const [approvedAt, setApprovedAt] = useState(null);
    const [payer, setPayer] = useState({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      cpf: '',
      pixKey: ''
    });
    const pollRef = useRef(null);

    useEffect(() => {
      if (!open) return;
      // Se já estiver aprovado, não reconfigura o estado ao reabrir
      if (stage === 'approved') return;
      // Esta verificação só deve ocorrer na abertura inicial (estado 'collect')
      if (stage !== 'collect') return;
      setError(''); setTx(null); setCopied('');
      // Se já estiver pago no banco, mostrar diretamente a confirmação
      try {
        const roundId = context?.roundId;
        const codes = Array.isArray(context?.cartelaCodes) ? context.cartelaCodes : [];
        const myPreds = predictions.filter(p => p.userId === currentUser?.id && p.roundId === roundId && (codes.length ? codes.includes(p.cartelaCode) : true));
        const anyPending = myPreds.length > 0 ? myPreds.some(p => !p.paid) : true;
        if (!anyPending) {
          setApprovedAt(new Date());
          setStage('approved');
        } else {
          setStage('collect');
        }
      } catch {
        setStage('collect');
      }
    }, [open, stage]);

    // Monitora atualizações de pagamento no banco e muda para 'approved'
    useEffect(() => {
      if (!open) return;
      const roundId = context?.roundId;
      const codes = Array.isArray(context?.cartelaCodes) ? context.cartelaCodes : [];
      if (!roundId || !currentUser?.id) return;
      const myPreds = predictions.filter(p => p.userId === currentUser.id && p.roundId === roundId && (codes.length ? codes.includes(p.cartelaCode) : true));
      if (myPreds.length > 0 && myPreds.every(p => !!p.paid)) {
        setApprovedAt(new Date());
        setStage('approved');
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, [predictions, open, context?.roundId, context?.cartelaCodes, currentUser?.id]);

    useEffect(() => {
      if (!tx?.expiration) return;
      const update = () => {
        const remaining = Math.max(0, new Date(tx.expiration).getTime() - Date.now());
        setTimeLeftMs(remaining);
      };
      update();
      const id = setInterval(update, 1000);
      return () => clearInterval(id);
    }, [tx?.expiration]);

    const formatLeft = () => {
      const s = Math.floor(timeLeftMs / 1000);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const ss = s % 60;
      return h > 0
        ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
        : `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    };

    const handleCreate = async () => {
      // Evitar criação automática/duplicada; somente inicia a partir do estado de coleta
      if (stage !== 'collect') return;
      try {
        setError(''); setStage('creating');
        try { if (typeof onStart === 'function') onStart(); } catch {}
        // Determinar administrador conectado (prioriza admin logado; senão busca em 'admins')
        let adminId = null;
        if (currentUser?.isAdmin) {
          adminId = currentUser.id;
        }
        if (!adminId) {
          try {
            const q = query(collection(db, 'admins'), where('mercado_pago_connected', '==', true));
            const snap = await getDocs(q);
            if (!snap.empty) adminId = snap.docs[0].id;
          } catch {}
        }
        if (!adminId) {
          setStage('error');
          setError('Administrador não conectado ao Mercado Pago. Conecte em Configurações > Pagamentos.');
          return;
        }
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        // Preferir PIX para checkout simples sem cadastro
        const wantsPix = settings?.payment?.methods?.pix !== false; // default true
        let created = null;
        if (wantsPix) {
          const res = await axios.post(`${apiBase}/api/payments/mercadopago/createPixPayment`, {
            adminId,
            userId: currentUser?.id,
            roundId: context?.roundId,
            amount: context?.amount,
            cartelaCodes: context?.cartelaCodes || [],
            payer: { name: payer?.name }
          });
          created = res.data;
          setTx({ ...created });
          setStage('showing');
        } else {
          const res = await axios.post(`${apiBase}/api/payments/mercadopago/createPreference`, {
            adminId,
            userId: currentUser?.id,
            roundId: context?.roundId,
            amount: context?.amount,
            cartelaCodes: context?.cartelaCodes || [],
            payer: { name: payer?.name, email: payer?.email }
          });
          created = res.data;
          setTx({ ...created });
          // Open checkout em nova aba (cartão)
          if (created?.init_point) {
            try { window.open(created.init_point, '_blank', 'noopener'); } catch {}
          }
          setStage('showing');
        }
        // start polling every 10s usando reconciliação
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
          try {
            const sres = await axios.get(`${apiBase}/api/payments/mercadopago/reconcile`, { params: { id: created.id } });
            const status = sres.data?.status;
            if (status === 'approved') {
              setApprovedAt(new Date());
              setStage('approved');
              clearInterval(pollRef.current);
              // Registrar evento no histórico do usuário
              try {
                await addDoc(collection(db, 'user_events'), {
                  userId: currentUser?.id,
                  type: 'payment_approved',
                  transactionId: created.id,
                  roundId: context?.roundId || null,
                  amount: context?.amount || null,
                  createdAt: serverTimestamp()
                });
              } catch {}
              try { if (typeof onApproved === 'function') onApproved({ id: created.id }); } catch {}
            } else if (status === 'rejected') {
              setError('Pagamento rejeitado. Tente novamente.');
              setStage('error');
              clearInterval(pollRef.current);
              try { if (typeof onError === 'function') onError(new Error('Pagamento rejeitado')); } catch {}
            }
          } catch {}
        }, 10000);
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'Falha ao criar pagamento');
        setStage('error');
        try { if (typeof onError === 'function') onError(e); } catch {}
      }
    };

    const handleCopy = async () => {
      const text = tx?.pixCopiaECola || tx?.qrCode;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        setCopied('copiado');
        setTimeout(() => setCopied(''), 1500);
      } catch {
        setCopied('erro');
        setTimeout(() => setCopied(''), 1500);
      }
    };

    const closeModal = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      onClose();
    };

    const formatDateTimeBR = (date) => {
      try {
        return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
      } catch {
        return (date || new Date()).toLocaleString('pt-BR');
      }
    };

    const normalizePhone = (s) => {
      const d = String(s || '').replace(/\D/g, '');
      return d.length > 11 ? d.slice(-11) : d; // DDD+numero
    };

    const handleCopyTxId = async () => {
      if (!tx?.id) return;
      try {
        await navigator.clipboard.writeText(tx.id);
        setCopied('copiado');
        setTimeout(() => setCopied(''), 1500);
      } catch {
        setCopied('erro');
        setTimeout(() => setCopied(''), 1500);
      }
    };

    const sendReceiptWhatsApp = async () => {
      const when = approvedAt || new Date();
      const text = [
        '✅ Pagamento confirmado!',
        '',
        `Rodada: ${context?.roundName || ''}`,
        `Participações: ${context?.cartelaCodes?.length || 0}`,
        `Valor pago: ${fmtBRL(context?.amount || 0)}`,
        `Data/hora: ${formatDateTimeBR(when)}`,
        `Transação: ${tx?.id || ''}`,
        '',
        'Obrigado pela participação! 🎉'
      ].join('\n');

      const number = normalizePhone(currentUser?.whatsapp || '');
      const evo = settings?.devolution || {};
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      try {
        if (evo?.link && evo?.instanceName && evo?.token) {
          await axios.post(`${apiBase}/api/evolution/sendText`, {
            number: `55${number}`,
            text,
            link: evo.link,
            instance: evo.instanceName,
            token: evo.token
          });
          alert('✅ Comprovante enviado por WhatsApp.');
        } else {
          window.open(`https://wa.me/55${number}?text=${encodeURIComponent(text)}`, '_blank');
        }
        try {
          await addDoc(collection(db, 'user_events'), {
            userId: currentUser?.id,
            type: 'payment_receipt_sent',
            transactionId: tx?.id || null,
            roundId: context?.roundId || null,
            amount: context?.amount || null,
            createdAt: serverTimestamp()
          });
        } catch {}
      } catch (err) {
        alert('Não foi possível enviar o comprovante no WhatsApp.');
      }
    };

    const supportHref = `mailto:?subject=Erro%20Pagamento%20Checkout&body=Transacao:%20${encodeURIComponent(tx?.id || '')}%0ARodada:%20${encodeURIComponent(context?.roundId || '')}`;

    if (!open) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-label="Pagamento Checkout">
        <div className="bg-white rounded-xl w-[95%] sm:w-full max-w-xl max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2">
              <DollarSign className="text-green-600" size={22} />
              <h3 className="text-lg font-bold">Pagamento</h3>
            </div>
            <button onClick={closeModal} className="p-2 rounded hover:bg-gray-100" aria-label="Fechar">
              <X size={18} />
            </button>
          </div>

          {stage === 'collect' && (
            <div className="p-4 space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">Rodada: <span className="font-semibold">{context?.roundName}</span></p>
                <p className="text-sm text-blue-800">Participações: <span className="font-semibold">{context?.cartelaCodes?.length || 0}</span></p>
                <p className="text-sm text-blue-800">Valor total: <span className="font-bold">{fmtBRL(context?.amount || 0)}</span></p>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">{error}</div>
              )}
              {/* PIX simples: sem necessidade de e-mail/conta */}
              <div className="text-sm text-gray-700">
                Pagamento via PIX com QR Code. Sem cadastro.
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleCreate} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Gerar QR Code PIX</button>
                <button onClick={closeModal} className="px-4 py-2 border rounded-lg">Cancelar</button>
              </div>
            </div>
          )}

          {stage === 'creating' && (
            <div className="p-6 text-center space-y-3">
              <Loader2 className="mx-auto animate-spin text-green-600" size={28} />
              <p className="text-sm text-gray-700">Gerando checkout...</p>
            </div>
          )}

          {stage === 'showing' && tx && (
            <div className="p-4 space-y-3">
              <div className="flex flex-col items-center gap-3">
                <p className="text-xl font-bold text-green-700">{fmtBRL(context?.amount || 0)}</p>
                {/* Exibir QR do PIX quando disponível */}
                {tx?.qrCodeBase64 ? (
                  <img src={`data:image/png;base64,${tx.qrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48 sm:w-56 sm:h-56 border rounded-lg" />
                ) : (
                  <div className="text-sm text-gray-600">Gerando QR Code...</div>
                )}
                {/* Código copia e cola */}
                {(tx?.pixCopiaECola || tx?.qrCode) && (
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-1">Código PIX (copia e cola)</label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input readOnly value={tx?.pixCopiaECola || tx?.qrCode || ''} className="w-full sm:flex-1 px-3 py-2 border rounded-lg text-xs" />
                      <button onClick={handleCopy} className="w-full sm:w-auto px-3 py-2 bg-gray-800 text-white rounded">Copiar</button>
                    </div>
                    {copied === 'copiado' && (
                      <div className="mt-1 text-xs text-green-700 flex items-center gap-1" aria-live="polite">
                        <Check size={14} /> Código copiado!
                      </div>
                    )}
                    {copied === 'erro' && (
                      <div className="mt-1 text-xs text-red-700" aria-live="polite">
                        Não foi possível copiar. Copie manualmente.
                      </div>
                    )}
                  </div>
                )}
                {/* Expiração */}
                {tx?.expiration && (
                  <p className="text-xs text-gray-600">Expira em {formatLeft()}</p>
                )}
                <div className="text-xs text-gray-600">Após pagar, verificaremos seu status automaticamente.</div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={closeModal} className="px-4 py-2 border rounded">Fechar</button>
              </div>
            </div>
          )}

          {stage === 'approved' && (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <CheckCircle className="mx-auto text-green-600 animate-bounce" size={40} />
                <p className="mt-2 text-lg font-bold text-green-700">Pagamento aprovado!</p>
                <p className="text-sm text-gray-700">Tudo certo. Seu pagamento foi processado com sucesso.</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-green-700 font-medium">Valor pago</span>
                  <span className="text-green-800 font-bold">{fmtBRL(context?.amount || 0)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-green-700 font-medium">Data/hora</span>
                  <span className="text-green-800">{formatDateTimeBR(approvedAt || new Date())}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button onClick={closeModal} className="w-full sm:w-auto px-4 py-2 border rounded">Voltar</button>
              </div>
            </div>
          )}

          {stage === 'error' && (
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle size={22} />
                <p className="font-semibold">Falha ao processar pagamento</p>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">{error}</div>}
              <div className="flex items-center gap-2">
                <button onClick={() => { setStage('collect'); setError(''); }} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Tentar Novamente</button>
                <a href={supportHref} className="px-4 py-2 border rounded" target="_blank" rel="noopener noreferrer">Suporte</a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const confirmAndSave = async () => {
    if (!pendingPredictions) return;
    try {
      const { round, predictions: preds, cartelaCode, establishmentId } = pendingPredictions;
      // Checagem adicional antes de salvar
      if (isRoundTimedClosed(round)) {
        alert('Rodada fechada para palpites pelo cronograma definido.');
        return;
      }
      if (!Array.isArray(round.matches) || round.matches.length === 0) {
        alert('Rodada sem jogos configurados. Aguarde o administrador adicionar os confrontos.');
        return;
      }
      if (preds.length !== round.matches.length) {
        alert('Palpites incompletos. Revise e preencha todos os jogos.');
        return;
      }
      const invalidValues = preds.some(p => {
        const hs = p.homeScore; const as = p.awayScore;
        return !Number.isInteger(hs) || !Number.isInteger(as) || hs < 0 || as < 0 || hs > 20 || as > 20;
      });
      if (invalidValues) {
        alert('Insira pontuações válidas (0–20) inteiras em todos os jogos.');
        return;
      }
      
      for (const pred of preds) {
        await addPrediction({
          userId: currentUser.id,
          roundId: round.id,
          matchId: pred.match.id,
          homeScore: pred.homeScore,
          awayScore: pred.awayScore,
          cartelaCode: cartelaCode,
          establishmentId: establishmentId || null,
          finalized: true
        });
      }
      
      try {
        // Buscar a mensagem diretamente do banco para garantir que está atualizada
        const settingsSnapshot = await getDocs(collection(db, 'settings'));
        let messageTemplate = '🏆 *BOLÃO BRASILEIRÃO 2025*\n\n📋 *{RODADA}*\n🎫 *Cartela: {CARTELA}*\n✅ Confirmado!\n\n{PALPITES}\n\n💰 R$ 15,00\n⚠️ *Não pode alterar após pagamento*\n\nBoa sorte! 🍀';
        
        if (!settingsSnapshot.empty) {
          const settingsData = settingsSnapshot.docs[0].data();
          if (settingsData.whatsappMessage) {
            messageTemplate = settingsData.whatsappMessage;
          }
        }
        
        console.log('✅ Enviando mensagem WhatsApp com template:', messageTemplate);
        
        sendWhatsAppMessage(
          currentUser.whatsapp, 
          round.name, 
          preds, 
          teams,
          messageTemplate,
          cartelaCode
        );
      } catch (whatsappError) {
        console.error('❌ Erro ao enviar WhatsApp:', whatsappError);
      }
      
      setShowConfirmModal(false);
      setPendingPredictions(null);
      setSelectedRound(null);
      setEditingPredictions(null);
      setSelectedEstablishment(null);
      alert(`✅ Palpites confirmados!\n🎫 Cartela: ${cartelaCode}\n\nVerifique seu WhatsApp.\n\n⚠️ IMPORTANTE: Os pontos só serão computados após a confirmação do pagamento pelo administrador.`);
    } catch (error) {
      console.error('❌ Erro ao salvar palpites:', error);
      alert('Erro ao salvar palpites: ' + error.message);
    }
  };

  const calculateUserRoundPoints = (userId, roundId, cartelaCode = null) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round || (round.status !== 'finished' && round.status !== 'closed')) return 0;
    
    if (cartelaCode) {
      const cartelaPreds = predictions.filter(p => 
        p.userId === userId && 
        p.roundId === roundId && 
        p.cartelaCode === cartelaCode
      );
      
      if (cartelaPreds.length === 0) return 0;
      const isPaid = cartelaPreds[0]?.paid;
      if (!isPaid) return 0;
      
      let points = 0;
      round.matches?.forEach(match => {
        const pred = cartelaPreds.find(p => p.matchId === match.id);
        
        if (pred && match.finished && match.homeScore !== null && match.awayScore !== null) {
          if (pred.homeScore === match.homeScore && pred.awayScore === match.awayScore) {
            points += 3;
          } else {
            const predResult = pred.homeScore > pred.awayScore ? 'home' : pred.homeScore < pred.awayScore ? 'away' : 'draw';
            const matchResult = match.homeScore > match.awayScore ? 'home' : match.homeScore < match.awayScore ? 'away' : 'draw';
            if (predResult === matchResult) {
              points += 1;
            }
          }
        }
      });
      return points;
    }
    
    const userRoundPreds = predictions.filter(p => p.userId === userId && p.roundId === roundId);
    const cartelaCodes = [...new Set(userRoundPreds.map(p => p.cartelaCode || 'ANTIGA'))];
    
    return cartelaCodes.reduce((sum, code) => {
      return sum + calculateUserRoundPoints(userId, roundId, code);
    }, 0);
  };

  const getRankingForRound = (roundId) => {
    if (!roundId) return [];
    
    const rankingEntries = [];
    
    users.filter(u => !u.isAdmin).forEach(user => {
      const userRoundPreds = predictions.filter(p => p.userId === user.id && p.roundId === roundId);
      const cartelaCodes = [...new Set(userRoundPreds.map(p => p.cartelaCode || 'ANTIGA'))];
      
      cartelaCodes.forEach(cartelaCode => {
        const cartelaPreds = userRoundPreds.filter(p => (p.cartelaCode || 'ANTIGA') === cartelaCode);
        const isPaid = cartelaPreds.length > 0 && cartelaPreds[0]?.paid;
        
        if (!isPaid) return;
        
        const points = calculateUserRoundPoints(user.id, roundId, cartelaCode);
        
        rankingEntries.push({
          user,
          cartelaCode,
          establishmentId: cartelaPreds[0]?.establishmentId,
          points,
          predictions: cartelaPreds.length,
          isPaid: true
        });
      });
    });
    
    return rankingEntries.sort((a, b) => b.points - a.points);
  };

  const getRoundPrize = (roundId) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round || round.status !== 'finished') return null;

    const betValue = settings?.betValue || 15;
    const ranking = getRankingForRound(roundId);
    if (ranking.length === 0) return null;

    const totalPaid = ranking.length * betValue;
    const prizePool = totalPaid * 0.85;
    const maxPoints = ranking[0].points;
    const winners = ranking.filter(r => r.points === maxPoints);
    const prizePerWinner = prizePool / winners.length;

    return {
      totalPaid,
      prizePool,
      winners,
      prizePerWinner
    };
  };

  const userPredictions = predictions.filter(p => p.userId === currentUser.id);
  const totalPoints = rounds
    .filter(r => r.status === 'finished')
    .reduce((sum, round) => {
      const cartelaPoints = calculateRoundPoints(round.id);
      if (cartelaPoints) {
        return sum + Object.values(cartelaPoints).reduce((a, b) => a + b, 0);
      }
      return sum;
    }, 0);
  
  // Cache do ranking para melhorar performance
  const ranking = useMemo(() => {
    return selectedRankingRound ? getRankingForRound(selectedRankingRound) : [];
  }, [selectedRankingRound, predictions, rounds, users]);
  
  const roundPrize = useMemo(() => {
    return selectedRankingRound ? getRoundPrize(selectedRankingRound) : null;
  }, [selectedRankingRound, settings]);

  // Utilitário de timestamp de rodada para ordenação/filtragem
  const roundToTimestamp = (r) => {
    if (r?.closeAt) {
      const t = new Date(r.closeAt).getTime();
      if (!isNaN(t)) return t;
    }
    const ca = r?.createdAt;
    if (ca && typeof ca.toDate === 'function') {
      return ca.toDate().getTime();
    }
    if (ca && typeof ca === 'object' && typeof ca.seconds === 'number') {
      return ca.seconds * 1000;
    }
    return typeof r?.number === 'number' ? r.number : 0;
  };

  // Lista de rodadas finalizadas com ordenação cronológica (mais recente primeiro)
  const finishedRoundsAll = useMemo(() => {
    return rounds
      .filter(r => r.status === 'finished')
      .sort((a, b) => roundToTimestamp(b) - roundToTimestamp(a));
  }, [rounds]);

  // Nesta aba não mostramos a mais recente: base exclui a primeira (mais recente)
  const finishedRoundsBase = useMemo(() => {
    if (finishedRoundsAll.length === 0) return finishedRoundsAll;
    const latestId = finishedRoundsAll[0].id;
    return finishedRoundsAll.filter(r => r.id !== latestId);
  }, [finishedRoundsAll]);

  // Aplicar filtros por data/período
  const filteredFinishedRounds = useMemo(() => {
    const now = Date.now();
    const periodMs = {
      '3m': 1000 * 60 * 60 * 24 * 90,
      '6m': 1000 * 60 * 60 * 24 * 180,
      '12m': 1000 * 60 * 60 * 24 * 365,
      'all': null
    }[finishedPeriod] || null;

    const startTs = finishedStartDate ? new Date(finishedStartDate).getTime() : null;
    const endTs = finishedEndDate ? new Date(finishedEndDate).getTime() : null;
    const periodStart = periodMs ? now - periodMs : null;

    return finishedRoundsBase.filter(r => {
      const ts = roundToTimestamp(r);
      if (periodStart && ts < periodStart) return false;
      if (startTs && ts < startTs) return false;
      if (endTs && ts > endTs) return false;
      return true;
    });
  }, [finishedRoundsBase, finishedStartDate, finishedEndDate, finishedPeriod]);

  // Selecionar automaticamente a rodada mais recente do filtro ao entrar/alterar filtros
  useEffect(() => {
    if (activeTab === 'finished') {
      const latest = filteredFinishedRounds[0];
      if (latest && selectedFinishedRound !== latest.id) {
        setSelectedFinishedRound(latest.id);
      }
    }
  }, [activeTab, filteredFinishedRounds]);

  // Cache do ranking e prêmio para rodadas finalizadas
  const finishedRanking = useMemo(() => {
    return selectedFinishedRound ? getRankingForRound(selectedFinishedRound) : [];
  }, [selectedFinishedRound, predictions, rounds, users]);

  const finishedPrize = useMemo(() => {
    return selectedFinishedRound ? getRoundPrize(selectedFinishedRound) : null;
  }, [selectedFinishedRound, settings]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Olá, {currentUser.name}! 👋</h1>
              <p className="text-green-100 mt-1">Bolão Brasileirão 2025</p>
            </div>
            <button onClick={() => { logout(); setView('login'); }} className="flex items-center gap-2 bg-green-700 px-4 py-2 rounded-lg">
              <LogOut size={18} /> Sair
            </button>
          </div>
          
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6 items-center">
            {['predictions', 'ranking', 'finished', 'history'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-2 border-b-2 font-medium ${activeTab === tab ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}>
                {tab === 'predictions' && <><Target className="inline mr-2" size={18} />Palpites</>}
                {tab === 'ranking' && <><TrendingUp className="inline mr-2" size={18} />Ranking</>}
                {tab === 'finished' && <>
                  <Calendar className="inline mr-2" size={18} />Rodadas Finalizadas
                  {finishedRoundsBase.length > 0 && (
                    <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs"
                          title="Quantidade de rodadas finalizadas disponíveis">
                      {finishedRoundsBase.length}
                    </span>
                  )}
                </>}
                {tab === 'history' && <><Calendar className="inline mr-2" size={18} />Minhas Rodadas</>}
              </button>
            ))}
            <button onClick={() => setShowRulesModal(true)} className="py-4 px-2 border-b-2 font-medium border-transparent text-gray-500 hover:text-green-700 flex items-center gap-2">
              <FileText className="inline mr-2" size={18} />Regras
            </button>
          </div>
        </div>
      </div>

      {showRulesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileText className="text-green-600" size={24} />
                <h3 className="text-2xl font-bold">Regras do Bolão</h3>
              </div>
              <button onClick={() => setShowRulesModal(false)}><X size={24} /></button>
            </div>
            <div className="p-6">
              <RulesCard />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'predictions' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Rodadas Disponíveis</h2>
            <p className="text-gray-600 mb-6">Escolha uma rodada e faça seus palpites • R$ {settings?.betValue?.toFixed(2) || '15,00'} por participação</p>
            {predictableRounds.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold mb-2">Nenhuma rodada disponível</h3>
              </div>
            ) : (
              <div className="grid gap-4">
                {predictableRounds.map((round) => {
                  const userCartelas = getUserCartelasForRound(round.id);
                  
                  return (
                    <div key={round.id} className="bg-white rounded-xl shadow-sm border p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold">{round.name}</h3>
                          <p className="text-gray-600 mt-1">{round.matches?.length || 0} jogos • R$ {settings?.betValue?.toFixed(2) || '15,00'} por participação</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                          <button 
                            onClick={() => handleStartPrediction(round)} 
                            className="w-full sm:w-auto justify-center flex items-center gap-2 bg-green-600 text-white px-4 sm:px-6 py-3 rounded-lg font-medium hover:bg-green-700"
                          >
                            <Plus size={20} />
                            Nova Participação
                          </button>
                          {(() => {
                            const pendingCartelas = (getUserCartelasForRound(round.id) || []).filter(c => !c.paid);
                            const pendingCodes = pendingCartelas.map(c => c.code);
                            const totalAmount = (settings?.betValue || 15) * pendingCartelas.length;
                            const disabled = pendingCartelas.length === 0 || !!paymentLocks[round.id] || !!paymentModalOpen;
                            return (
                              <button
                                onClick={() => openPaymentForRound(round, pendingCodes, totalAmount)}
                                disabled={disabled}
                                className={`w-full sm:w-auto justify-center flex items-center gap-2 px-4 sm:px-6 py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 ${disabled ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400'}`}
                                aria-label={`Efetuar pagamento da rodada ${round.name} no valor de ${fmtBRL(totalAmount)}`}
                              >
                                <DollarSign size={20} />
                                {paymentLocks[round.id] ? 'Processando...' : 'Efetuar Pagamento da Rodada'}
                                {!disabled && <span> • {fmtBRL(totalAmount)}</span>}
                              </button>
                            );
                          })()}
                        </div>
                      </div>

                      {userCartelas.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Suas Participações ({userCartelas.length})
                          </h4>
                          <div className="grid gap-2">
                            {userCartelas.map((cartela, index) => {
                              const est = establishments.find(e => e.id === cartela.establishmentId);
                              return (
                                <div key={cartela.code} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                      {index + 1}
                                    </div>
                                    <div>
                                      <button
                                        onClick={() => setCartelaDetails({ round, cartela })}
                                        className="font-mono text-sm font-bold text-blue-700 hover:underline"
                                        title="Ver detalhes da cartela"
                                      >
                                        {cartela.code}
                                      </button>
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs text-gray-600">{cartela.predictions.length} palpites</p>
                                        {est && (
                                          <span className="text-xs text-orange-600 flex items-center gap-1">
                                            <Store size={12} /> {est.name}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${cartela.paid ? 'bg-green-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
                                      {cartela.paid ? '💰 Pago' : '⚠️ Pendente'}
                                    </span>
                                    {!cartela.paid && (
                                      <button
                                        onClick={() => handleDeleteCartela(round.id, cartela.code)}
                                        className="px-2 py-1 border rounded-lg text-xs text-red-700 hover:bg-red-50 flex items-center gap-1"
                                        title="Excluir cartela"
                                      >
                                        <Trash2 size={14} /> Excluir
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Total a pagar:</strong> R$ {(userCartelas.length * (settings?.betValue || 15)).toFixed(2)}
                              {userCartelas.filter(c => !c.paid).length > 0 && (
                                <span className="ml-2 text-orange-700">
                                  • {userCartelas.filter(c => !c.paid).length} pendente(s)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ranking' && (
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">Ranking</h2>
                <p className="text-gray-600 mt-1">Classificação por rodada • Premiação: 85%</p>
              </div>
              <div className="w-64">
                <label className="block text-sm font-medium mb-2">Selecione a Rodada</label>
                <select
                  value={selectedRankingRound || ''}
                  onChange={(e) => setSelectedRankingRound(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-white"
                >
                  {rankableRounds.length === 0 && (
                    <option value="">Nenhuma rodada fechada ou finalizada</option>
                  )}
                  {rankableRounds.map(round => (
                    <option key={round.id} value={round.id}>
                      {round.name} {round.status === 'closed' ? '• Parcial' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!selectedRankingRound || rankableRounds.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed">
                <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold mb-2">Nenhuma rodada fechada ou finalizada</h3>
                <p className="text-gray-500">O ranking aparece para rodadas fechadas (parcial) e finalizadas (final)</p>
              </div>
            ) : (
              <div className="space-y-6">
                {roundPrize && roundPrize.winners.length > 0 && (
                  <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-xl p-8 text-white">
                    <div className="flex items-center gap-3 mb-6">
                      <Trophy size={48} />
                      <div>
                        <h3 className="text-3xl font-bold">Premiação (85%)</h3>
                        <p className="text-yellow-100">
                          {roundPrize.winners.length > 1 ? `${roundPrize.winners.length} Vencedores (Empate)` : 'Campeão da Rodada'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white bg-opacity-20 rounded-xl p-6 mb-6">
                      <div className="text-center">
                        <p className="text-yellow-100 text-sm font-medium">PRÊMIO {roundPrize.winners.length > 1 ? 'POR VENCEDOR' : 'TOTAL'}</p>
                        <p className="text-5xl font-bold mt-2">R$ {roundPrize.prizePerWinner.toFixed(2)}</p>
                        <p className="text-yellow-100 text-sm mt-2">
                          Total arrecadado: R$ {roundPrize.totalPaid.toFixed(2)} | Premiação: R$ {roundPrize.prizePool.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {roundPrize.winners.map((winner) => {
                        const est = establishments.find(e => e.id === winner.establishmentId);
                        return (
                          <div key={`${winner.user.id}-${winner.cartelaCode}`} className="bg-white rounded-lg p-4 text-gray-900 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <Trophy className="text-yellow-500" size={32} />
                              <div>
                                <p className="font-bold text-xl">{winner.user.name}</p>
                                <p className="text-sm text-gray-600">{winner.user.whatsapp}</p>
                                <p className="text-xs text-blue-600 font-mono">🎫 {winner.cartelaCode}</p>
                                {est && (
                                  <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                                    <Store size={12} /> {est.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-3xl font-bold text-green-600">{winner.points} pts</p>
                              <p className="text-lg font-bold text-green-700">+ R$ {roundPrize.prizePerWinner.toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {roundPrize.winners.length > 1 && (
                      <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center mt-4">
                        <p className="text-sm">⚠️ Empate detectado! Premiação dividida igualmente.</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                    <h3 className="font-bold text-lg">
                      {rounds.find(r => r.id === selectedRankingRound)?.name}
                    </h3>
                    <p className="text-sm text-green-100 mt-1">⚠️ Apenas palpites pagos são contabilizados</p>
                    {rounds.find(r => r.id === selectedRankingRound)?.status === 'closed' && (
                      <p className="text-xs text-yellow-200 mt-1">Resultados parciais (rodada fechada)</p>
                    )}
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Posição</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Participante</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Pontos</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Premiação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {ranking.map((item, index) => {
                        const isWinner = roundPrize && roundPrize.winners.some(w => w.user.id === item.user.id && w.cartelaCode === item.cartelaCode);
                        
                        // Calcular posição considerando empates
                        let position = 1;
                        let uniqueScores = [];
                        
                        // Coletar pontuações únicas maiores que a pontuação atual
                        for (let i = 0; i < ranking.length; i++) {
                          if (ranking[i].points > item.points && !uniqueScores.includes(ranking[i].points)) {
                            uniqueScores.push(ranking[i].points);
                          }
                        }
                        
                        // A posição é o número de pontuações únicas maiores + 1
                        position = uniqueScores.length + 1;
                        
                        const est = establishments.find(e => e.id === item.establishmentId);
                        
                        return (
                          <tr
                            key={`${item.user.id}-${item.cartelaCode}`}
                            onClick={() => openRankingCartelaDetails(selectedRankingRound, item)}
                            className={`cursor-pointer hover:bg-gray-50 ${item.user.id === currentUser.id ? 'bg-green-50' : ''} ${isWinner ? 'bg-yellow-50' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold">{position}º</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <span className="font-medium">{item.user.name}</span>
                                {item.user.id === currentUser.id && (
                                  <span className="ml-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">Você</span>
                                )}
                                {isWinner && (
                                  <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">Vencedor</span>
                                )}
                                <p className="text-xs text-blue-600 font-mono mt-1">🎫 {item.cartelaCode}</p>
                                {est && (
                                  <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                                    <Store size={12} /> {est.name}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-xl font-bold text-green-600">{item.points}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isWinner && roundPrize ? (
                                <span className="text-lg font-bold text-green-600">R$ {roundPrize.prizePerWinner.toFixed(2)}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {ranking.length === 0 && (
                    <div className="p-12 text-center">
                      <Users className="mx-auto text-gray-400 mb-4" size={48} />
                      <h3 className="text-xl font-semibold mb-2">Nenhum participante pagou ainda</h3>
                      <p className="text-gray-500">Apenas participantes com pagamento confirmado aparecem no ranking</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'finished' && (
          <div className="transition-opacity">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">Rodadas Finalizadas</h2>
                <p className="text-gray-600 mt-1">Ranking de rodadas antigas • Filtre por período</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full md:w-auto">
                <div>
                  <label className="block text-sm font-medium mb-1">Período</label>
                  <select
                    value={finishedPeriod}
                    onChange={(e) => setFinishedPeriod(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                    title="Selecione um período rápido (3, 6, 12 meses ou todos)"
                  >
                    <option value="all">Todos</option>
                    <option value="3m">Últimos 3 meses</option>
                    <option value="6m">Últimos 6 meses</option>
                    <option value="12m">Últimos 12 meses</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Início</label>
                  <input
                    type="date"
                    value={finishedStartDate}
                    onChange={(e) => setFinishedStartDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                    title="Data inicial para filtrar rodadas finalizadas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fim</label>
                  <input
                    type="date"
                    value={finishedEndDate}
                    onChange={(e) => setFinishedEndDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                    title="Data final para filtrar rodadas finalizadas"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-start mb-6">
              <div className="w-64">
                <label className="block text-sm font-medium mb-2">Selecione a Rodada</label>
                <select
                  value={selectedFinishedRound || ''}
                  onChange={(e) => setSelectedFinishedRound(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-white"
                  title="Escolha a rodada finalizada para ver o ranking"
                >
                  {filteredFinishedRounds.length === 0 && (
                    <option value="">Nenhuma rodada finalizada</option>
                  )}
                  {filteredFinishedRounds.map((round) => (
                    <option key={round.id} value={round.id}>
                      {round.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setFinishedStartDate(''); setFinishedEndDate(''); setFinishedPeriod('all'); }}
                  className="px-4 py-2 border rounded-lg bg-white hover:bg-gray-50"
                  title="Limpar filtros aplicados"
                >
                  Limpar filtros
                </button>
              </div>
            </div>

            {!selectedFinishedRound || filteredFinishedRounds.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed">
                <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold mb-2">Nenhuma rodada finalizada</h3>
                <p className="text-gray-500">Use os filtros acima para encontrar rodadas antigas</p>
              </div>
            ) : (
              <div className="space-y-6">
                {finishedPrize && finishedPrize.winners.length > 0 && (
                  <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-xl p-8 text-white">
                    <div className="flex items-center gap-3 mb-6">
                      <Trophy size={28} />
                      <h3 className="text-2xl font-bold">Premiação</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-sm text-yellow-100">Total Pago</p>
                        <p className="text-2xl font-bold">R$ {finishedPrize.totalPaid.toFixed(2)}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-sm text-yellow-100">Premiação (85%)</p>
                        <p className="text-2xl font-bold">R$ {finishedPrize.prizePool.toFixed(2)}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-sm text-yellow-100">Por vencedor</p>
                        <p className="text-2xl font-bold">R$ {finishedPrize.prizePerWinner.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-xl overflow-hidden shadow">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Participante</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Cartela</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Estabelecimento</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Pontos</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Premiação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {finishedRanking.map((item) => {
                        const isWinner = finishedPrize && finishedPrize.winners.some(w => w.user.id === item.user.id && w.cartelaCode === item.cartelaCode);
                        const establishment = establishments.find(e => e.id === item.establishmentId);
                        return (
                          <tr key={`${item.user.id}-${item.cartelaCode}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
                                  {item.user.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <p className="font-medium">{item.user.name}</p>
                                  <p className="text-xs text-gray-500">{item.user.whatsapp}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-mono text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">{item.cartelaCode}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {establishment ? (
                                <span className="text-sm font-medium text-orange-600" title="Estabelecimento vinculador da cartela">{establishment.name}</span>
                              ) : (
                                <span className="text-xs text-gray-400">Nenhum</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-xl font-bold text-green-600">{item.points}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isWinner && finishedPrize ? (
                                <span className="text-lg font-bold text-green-600">R$ {finishedPrize.prizePerWinner.toFixed(2)}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {finishedRanking.length === 0 && (
                    <div className="p-12 text-center">
                      <Users className="mx-auto text-gray-400 mb-4" size={48} />
                      <h3 className="text-xl font-semibold mb-2">Nenhum participante pagou ainda</h3>
                      <p className="text-gray-500">Apenas participantes com pagamento confirmado aparecem no ranking</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Minhas Rodadas</h2>
            <p className="text-gray-600 mb-6">Veja apenas as rodadas em que você já participa</p>

            {myOpenOrUpcomingRounds.length === 0 && myClosedRounds.length === 0 && myFinishedRounds.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold mb-2">Você ainda não participa de nenhuma rodada</h3>
                <p className="text-gray-500">Vá em "Rodadas Disponíveis" para entrar em uma rodada</p>
              </div>
            ) : (
              <div className="space-y-8">
                {myOpenOrUpcomingRounds.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        {myOpenOrUpcomingRounds.length}
                      </span>
                      Rodadas Ativas
                    </h3>
                    <div className="space-y-3">
                      {myOpenOrUpcomingRounds.map(round => <RoundAccordion key={round.id} round={round} />)}
                    </div>
                  </div>
                )}

                {myClosedRounds.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
                        {myClosedRounds.length}
                      </span>
                      Rodadas Aguardando Resultados
                    </h3>
                    <div className="space-y-3">
                      {myClosedRounds.map(round => <RoundAccordion key={round.id} round={round} />)}
                    </div>
                  </div>
                )}

                {myFinishedRounds.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        {myFinishedRounds.length}
                      </span>
                      Rodadas Finalizadas
                    </h3>
                    <div className="space-y-3">
                      {myFinishedRounds.map(round => <RoundAccordion key={round.id} round={round} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showEstablishmentModal && selectedRound && (
        <EstablishmentModal 
          onSelect={handleEstablishmentSelected} 
          onCancel={() => { setShowEstablishmentModal(false); setSelectedRound(null); }} 
        />
      )}
      {selectedRound && !showEstablishmentModal && <PredictionForm round={selectedRound} initialPredictions={editingPredictions} />}
      {showConfirmModal && pendingPredictions && (
        <ConfirmModal 
          round={pendingPredictions.round} 
          predictionsData={pendingPredictions.predictions}
          cartelaCode={pendingPredictions.cartelaCode}
          establishmentId={pendingPredictions.establishmentId}
          onConfirm={confirmAndSave} 
          onCancel={() => { setShowConfirmModal(false); setEditingPredictions(pendingPredictions.predictions); }} 
        />
      )}
      {cartelaDetails && (
        <CartelaDetailsModal
          round={cartelaDetails.round}
          cartela={cartelaDetails.cartela}
          onClose={() => setCartelaDetails(null)}
        />
      )}
      {paymentModalOpen && paymentContext && (
        <PaymentModal
          open={paymentModalOpen}
          onClose={() => { if (paymentContext?.roundId) setPaymentLocks(prev => ({ ...prev, [paymentContext.roundId]: false })); setPaymentModalOpen(false); setPaymentContext(null); }}
          context={paymentContext}
          currentUser={currentUser}
          onStart={() => { /* lock already set on open */ }}
          onApproved={() => { if (paymentContext?.roundId) setPaymentLocks(prev => ({ ...prev, [paymentContext.roundId]: false })); }}
          onError={() => { if (paymentContext?.roundId) setPaymentLocks(prev => ({ ...prev, [paymentContext.roundId]: false })); }}
        />
      )}
    </div>
  );
};

// Tela de Manutenção
const MaintenanceScreen = () => {
  const { settings } = useApp();
  const brand = settings?.brandName || 'Bolão Brasileiro 2025';
  const message = settings?.maintenanceMessage || 'Estamos realizando uma manutenção programada para melhorar sua experiência. Por favor, tente novamente em breve.';
  const untilMs = settings?.maintenanceUntil || null;
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (!untilMs) return;
    const tick = () => {
      const now = Date.now();
      const diff = untilMs - now;
      if (diff <= 0) { setRemaining('Pouco tempo'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [untilMs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-green-700 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="bg-green-700 text-white p-6 flex items-center gap-3">
          <AlertCircle size={28} className="text-white" />
          <div>
            <h1 className="text-2xl font-bold">Sistema em manutenção</h1>
            <p className="text-sm opacity-90">{brand}</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <AlertCircle size={26} className="text-green-700" />
            </div>
            <p className="text-gray-800 text-lg font-medium">{message}</p>
          </div>
          {untilMs && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <Loader2 size={20} className="text-green-700 animate-spin" />
              <div className="text-sm text-green-800">
                <p className="font-semibold">Previsão de retorno</p>
                <p>Volta estimada em: <span className="font-mono">{remaining}</span></p>
              </div>
            </div>
          )}
          <div className="pt-2 text-sm text-gray-500">
            <p>Administradores podem acessar normalmente.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const { currentUser, loading, settings } = useApp();
  const [view, setView] = useState('login');

  useEffect(() => {
    if (currentUser) {
      setView(currentUser.isAdmin ? 'admin' : 'user');
    } else {
      setView('login');
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-900 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <div className="text-gray-800 text-xl font-bold">Carregando...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || view === 'login') return <LoginScreen setView={setView} />;
  // Gating global: se manutenção estiver ativa, usuários logados não-admin são direcionados à tela de manutenção
  if (settings?.maintenanceMode && (currentUser && !currentUser.isAdmin)) {
    return <MaintenanceScreen />;
  }
  if (currentUser.isAdmin && view === 'admin') return <AdminPanel setView={setView} />;
  if (view === 'user') return <UserPanel setView={setView} />;
  return null;
}

export default function Root() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}
