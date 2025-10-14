import React, { useState, useEffect, createContext, useContext } from 'react';
import { Trophy, Users, Calendar, TrendingUp, LogOut, Eye, EyeOff, Plus, Edit2, Trash2, Upload, ExternalLink, X, UserPlus, Target, Award, ChevronDown, ChevronUp, Check, Key, DollarSign, CheckCircle, XCircle, AlertCircle, FileText, Download, Store, Filter } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';

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
      await addDoc(collection(db, 'users'), { ...user, createdAt: serverTimestamp() });
    }

    for (const team of SERIE_A_2025_TEAMS) {
      await addDoc(collection(db, 'teams'), { ...team, createdAt: serverTimestamp() });
    }

    if (settingsSnapshot.empty) {
      await addDoc(collection(db, 'settings'), {
        whatsappMessage: '🏆 *BOLÃO BRASILEIRÃO 2025*\n\n📋 *{RODADA}*\n🎫 *Cartela: {CARTELA}*\n✅ Confirmado!\n\n{PALPITES}\n\n💰 R$ 15,00\n⚠️ *Não pode alterar após pagamento*\n\nBoa sorte! 🍀',
        betValue: 15,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await initializeDatabase();
        const [u, t, r, p, s, e] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'teams')),
          getDocs(collection(db, 'rounds')),
          getDocs(collection(db, 'predictions')),
          getDocs(collection(db, 'settings')),
          getDocs(collection(db, 'establishments'))
        ]);
        setUsers(u.docs.map(d => ({ id: d.id, ...d.data() })));
        setTeams(t.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)));
        setRounds(r.docs.map(d => ({ id: d.id, ...d.data() })));
        setPredictions(p.docs.map(d => ({ id: d.id, ...d.data() })));
        setEstablishments(e.docs.map(d => ({ id: d.id, ...d.data() })));
        setSettings(s.docs.length > 0 ? { id: s.docs[0].id, ...s.docs[0].data() } : null);
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
      onSnapshot(collection(db, 'users'), s => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'establishments'), s => setEstablishments(s.docs.map(d => ({ id: d.id, ...d.data() })))),
      onSnapshot(collection(db, 'settings'), s => setSettings(s.docs.length > 0 ? { id: s.docs[0].id, ...s.docs[0].data() } : null))
    ];
    return () => uns.forEach(u => u());
  }, []);

  const value = {
    currentUser, setCurrentUser, users, teams, rounds, predictions, establishments, settings, loading,
    addUser: async (d) => { const r = await addDoc(collection(db, 'users'), { ...d, createdAt: serverTimestamp() }); return { id: r.id, ...d }; },
    updateUser: async (id, d) => await updateDoc(doc(db, 'users', id), d),
    deleteUser: async (id) => await deleteDoc(doc(db, 'users', id)),
    addTeam: async (d) => { const r = await addDoc(collection(db, 'teams'), { ...d, createdAt: serverTimestamp() }); return { id: r.id, ...d }; },
    updateTeam: async (id, d) => await updateDoc(doc(db, 'teams', id), d),
    deleteTeam: async (id) => await deleteDoc(doc(db, 'teams', id)),
    deleteAllTeams: async () => {
      const snapshot = await getDocs(collection(db, 'teams'));
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }
    },
    resetTeamsToSerieA2025: async () => {
      const snapshot = await getDocs(collection(db, 'teams'));
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }
      for (const team of SERIE_A_2025_TEAMS) {
        await addDoc(collection(db, 'teams'), { ...team, createdAt: serverTimestamp() });
      }
    },
    addRound: async (d) => { const r = await addDoc(collection(db, 'rounds'), { ...d, createdAt: serverTimestamp() }); return { id: r.id, ...d }; },
    updateRound: async (id, d) => await updateDoc(doc(db, 'rounds', id), d),
    deleteRound: async (id) => await deleteDoc(doc(db, 'rounds', id)),
    addPrediction: async (d) => { 
      const r = await addDoc(collection(db, 'predictions'), { 
        ...d, 
        paid: false, 
        cartelaCode: d.cartelaCode || generateCartelaCode(),
        createdAt: serverTimestamp() 
      }); 
      return { id: r.id, ...d }; 
    },
    updatePrediction: async (id, d) => await updateDoc(doc(db, 'predictions', id), d),
    addEstablishment: async (d) => { const r = await addDoc(collection(db, 'establishments'), { ...d, createdAt: serverTimestamp() }); return { id: r.id, ...d }; },
    updateEstablishment: async (id, d) => await updateDoc(doc(db, 'establishments', id), d),
    deleteEstablishment: async (id) => await deleteDoc(doc(db, 'establishments', id)),
    updateSettings: async (d) => {
      if (settings?.id) {
        console.log('Atualizando settings com ID:', settings.id, 'Dados:', d);
        await updateDoc(doc(db, 'settings', settings.id), d);
        console.log('Settings atualizado com sucesso');
      } else {
        console.error('Settings ID não encontrado');
        throw new Error('Configurações não inicializadas');
      }
    }
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

const LoginScreen = ({ setView }) => {
  const { users, setCurrentUser, addUser } = useApp();
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [reg, setReg] = useState({ name: '', whatsapp: '', password: '', confirmPassword: '' });

  const handleLogin = () => {
    const user = users.find(u => u.whatsapp === whatsapp && u.password === password);
    if (user) {
      setCurrentUser(user);
      setView(user.isAdmin ? 'admin' : 'user');
      setError('');
    } else {
      setError('WhatsApp ou senha incorretos');
    }
  };

  const handleRegister = async () => {
    if (!reg.name || !reg.whatsapp || !reg.password) return setError('Preencha todos!');
    if (reg.password !== reg.confirmPassword) return setError('Senhas diferentes!');
    if (reg.password.length < 6) return setError('Senha mínimo 6!');
    if (users.find(u => u.whatsapp === reg.whatsapp)) return setError('WhatsApp já cadastrado!');
    try {
      await addUser({ name: reg.name, whatsapp: reg.whatsapp, password: reg.password, isAdmin: false, balance: 0 });
      alert('✅ Cadastrado!');
      setShowRegister(false);
      setWhatsapp(reg.whatsapp);
      setReg({ name: '', whatsapp: '', password: '', confirmPassword: '' });
      setError('');
    } catch (e) {
      setError('Erro: ' + e.message);
    }
  };

  if (showRegister) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-green-700 to-green-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
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
        </div>
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
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b flex justify-between items-center">
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
        <div className="p-6 border-t flex gap-3">
          <button onClick={onCancel} className="flex-1 px-6 py-2 border rounded-lg">Cancelar</button>
          <button onClick={handleSave} className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg">Salvar</button>
        </div>
      </div>
    </div>
  );
};

const TeamForm = ({ team, onSave, onCancel }) => {
  const [formData, setFormData] = useState(team || { name: '', logo: '', logoType: 'url' });

  const handleSave = () => {
    if (!formData.name || !formData.logo) {
      alert('Preencha todos os campos!');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-2xl font-bold">{team ? 'Editar Time' : 'Novo Time'}</h3>
          <button onClick={onCancel}><X size={24} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome do Time</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Ex: Flamengo" />
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
        <div className="p-6 border-t flex gap-3">
          <button onClick={onCancel} className="flex-1 px-6 py-2 border rounded-lg">Cancelar</button>
          <button onClick={handleSave} className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg">Salvar</button>
        </div>
      </div>
    </div>
  );
};

const RoundForm = ({ round, teams, rounds, onSave, onCancel }) => {
  const [formData, setFormData] = useState(round || { number: rounds.length + 1, name: `Rodada ${rounds.length + 1}`, status: 'upcoming', matches: [] });

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
          <div className="grid grid-cols-2 gap-4">
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
                    <div className="col-span-5">
                      <select value={match.homeTeamId} onChange={(e) => updateMatch(match.id, 'homeTeamId', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                        {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 text-center font-bold">VS</div>
                    <div className="col-span-5">
                      <select value={match.awayTeamId} onChange={(e) => updateMatch(match.id, 'awayTeamId', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                        {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-9">
                      <input type="datetime-local" value={match.date} onChange={(e) => updateMatch(match.id, 'date', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <button onClick={() => removeMatch(match.id)} className="text-red-600 p-2"><Trash2 size={18} /></button>
                    </div>
                    <div className="col-span-12 flex items-center gap-2">
                      <input type="checkbox" checked={match.finished} onChange={(e) => updateMatch(match.id, 'finished', e.target.checked)} className="w-4 h-4" />
                      <label className="text-sm">Jogo finalizado</label>
                    </div>
                    {match.finished && (
                      <div className="col-span-12 grid grid-cols-2 gap-3">
                        <input type="number" placeholder="Gols Casa" value={match.homeScore || ''} onChange={(e) => updateMatch(match.id, 'homeScore', parseInt(e.target.value) || null)} className="px-3 py-2 border rounded-lg" />
                        <input type="number" placeholder="Gols Fora" value={match.awayScore || ''} onChange={(e) => updateMatch(match.id, 'awayScore', parseInt(e.target.value) || null)} className="px-3 py-2 border rounded-lg" />
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
          <button onClick={() => onSave(formData)} className="px-6 py-2 bg-green-600 text-white rounded-lg">Salvar</button>
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
  const { currentUser, setCurrentUser, teams, rounds, users, predictions, establishments, settings, addRound, updateRound, deleteRound, addTeam, updateTeam, deleteTeam, updateUser, deleteUser, resetTeamsToSerieA2025, updatePrediction, updateSettings, addEstablishment, updateEstablishment, deleteEstablishment } = useApp();
  
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
  const [betValue, setBetValue] = useState(settings?.betValue || 15);
  const [expandedAdminRounds, setExpandedAdminRounds] = useState({});

  const toggleAdminRound = (roundId) => {
    setExpandedAdminRounds(prev => ({ ...prev, [roundId]: !prev[roundId] }));
  };

  useEffect(() => {
    console.log('Settings atualizados:', settings);
    if (settings?.whatsappMessage) {
      console.log('Carregando mensagem WhatsApp:', settings.whatsappMessage);
      setWhatsappMessage(settings.whatsappMessage);
    } else if (settings && !settings.whatsappMessage) {
      console.log('Usando mensagem padrão');
      // Se não tem mensagem, usar padrão
      setWhatsappMessage('🏆 *BOLÃO BRASILEIRÃO 2025*\n\n📋 *{RODADA}*\n🎫 *Cartela: {CARTELA}*\n✅ Confirmado!\n\n{PALPITES}\n\n💰 R$ 15,00\n⚠️ *Não pode alterar após pagamento*\n\nBoa sorte! 🍀');
    }
    if (settings?.betValue) {
      console.log('Carregando valor da aposta:', settings.betValue);
      setBetValue(settings.betValue);
    }
  }, [settings]);

  useEffect(() => {
    if (!selectedDashboardRound) {
      const finishedRounds = rounds.filter(r => r.status === 'finished').sort((a, b) => b.number - a.number);
      if (finishedRounds.length > 0) {
        setSelectedDashboardRound(finishedRounds[0].id);
      }
    }
  }, [rounds]);

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

  const getRoundDashboardData = (roundId) => {
    if (!roundId) return null;
    
    const round = rounds.find(r => r.id === roundId);
    if (!round || round.status !== 'finished') return null;

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

    const maxPoints = ranking.length > 0 ? ranking[0].points : 0;
    const winners = ranking.filter(r => r.points === maxPoints);
    const prizePerWinner = winners.length > 0 ? prizePool / winners.length : 0;

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
    if (!round || round.status !== 'finished') return 0;
    
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

  const handleSaveWhatsAppMessage = async () => {
    try {
      const dataToSave = {
        whatsappMessage: whatsappMessage,
        betValue: parseFloat(betValue)
      };
      
      console.log('Salvando configurações:', dataToSave);
      
      // Buscar o documento de settings
      const settingsSnapshot = await getDocs(collection(db, 'settings'));
      
      if (settingsSnapshot.empty) {
        // Se não existe, criar novo
        console.log('Criando novo documento de settings');
        await addDoc(collection(db, 'settings'), {
          ...dataToSave,
          createdAt: serverTimestamp()
        });
      } else {
        // Se existe, atualizar
        const settingsId = settingsSnapshot.docs[0].id;
        console.log('Atualizando settings com ID:', settingsId);
        await updateDoc(doc(db, 'settings', settingsId), dataToSave);
      }
      
      console.log('✅ Configurações salvas com sucesso!');
      alert('✅ Configurações atualizadas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      alert('❌ Erro ao salvar: ' + error.message);
    }
  };

  const generateRoundPDF = async (roundId) => {
    try {
      if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF();
      const round = rounds.find(r => r.id === roundId);
      if (!round) return;

      const allParticipants = getRoundParticipants(roundId);
      const paidParticipants = allParticipants.filter(p => p.paid);
      
      if (paidParticipants.length === 0) {
        alert('⚠️ Nenhum participante com pagamento confirmado nesta rodada!');
        return;
      }
      
      // Título
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text('BOLÃO BRASILEIRÃO 2025', 105, 20, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.text(round.name, 105, 30, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 38, { align: 'center' });
      pdf.text(`Total de cartelas confirmadas (pagas): ${paidParticipants.length}`, 105, 44, { align: 'center' });
      
      let yPos = 55;
      
      // Agrupar cartelas por usuário
      const userCartelas = {};
      paidParticipants.forEach(participant => {
        const userId = participant.userId;
        if (!userCartelas[userId]) {
          userCartelas[userId] = [];
        }
        userCartelas[userId].push(participant);
      });
      
      let participantIndex = 0;
      
      // Para cada usuário
      Object.entries(userCartelas).forEach(([userId, cartelas]) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        
        // Para cada cartela do usuário
        cartelas.forEach((participant) => {
          participantIndex++;
          
          if (yPos > 240) {
            pdf.addPage();
            yPos = 20;
          }

          const establishment = establishments.find(e => e.id === participant.establishmentId);
          
          // Cabeçalho do participante
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text(`${participantIndex}. ${user.name}`, 20, yPos);
          
          pdf.setFontSize(9);
          pdf.setFont(undefined, 'normal');
          pdf.text(`WhatsApp: ${user.whatsapp}`, 20, yPos + 5);
          pdf.text(`Cartela: ${participant.cartelaCode}`, 20, yPos + 10);
          if (establishment) {
            pdf.text(`Estabelecimento: ${establishment.name}`, 20, yPos + 15);
            yPos += 5;
          }
          
          // Status PAGO
          pdf.setTextColor(0, 128, 0);
          pdf.setFont(undefined, 'bold');
          pdf.text('PAGO', 150, yPos + 5);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont(undefined, 'normal');
          
          yPos += 22;

          // Palpites desta cartela
          round.matches?.forEach((match, mIndex) => {
            if (yPos > 270) {
              pdf.addPage();
              yPos = 20;
            }
            
            const homeTeam = teams.find(t => t.id === match.homeTeamId);
            const awayTeam = teams.find(t => t.id === match.awayTeamId);
            const pred = predictions.find(p => 
              p.userId === user.id && 
              p.roundId === roundId && 
              p.matchId === match.id &&
              p.cartelaCode === participant.cartelaCode
            );

            if (pred) {
              pdf.setFontSize(9);
              const matchText = `  ${mIndex + 1}) ${homeTeam?.name} ${pred.homeScore} x ${pred.awayScore} ${awayTeam?.name}`;
              pdf.text(matchText, 25, yPos);
              yPos += 5;
            }
          });

          yPos += 3;
          pdf.setDrawColor(200, 200, 200);
          pdf.line(20, yPos, 190, yPos);
          yPos += 8;
        });
      });

      // Rodapé
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
      }

      // Salvar PDF
      pdf.save(`Bolao_${round.name.replace(/\s+/g, '_')}_CONFIRMADOS_${new Date().getTime()}.pdf`);
      alert(`✅ PDF gerado com sucesso!\n\n📄 ${paidParticipants.length} cartelas confirmadas\n👥 ${Object.keys(userCartelas).length} participantes únicos`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('❌ Erro ao gerar PDF: ' + error.message);
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

  const openRounds = rounds.filter(r => r.status === 'open');
  const closedRounds = rounds.filter(r => r.status === 'closed');
  const finishedRounds = rounds.filter(r => r.status === 'finished');
  const upcomingRounds = rounds.filter(r => r.status === 'upcoming');

  const renderRoundCard = (round) => {
    const badge = getStatusBadge(round.status);
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
                <button onClick={() => generateRoundPDF(round.id)} className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200" title="Gerar PDF">
                  <Download size={18} />
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
                      <img src={homeTeam?.logo} alt="" className="w-8 h-8 object-contain" />
                      <span className="font-medium">{homeTeam?.name}</span>
                      <span className="text-gray-400 font-bold">VS</span>
                      <img src={awayTeam?.logo} alt="" className="w-8 h-8 object-contain" />
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Trophy size={32} />
            <div>
              <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              <p className="text-green-100 text-sm">Bolão Brasileirão 2025</p>
            </div>
          </div>
          <button onClick={() => { setCurrentUser(null); setView('login'); }} className="flex items-center gap-2 bg-green-700 px-4 py-2 rounded-lg">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6 overflow-x-auto">
            {['dashboard', 'rounds', 'teams', 'establishments', 'participants', 'financial', 'settings'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-2 border-b-2 font-medium whitespace-nowrap ${activeTab === tab ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}>
                {tab === 'dashboard' && <><Trophy className="inline mr-2" size={18} />Dashboard</>}
                {tab === 'rounds' && <><Calendar className="inline mr-2" size={18} />Rodadas</>}
                {tab === 'teams' && <><Users className="inline mr-2" size={18} />Times</>}
                {tab === 'establishments' && <><Store className="inline mr-2" size={18} />Estabelecimentos</>}
                {tab === 'participants' && <><TrendingUp className="inline mr-2" size={18} />Participantes</>}
                {tab === 'financial' && <><DollarSign className="inline mr-2" size={18} />Financeiro</>}
                {tab === 'settings' && <><Edit2 className="inline mr-2" size={18} />Configurações</>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">Dashboard por Rodada</h2>
                <p className="text-gray-600 mt-1">Premiação: 85% • Admin: 10% • Estabelecimentos: 5% por palpite vinculado</p>
              </div>
              <div className="w-64">
                <label className="block text-sm font-medium mb-2">Selecione a Rodada</label>
                <select
                  value={selectedDashboardRound || ''}
                  onChange={(e) => setSelectedDashboardRound(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg bg-white"
                >
                  {rounds.filter(r => r.status === 'finished').length === 0 && (
                    <option value="">Nenhuma rodada finalizada</option>
                  )}
                  {rounds.filter(r => r.status === 'finished').sort((a, b) => b.number - a.number).map(round => (
                    <option key={round.id} value={round.id}>
                      {round.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {(() => {
              const dashboardData = getRoundDashboardData(selectedDashboardRound);

              if (!dashboardData) {
                return (
                  <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed">
                    <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-xl font-semibold mb-2">Nenhuma rodada finalizada</h3>
                    <p className="text-gray-500">O dashboard será exibido após a finalização da primeira rodada</p>
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
                      <p className="text-xs text-green-600 mt-1">Para {dashboardData.winners.length} vencedor(es)</p>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                  {/* Vencedores / Premiação */}
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

                  {/* Ranking Completo da Rodada */}
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b">
                      <h3 className="text-lg font-bold">Ranking Completo</h3>
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
                              <tr key={`${item.user.id}-${item.cartelaCode}`} className={isWinner ? 'bg-yellow-50' : ''}>
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
            <div className="flex justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Estabelecimentos/Indicadores</h2>
                <p className="text-gray-600 mt-1">Gerenciar locais que indicam participantes • Comissão: 5%</p>
              </div>
              <button onClick={() => { setEditingEstablishment(null); setShowEstablishmentForm(true); }} className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg">
                <Plus size={20} /> Novo Estabelecimento
              </button>
            </div>
            {establishments.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed">
                <Store className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold mb-2">Nenhum estabelecimento cadastrado</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {establishments.map((est) => (
                  <div key={est.id} className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-100 p-3 rounded-lg">
                          <Store className="text-orange-600" size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{est.name}</h3>
                          <p className="text-sm text-gray-600">{est.contact || 'Sem contato'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingEstablishment(est); setShowEstablishmentForm(true); }} className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => confirm('Excluir?') && deleteEstablishment(est.id)} className="p-2 bg-red-100 text-red-700 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Telefone:</span>
                        <span className="font-medium">{est.phone || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Comissão:</span>
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
            
            <div className="space-y-6 max-w-3xl">
              {/* Valor da Aposta */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <DollarSign size={24} className="text-green-600" />
                  Valor da Aposta
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Defina o valor que será cobrado por participação em cada rodada
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">Valor por Cartela (R$)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.50"
                      value={betValue}
                      onChange={(e) => setBetValue(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg text-lg font-bold"
                      placeholder="15.00"
                    />
                  </div>
                  <div className="pt-8">
                    <button
                      onClick={handleSaveWhatsAppMessage}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Distribuição:</strong> 85% Premiação • 10% Admin • 5% Estabelecimento (por palpite vinculado)
                  </p>
                </div>
              </div>

              {/* Mensagem WhatsApp */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-bold mb-4">Mensagem do WhatsApp</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Personalize a mensagem enviada quando um usuário confirma seus palpites. Use as variáveis:
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-mono"><strong>{'{RODADA}'}</strong> - Nome da rodada</p>
                  <p className="text-sm font-mono"><strong>{'{CARTELA}'}</strong> - Código da cartela</p>
                  <p className="text-sm font-mono"><strong>{'{PALPITES}'}</strong> - Lista de palpites do usuário</p>
                </div>

                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg font-mono text-sm"
                  rows="10"
                  placeholder="🏆 *BOLÃO BRASILEIRÃO 2025*&#10;&#10;📋 *{RODADA}*&#10;🎫 *Cartela: {CARTELA}*&#10;✅ Confirmado!&#10;&#10;{PALPITES}&#10;&#10;💰 R$ 15,00&#10;⚠️ *Não pode alterar após pagamento*&#10;&#10;Boa sorte! 🍀"
                />

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => {
                      setWhatsappMessage(settings?.whatsappMessage || '🏆 *BOLÃO BRASILEIRÃO 2025*\n\n📋 *{RODADA}*\n🎫 *Cartela: {CARTELA}*\n✅ Confirmado!\n\n{PALPITES}\n\n💰 R$ 15,00\n⚠️ *Não pode alterar após pagamento*\n\nBoa sorte! 🍀');
                      setBetValue(settings?.betValue || 15);
                    }}
                    className="px-6 py-2 border rounded-lg"
                  >
                    Restaurar Padrão
                  </button>
                  <button
                    onClick={handleSaveWhatsAppMessage}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg"
                  >
                    Salvar Configurações
                  </button>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Prévia:</h4>
                  <div className="bg-white p-4 rounded border text-sm whitespace-pre-wrap font-mono">
                    {whatsappMessage
                      .replace('{RODADA}', 'Rodada 1')
                      .replace('{CARTELA}', 'CART-ABC123')
                      .replace('{PALPITES}', '1. Palmeiras 2 x 1 Flamengo\n2. Corinthians 1 x 1 Santos')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'rounds' && (
          <div>
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-bold">Gerenciar Rodadas</h2>
              <button onClick={() => { setEditingRound(null); setShowRoundForm(true); }} className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg">
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
            <div className="flex justify-between mb-6">
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
              <div className="flex gap-3">
                <button onClick={handleResetTeams} className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700">
                  <Trophy size={20} /> Resetar para Série A 2025
                </button>
                <button onClick={() => { setEditingTeam(null); setShowTeamForm(true); }} className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg">
                  <Plus size={20} /> Novo Time
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <div key={team.id} className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <img src={team.logo} alt={team.name} className="w-16 h-16 object-contain" />
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingTeam(team); setShowTeamForm(true); }} className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => confirm('Excluir?') && deleteTeam(team.id)} className="p-2 bg-red-100 text-red-700 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold">{team.name}</h3>
                </div>
              ))}
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
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-bold">{user.name}</h3>
                        <p className="text-gray-600 text-sm">{user.whatsapp}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">0 pts</div>
                          <p className="text-gray-600 text-sm">{userPreds.length} palpites</p>
                        </div>
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
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">Controle Financeiro</h2>
                <p className="text-gray-600 mt-1">Gerencie os pagamentos por rodada (R$ 15,00 cada)</p>
              </div>
              <div className="flex gap-3">
                <div className="w-64">
                  <label className="block text-sm font-medium mb-2">Filtrar por Estabelecimento</label>
                  <select
                    value={establishmentFilter}
                    onChange={(e) => setEstablishmentFilter(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="all">Todos</option>
                    <option value="none">Sem estabelecimento</option>
                    {establishments.map(est => (
                      <option key={est.id} value={est.id}>{est.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-64">
                  <label className="block text-sm font-medium mb-2">Selecione a Rodada</label>
                  <select
                    value={selectedFinanceRound || ''}
                    onChange={(e) => setSelectedFinanceRound(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg bg-white"
                  >
                    <option value="">Todas as rodadas</option>
                    {rounds.filter(r => r.status !== 'upcoming').sort((a, b) => b.number - a.number).map(round => (
                      <option key={round.id} value={round.id}>
                        {round.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-600 text-sm font-medium">Total Esperado</p>
                            <p className="text-2xl font-bold text-blue-900">R$ {summary.totalExpected.toFixed(2)}</p>
                            <p className="text-xs text-blue-600 mt-1">{summary.totalParticipations} cartelas</p>
                          </div>
                          <Users className="text-blue-400" size={32} />
                        </div>
                      </div>

                      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-600 text-sm font-medium">Recebido</p>
                            <p className="text-2xl font-bold text-green-900">R$ {summary.totalReceived.toFixed(2)}</p>
                            <p className="text-xs text-green-600 mt-1">{summary.paidCount} pagamentos</p>
                          </div>
                          <CheckCircle className="text-green-400" size={32} />
                        </div>
                      </div>

                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-yellow-600 text-sm font-medium">Premiação (85%)</p>
                            <p className="text-2xl font-bold text-yellow-900">R$ {summary.prizePool.toFixed(2)}</p>
                          </div>
                          <Trophy className="text-yellow-400" size={32} />
                        </div>
                      </div>

                      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-600 text-sm font-medium">Admin (10%)</p>
                            <p className="text-2xl font-bold text-purple-900">R$ {summary.adminFee.toFixed(2)}</p>
                          </div>
                          <Award className="text-purple-400" size={32} />
                        </div>
                      </div>

                      <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-600 text-sm font-medium">Estabelec. (5%)</p>
                            <p className="text-2xl font-bold text-orange-900">R$ {summary.establishmentFee.toFixed(2)}</p>
                          </div>
                          <Store className="text-orange-400" size={32} />
                        </div>
                      </div>
                    </div>

                    {/* Filtros */}
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-700">Filtrar:</span>
                          <button
                            onClick={() => setPaymentFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                              paymentFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Todos ({summary.totalParticipations})
                          </button>
                          <button
                            onClick={() => setPaymentFilter('paid')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                              paymentFilter === 'paid' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            Pagos ({summary.paidCount})
                          </button>
                          <button
                            onClick={() => setPaymentFilter('pending')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                              paymentFilter === 'pending' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            Pendentes ({summary.pendingCount})
                          </button>
                        </div>
                        
                        {establishmentFilter !== 'all' && establishmentFilter !== 'none' && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
                            <p className="text-sm text-orange-800">
                              <Store size={14} className="inline mr-1" />
                              <strong>Comissão deste estabelecimento:</strong> R$ {summary.establishmentFee.toFixed(2)}
                            </p>
                          </div>
                        )}
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
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Participante</th>
                              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Cartela</th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Estabelecimento</th>
                              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Valor</th>
                              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {filteredParticipants.map((participant) => {
                              const user = users.find(u => u.id === participant.userId);
                              const establishment = establishments.find(e => e.id === participant.establishmentId);
                              if (!user) return null;
                              
                              return (
                                <tr key={`${participant.userId}-${participant.cartelaCode}`} className={participant.paid ? 'bg-green-50' : ''}>
                                  <td className="px-6 py-4">
                                    <div>
                                      <span className="font-medium">{user.name}</span>
                                      <p className="text-xs text-gray-500">{user.whatsapp}</p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="font-mono text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                      {participant.cartelaCode}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    {establishment ? (
                                      <div>
                                        <p className="font-medium text-sm text-orange-600">{establishment.name}</p>
                                        <p className="text-xs text-gray-500">{establishment.contact}</p>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">Nenhum</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-lg font-bold text-gray-900">R$ {summary.betValue.toFixed(2)}</span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
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
                                  <td className="px-6 py-4 text-center">
                                    <button
                                      onClick={() => togglePaymentStatus(participant.userId, selectedFinanceRound, participant.cartelaCode)}
                                      className={`px-4 py-2 rounded-lg font-medium transition ${
                                        participant.paid
                                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                          : 'bg-green-600 text-white hover:bg-green-700'
                                      }`}
                                    >
                                      {participant.paid ? 'Marcar Pendente' : 'Marcar Pago'}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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
      </div>

      {showRoundForm && <RoundForm round={editingRound} teams={teams} rounds={rounds} onSave={saveRound} onCancel={() => { setEditingRound(null); setShowRoundForm(false); }} />}
      {showTeamForm && <TeamForm team={editingTeam} onSave={saveTeam} onCancel={() => { setEditingTeam(null); setShowTeamForm(false); }} />}
      {showEstablishmentForm && <EstablishmentForm establishment={editingEstablishment} onSave={saveEstablishment} onCancel={() => { setEditingEstablishment(null); setShowEstablishmentForm(false); }} />}
      {editingPassword && <PasswordModal user={editingPassword} onSave={savePassword} onCancel={() => setEditingPassword(null)} />}
    </div>
  );
};

const UserPanel = ({ setView }) => {
  const { currentUser, setCurrentUser, teams, rounds, predictions, users, establishments, addPrediction, settings } = useApp();
  const [activeTab, setActiveTab] = useState('predictions');
  const [selectedRound, setSelectedRound] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPredictions, setPendingPredictions] = useState(null);
  const [expandedRounds, setExpandedRounds] = useState({});
  const [selectedRankingRound, setSelectedRankingRound] = useState(null);
  const [editingPredictions, setEditingPredictions] = useState(null);
  const [selectedEstablishment, setSelectedEstablishment] = useState(null);
  const [showEstablishmentModal, setShowEstablishmentModal] = useState(false);

  const toggleRound = (roundId) => {
    setExpandedRounds(prev => ({ ...prev, [roundId]: !prev[roundId] }));
  };

  const openRounds = rounds.filter(r => r.status === 'open');
  const closedRounds = rounds.filter(r => r.status === 'closed').sort((a, b) => b.number - a.number);
  const finishedRounds = rounds.filter(r => r.status === 'finished').sort((a, b) => b.number - a.number);
  const upcomingRounds = rounds.filter(r => r.status === 'upcoming').sort((a, b) => a.number - b.number);

  useEffect(() => {
    if (!selectedRankingRound && finishedRounds.length > 0) {
      setSelectedRankingRound(finishedRounds[0].id);
    }
  }, [finishedRounds]);

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

  const calculateRoundPoints = (roundId) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round || round.status !== 'finished') return null;
    
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

  const EstablishmentModal = ({ onSelect, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Store size={24} className="text-orange-600" />
            Selecione o Estabelecimento
          </h3>
          <p className="text-gray-600 text-sm mt-2">Escolha onde você está participando</p>
        </div>
        <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
          <button
            onClick={() => onSelect(null)}
            className="w-full p-4 border-2 rounded-lg hover:bg-gray-50 text-left transition"
          >
            <p className="font-medium">Nenhum estabelecimento</p>
            <p className="text-sm text-gray-500">Participação direta</p>
          </button>
          {establishments.map(est => (
            <button
              key={est.id}
              onClick={() => onSelect(est.id)}
              className="w-full p-4 border-2 rounded-lg hover:bg-orange-50 hover:border-orange-300 text-left transition"
            >
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Store size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="font-bold">{est.name}</p>
                  {est.contact && <p className="text-sm text-gray-600">{est.contact}</p>}
                  {est.phone && <p className="text-xs text-gray-500">{est.phone}</p>}
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="p-6 border-t">
          <button onClick={onCancel} className="w-full px-6 py-2 border rounded-lg">Cancelar</button>
        </div>
      </div>
    </div>
  );

  const RoundAccordion = ({ round }) => {
    const isExpanded = expandedRounds[round.id];
    const userCartelas = getUserCartelasForRound(round.id);
    const hasPredictions = userCartelas.length > 0;
    const points = calculateRoundPoints(round.id);
    
    const getStatusInfo = () => {
      switch (round.status) {
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
                {hasPredictions && (
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    {userCartelas.length} cartela(s)
                  </span>
                )}
                {round.status === 'finished' && totalPoints > 0 && (
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {totalPoints} pontos total
                  </span>
                )}
                {round.status === 'open' && !hasPredictions && (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                    Sem palpites
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
            {round.status === 'upcoming' && (
              <div className="text-center py-8">
                <Calendar className="mx-auto text-gray-400 mb-3" size={48} />
                <p className="text-gray-600 font-medium">Esta rodada ainda não foi aberta para palpites</p>
              </div>
            )}

            {round.status === 'open' && !hasPredictions && (
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
                            {round.status === 'finished' && (
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
                          if (round.status === 'finished' && match.finished && pred && cartela.paid) {
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
                                    <img src={homeTeam?.logo} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
                                    <span className="font-medium text-xs truncate">{homeTeam?.name}</span>
                                  </div>
                                  <span className="text-gray-400 font-bold text-xs px-1 flex-shrink-0">VS</span>
                                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                    <span className="font-medium text-xs truncate">{awayTeam?.name}</span>
                                    <img src={awayTeam?.logo} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
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
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const PredictionForm = ({ round, initialPredictions = null }) => {
    const [localPreds, setLocalPreds] = useState({});
    const [cartelaCode] = useState(generateCartelaCode());
    
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
      const allPreds = round.matches.map(match => ({
        match,
        homeScore: localPreds[match.id]?.home !== undefined ? parseInt(localPreds[match.id].home) : null,
        awayScore: localPreds[match.id]?.away !== undefined ? parseInt(localPreds[match.id].away) : null
      }));

      if (allPreds.filter(p => p.homeScore === null || p.awayScore === null).length > 0) {
        alert('Preencha todos os palpites!');
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
            {round.matches?.map((match) => {
              const homeTeam = teams.find(t => t.id === match.homeTeamId);
              const awayTeam = teams.find(t => t.id === match.awayTeamId);
              return (
                <div key={match.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <img src={homeTeam?.logo} alt="" className="w-8 h-8 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{homeTeam?.name}</span>
                      </div>
                      <span className="text-gray-400 font-bold px-2">VS</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="font-medium text-sm truncate">{awayTeam?.name}</span>
                        <img src={awayTeam?.logo} alt="" className="w-8 h-8 flex-shrink-0" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-3">
                      <input 
                        type="number" 
                        min="0" 
                        max="20" 
                        value={localPreds[match.id]?.home || ''} 
                        onChange={(e) => setLocalPreds({ ...localPreds, [match.id]: { ...localPreds[match.id], home: e.target.value } })} 
                        className="w-16 px-2 py-2 border rounded text-center font-bold" 
                        placeholder="0" 
                      />
                      <span className="font-bold text-gray-400">X</span>
                      <input 
                        type="number" 
                        min="0" 
                        max="20" 
                        value={localPreds[match.id]?.away || ''} 
                        onChange={(e) => setLocalPreds({ ...localPreds, [match.id]: { ...localPreds[match.id], away: e.target.value } })} 
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
            <button onClick={handleSubmit} className="px-6 py-2 bg-green-600 text-white rounded-lg">Confirmar</button>
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
                {predictionsData.map((pred, i) => {
                  const homeTeam = teams.find(t => t.id === pred.match.homeTeamId);
                  const awayTeam = teams.find(t => t.id === pred.match.awayTeamId);
                  return (
                    <div key={i} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                      <div className="flex items-center gap-2 text-sm">
                        <img src={homeTeam?.logo} alt="" className="w-6 h-6" />
                        <span className="font-medium">{homeTeam?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-green-600">
                        <span className="bg-green-100 px-3 py-1 rounded">{pred.homeScore}</span>
                        <span className="text-gray-400">X</span>
                        <span className="bg-green-100 px-3 py-1 rounded">{pred.awayScore}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{awayTeam?.name}</span>
                        <img src={awayTeam?.logo} alt="" className="w-6 h-6" />
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

  const confirmAndSave = async () => {
    if (!pendingPredictions) return;
    try {
      const { round, predictions: preds, cartelaCode, establishmentId } = pendingPredictions;
      
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
    if (!round || round.status !== 'finished') return 0;
    
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
    
    return rankingEntries.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.predictions - a.predictions;
    });
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
  
  const ranking = selectedRankingRound ? getRankingForRound(selectedRankingRound) : [];
  const roundPrize = selectedRankingRound ? getRoundPrize(selectedRankingRound) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Olá, {currentUser.name}! 👋</h1>
              <p className="text-green-100 mt-1">Bolão Brasileirão 2025</p>
            </div>
            <button onClick={() => { setCurrentUser(null); setView('login'); }} className="flex items-center gap-2 bg-green-700 px-4 py-2 rounded-lg">
              <LogOut size={18} /> Sair
            </button>
          </div>
          
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            {['predictions', 'ranking', 'history'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-2 border-b-2 font-medium ${activeTab === tab ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}>
                {tab === 'predictions' && <><Target className="inline mr-2" size={18} />Palpites</>}
                {tab === 'ranking' && <><TrendingUp className="inline mr-2" size={18} />Ranking</>}
                {tab === 'history' && <><Calendar className="inline mr-2" size={18} />Minhas Rodadas</>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'predictions' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Rodadas Disponíveis</h2>
            <p className="text-gray-600 mb-6">Escolha uma rodada e faça seus palpites • R$ {settings?.betValue?.toFixed(2) || '15,00'} por participação</p>
            {openRounds.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold mb-2">Nenhuma rodada disponível</h3>
              </div>
            ) : (
              <div className="grid gap-4">
                {openRounds.map((round) => {
                  const userCartelas = getUserCartelasForRound(round.id);
                  
                  return (
                    <div key={round.id} className="bg-white rounded-xl shadow-sm border p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold">{round.name}</h3>
                          <p className="text-gray-600 mt-1">{round.matches?.length || 0} jogos • R$ {settings?.betValue?.toFixed(2) || '15,00'} por participação</p>
                        </div>
                        <button 
                          onClick={() => handleStartPrediction(round)} 
                          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
                        >
                          <Plus size={20} />
                          Nova Participação
                        </button>
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
                                      <p className="font-mono text-sm font-bold text-blue-700">{cartela.code}</p>
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
                  {finishedRounds.length === 0 && (
                    <option value="">Nenhuma rodada finalizada</option>
                  )}
                  {finishedRounds.map(round => (
                    <option key={round.id} value={round.id}>
                      {round.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!selectedRankingRound || finishedRounds.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed">
                <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold mb-2">Nenhuma rodada finalizada</h3>
                <p className="text-gray-500">O ranking será exibido após a finalização da primeira rodada</p>
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
                          <tr key={`${item.user.id}-${item.cartelaCode}`} className={`${item.user.id === currentUser.id ? 'bg-green-50' : ''} ${isWinner ? 'bg-yellow-50' : ''}`}>
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

        {activeTab === 'history' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Todas as Rodadas</h2>
            <p className="text-gray-600 mb-6">Acompanhe seus palpites, resultados e pontuação</p>
            
            {rounds.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold mb-2">Nenhuma rodada criada</h3>
                <p className="text-gray-500">Aguarde o administrador criar as rodadas</p>
              </div>
            ) : (
              <div className="space-y-8">
                {openRounds.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        {openRounds.length}
                      </span>
                      Rodadas Abertas para Palpites
                    </h3>
                    <div className="space-y-3">
                      {openRounds.map(round => <RoundAccordion key={round.id} round={round} />)}
                    </div>
                  </div>
                )}

                {closedRounds.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">
                        {closedRounds.length}
                      </span>
                      Rodadas Aguardando Resultados
                    </h3>
                    <div className="space-y-3">
                      {closedRounds.map(round => <RoundAccordion key={round.id} round={round} />)}
                    </div>
                  </div>
                )}

                {finishedRounds.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                        {finishedRounds.length}
                      </span>
                      Rodadas Finalizadas
                    </h3>
                    <div className="space-y-3">
                      {finishedRounds.map(round => <RoundAccordion key={round.id} round={round} />)}
                    </div>
                  </div>
                )}

                {upcomingRounds.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {upcomingRounds.length}
                      </span>
                      Próximas Rodadas
                    </h3>
                    <div className="space-y-3">
                      {upcomingRounds.map(round => <RoundAccordion key={round.id} round={round} />)}
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
    </div>
  );
};

function App() {
  const { currentUser, loading } = useApp();
  const [view, setView] = useState('login');

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
