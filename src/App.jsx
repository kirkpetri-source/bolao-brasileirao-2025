import React, { useState, useEffect, createContext, useContext } from 'react';
import { Trophy, Users, Calendar, TrendingUp, LogOut, Eye, EyeOff, Plus, Edit2, Trash2, Upload, ExternalLink, X, UserPlus, Target, Award, ChevronDown, ChevronUp, Check, Key, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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

    // Criar configurações padrão
    if (settingsSnapshot.empty) {
      await addDoc(collection(db, 'settings'), {
        whatsappMessage: '🏆 *BOLÃO BRASILEIRÃO 2025*\n\n📋 *{RODADA}*\n✅ Confirmado!\n\n{PALPITES}\n\n💰 R$ 15,00\n⚠️ *Não pode alterar após pagamento*\n\nBoa sorte! 🍀',
        createdAt: serverTimestamp()
      });
    }

    console.log('🎉 Done!');
  } catch (error) {
    console.error('Error:', error);
  }
};

const sendWhatsAppMessage = (userPhone, roundName, predictions, teams, messageTemplate) => {
  let palpitesText = '';
  predictions.forEach((pred, i) => {
    const homeTeam = teams.find(t => t.id === pred.match.homeTeamId);
    const awayTeam = teams.find(t => t.id === pred.match.awayTeamId);
    palpitesText += `${i + 1}. ${homeTeam?.name} ${pred.homeScore} x ${pred.awayScore} ${awayTeam?.name}\n`;
  });
  
  const message = (messageTemplate || '🏆 *BOLÃO BRASILEIRÃO 2025*\n\n📋 *{RODADA}*\n✅ Confirmado!\n\n{PALPITES}\n\n💰 R$ 15,00\n⚠️ *Não pode alterar após pagamento*\n\nBoa sorte! 🍀')
    .replace('{RODADA}', roundName)
    .replace('{PALPITES}', palpitesText.trim());
  
  window.open(`https://wa.me/${userPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
};

const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await initializeDatabase();
        const [u, t, r, p, s] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'teams')),
          getDocs(collection(db, 'rounds')),
          getDocs(collection(db, 'predictions')),
          getDocs(collection(db, 'settings'))
        ]);
        setUsers(u.docs.map(d => ({ id: d.id, ...d.data() })));
        setTeams(t.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)));
        setRounds(r.docs.map(d => ({ id: d.id, ...d.data() })));
        setPredictions(p.docs.map(d => ({ id: d.id, ...d.data() })));
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
      onSnapshot(collection(db, 'settings'), s => setSettings(s.docs.length > 0 ? { id: s.docs[0].id, ...s.docs[0].data() } : null))
    ];
    return () => uns.forEach(u => u());
  }, []);

  const value = {
    currentUser, setCurrentUser, users, teams, rounds, predictions, settings, loading,
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
    addPrediction: async (d) => { const r = await addDoc(collection(db, 'predictions'), { ...d, paid: false, createdAt: serverTimestamp() }); return { id: r.id, ...d }; },
    updatePrediction: async (id, d) => await updateDoc(doc(db, 'predictions', id), d),
    updateSettings: async (d) => {
      if (settings?.id) {
        await updateDoc(doc(db, 'settings', settings.id), d);
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
  const { currentUser, setCurrentUser, teams, rounds, users, predictions, settings, addRound, updateRound, deleteRound, addTeam, updateTeam, deleteTeam, updateUser, deleteUser, resetTeamsToSerieA2025, updatePrediction, updateSettings } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingRound, setEditingRound] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);
  const [selectedFinanceRound, setSelectedFinanceRound] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [whatsappMessage, setWhatsappMessage] = useState(settings?.whatsappMessage || '');

  useEffect(() => {
    if (settings?.whatsappMessage) {
      setWhatsappMessage(settings.whatsappMessage);
    }
  }, [settings]);

  const handleDeleteUser = async (user) => {
    if (!confirm(`⚠️ ATENÇÃO!\n\nDeseja realmente excluir o usuário "${user.name}"?\n\nIsso também excluirá todos os palpites deste usuário!\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      // Excluir todos os palpites do usuário primeiro
      const userPredictions = predictions.filter(p => p.userId === user.id);
      for (const pred of userPredictions) {
        await deleteDoc(doc(db, 'predictions', pred.id));
      }
      // Depois excluir o usuário
      await deleteUser(user.id);
      alert('✅ Usuário excluído com sucesso!');
    } catch (error) {
      alert('❌ Erro ao excluir usuário: ' + error.message);
    }
  };

  const togglePaymentStatus = async (userId, roundId) => {
    try {
      // Encontrar a primeira predição do usuário nesta rodada
      const userRoundPrediction = predictions.find(p => p.userId === userId && p.roundId === roundId);
      
      if (userRoundPrediction) {
        const newPaidStatus = !userRoundPrediction.paid;
        
        // Atualizar TODAS as predições do usuário nesta rodada
        const allUserRoundPredictions = predictions.filter(p => p.userId === userId && p.roundId === roundId);
        for (const pred of allUserRoundPredictions) {
          await updatePrediction(pred.id, { paid: newPaidStatus });
        }
      }
    } catch (error) {
      alert('Erro ao atualizar pagamento: ' + error.message);
    }
  };

  const getPaymentStatus = (userId, roundId) => {
    const userRoundPrediction = predictions.find(p => p.userId === userId && p.roundId === roundId);
    return userRoundPrediction?.paid || false;
  };

  const getRoundParticipants = (roundId) => {
    const participantIds = [...new Set(predictions.filter(p => p.roundId === roundId).map(p => p.userId))];
    return users.filter(u => !u.isAdmin && participantIds.includes(u.id));
  };

  const getRoundFinancialSummary = (roundId) => {
    const participants = getRoundParticipants(roundId);
    const totalParticipants = participants.length;
    const paidCount = participants.filter(u => getPaymentStatus(u.id, roundId)).length;
    const pendingCount = totalParticipants - paidCount;
    const totalExpected = totalParticipants * 15;
    const totalReceived = paidCount * 15;
    const totalPending = pendingCount * 15;

    return {
      totalParticipants,
      paidCount,
      pendingCount,
      totalExpected,
      totalReceived,
      totalPending
    };
  };

  const getTotalFinancialSummary = () => {
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

    const prizePool = totalReceived * 0.9; // 90% para premiação
    const adminFee = totalReceived * 0.1; // 10% taxa administrativa

    return {
      totalExpected,
      totalReceived,
      totalPending,
      prizePool,
      adminFee
    };
  };

  const getWinners = () => {
    const finishedRounds = rounds.filter(r => r.status === 'finished');
    if (finishedRounds.length === 0) return [];

    const userScores = users.filter(u => !u.isAdmin).map(user => {
      let totalPoints = 0;
      finishedRounds.forEach(round => {
        const isPaid = getPaymentStatus(user.id, round.id);
        if (!isPaid) return; // Só conta se pagou

        round.matches?.forEach(match => {
          const pred = predictions.find(p => 
            p.userId === user.id && 
            p.roundId === round.id && 
            p.matchId === match.id
          );
          
          if (pred && match.finished && match.homeScore !== null && match.awayScore !== null) {
            if (pred.homeScore === match.homeScore && pred.awayScore === match.awayScore) {
              totalPoints += 3;
            } else {
              const predResult = pred.homeScore > pred.awayScore ? 'home' : pred.homeScore < pred.awayScore ? 'away' : 'draw';
              const matchResult = match.homeScore > match.awayScore ? 'home' : match.homeScore < match.awayScore ? 'away' : 'draw';
              if (predResult === matchResult) {
                totalPoints += 1;
              }
            }
          }
        });
      });
      
      return { user, points: totalPoints };
    });

    const maxPoints = Math.max(...userScores.map(s => s.points));
    if (maxPoints === 0) return [];

    return userScores.filter(s => s.points === maxPoints);
  };

  const handleSaveWhatsAppMessage = async () => {
    try {
      await updateSettings({ whatsappMessage });
      alert('✅ Mensagem atualizada com sucesso!');
    } catch (error) {
      alert('❌ Erro ao salvar: ' + error.message);
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
    if (round) await updateRound(id, { ...round, status: newStatus });
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
    return (
      <div key={round.id} className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold">{round.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.icon} {badge.text}</span>
            </div>
            <p className="text-gray-600 mt-1">{round.matches?.length || 0} jogos</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {round.status === 'upcoming' && <button onClick={() => changeStatus(round.id, 'open')} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm">Abrir</button>}
            {round.status === 'open' && <button onClick={() => changeStatus(round.id, 'closed')} className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm">Fechar</button>}
            {round.status === 'closed' && <button onClick={() => changeStatus(round.id, 'finished')} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm">Finalizar</button>}
            <button onClick={() => { setEditingRound(round); setShowRoundForm(true); }} className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Edit2 size={18} /></button>
            <button onClick={() => confirm('Excluir?') && deleteRound(round.id)} className="p-2 bg-red-100 text-red-700 rounded-lg"><Trash2 size={18} /></button>
          </div>
        </div>
        <div className="space-y-2">
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
            {['dashboard', 'rounds', 'teams', 'participants', 'financial', 'settings'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-2 border-b-2 font-medium whitespace-nowrap ${activeTab === tab ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}>
                {tab === 'dashboard' && <><Trophy className="inline mr-2" size={18} />Dashboard</>}
                {tab === 'rounds' && <><Calendar className="inline mr-2" size={18} />Rodadas</>}
                {tab === 'teams' && <><Users className="inline mr-2" size={18} />Times</>}
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
            <h2 className="text-2xl font-bold mb-6">Dashboard Geral</h2>
            
            {(() => {
              const financialSummary = getTotalFinancialSummary();
              const winners = getWinners();
              const prizePerWinner = winners.length > 0 ? financialSummary.prizePool / winners.length : 0;

              return (
                <div className="space-y-6">
                  {/* Resumo Financeiro Total */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <DollarSign className="text-blue-500" size={32} />
                      </div>
                      <p className="text-blue-600 text-sm font-medium mb-1">Total Arrecadado</p>
                      <p className="text-3xl font-bold text-blue-900">R$ {financialSummary.totalReceived.toFixed(2)}</p>
                    </div>

                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Trophy className="text-green-500" size={32} />
                      </div>
                      <p className="text-green-600 text-sm font-medium mb-1">Premiação (90%)</p>
                      <p className="text-3xl font-bold text-green-900">R$ {financialSummary.prizePool.toFixed(2)}</p>
                    </div>

                    <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Award className="text-purple-500" size={32} />
                      </div>
                      <p className="text-purple-600 text-sm font-medium mb-1">Taxa Admin (10%)</p>
                      <p className="text-3xl font-bold text-purple-900">R$ {financialSummary.adminFee.toFixed(2)}</p>
                    </div>

                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <AlertCircle className="text-red-500" size={32} />
                      </div>
                      <p className="text-red-600 text-sm font-medium mb-1">Pendente</p>
                      <p className="text-3xl font-bold text-red-900">R$ {financialSummary.totalPending.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Vencedores / Premiação */}
                  <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-xl p-8 text-white">
                    <div className="flex items-center gap-3 mb-6">
                      <Trophy size={48} />
                      <div>
                        <h3 className="text-3xl font-bold">Premiação</h3>
                        <p className="text-yellow-100">Classificação Atual</p>
                      </div>
                    </div>

                    {winners.length === 0 ? (
                      <div className="bg-white bg-opacity-20 rounded-xl p-8 text-center">
                        <p className="text-xl font-semibold">Nenhuma rodada finalizada ainda</p>
                        <p className="text-yellow-100 mt-2">A premiação será calculada após as finalizações</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-white bg-opacity-20 rounded-xl p-6">
                          <div className="text-center mb-4">
                            <p className="text-yellow-100 text-sm font-medium">PRÊMIO {winners.length > 1 ? 'DIVIDIDO' : 'TOTAL'}</p>
                            <p className="text-5xl font-bold mt-2">R$ {prizePerWinner.toFixed(2)}</p>
                            <p className="text-yellow-100 text-sm mt-1">por vencedor</p>
                          </div>
                        </div>

                        <div className="bg-white bg-opacity-20 rounded-xl p-6">
                          <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Award size={24} />
                            {winners.length > 1 ? `${winners.length} Vencedores (Empate)` : '🏆 Campeão Atual'}
                          </h4>
                          <div className="space-y-3">
                            {winners.map((winner, index) => (
                              <div key={winner.user.id} className="bg-white rounded-lg p-4 text-gray-900 flex justify-between items-center">
                                <div>
                                  <p className="font-bold text-lg">{winner.user.name}</p>
                                  <p className="text-sm text-gray-600">{winner.user.whatsapp}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-green-600">{winner.points} pts</p>
                                  <p className="text-sm font-medium text-green-700">R$ {prizePerWinner.toFixed(2)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {winners.length > 1 && (
                          <div className="bg-white bg-opacity-20 rounded-xl p-4 text-center">
                            <p className="text-sm">⚠️ Empate detectado! Premiação dividida igualmente entre os vencedores.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Estatísticas Gerais */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <p className="text-gray-600 text-sm font-medium mb-2">Total de Rodadas</p>
                      <p className="text-3xl font-bold text-gray-900">{rounds.length}</p>
                      <div className="mt-3 space-y-1 text-sm">
                        <p className="text-gray-600">🔜 Futuras: {rounds.filter(r => r.status === 'upcoming').length}</p>
                        <p className="text-green-600">✅ Abertas: {rounds.filter(r => r.status === 'open').length}</p>
                        <p className="text-yellow-600">🔒 Fechadas: {rounds.filter(r => r.status === 'closed').length}</p>
                        <p className="text-purple-600">🏁 Finalizadas: {rounds.filter(r => r.status === 'finished').length}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <p className="text-gray-600 text-sm font-medium mb-2">Participantes</p>
                      <p className="text-3xl font-bold text-gray-900">{users.filter(u => !u.isAdmin).length}</p>
                      <p className="text-sm text-gray-500 mt-3">Jogadores ativos no bolão</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <p className="text-gray-600 text-sm font-medium mb-2">Total de Palpites</p>
                      <p className="text-3xl font-bold text-gray-900">{predictions.length}</p>
                      <p className="text-sm text-gray-500 mt-3">Palpites registrados</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Configurações</h2>
            
            <div className="bg-white rounded-xl shadow-sm border p-6 max-w-3xl">
              <h3 className="text-lg font-bold mb-4">Mensagem do WhatsApp</h3>
              <p className="text-gray-600 text-sm mb-4">
                Personalize a mensagem enviada quando um usuário confirma seus palpites. Use as variáveis:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-mono"><strong>{'{RODADA}'}</strong> - Nome da rodada</p>
                <p className="text-sm font-mono"><strong>{'{PALPITES}'}</strong> - Lista de palpites do usuário</p>
              </div>

              <textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg font-mono text-sm"
                rows="10"
                placeholder="Digite a mensagem..."
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setWhatsappMessage(settings?.whatsappMessage || '')}
                  className="px-6 py-2 border rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveWhatsAppMessage}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg"
                >
                  Salvar Mensagem
                </button>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Prévia:</h4>
                <div className="bg-white p-4 rounded border text-sm whitespace-pre-wrap font-mono">
                  {whatsappMessage
                    .replace('{RODADA}', 'Rodada 1')
                    .replace('{PALPITES}', '1. Palmeiras 2 x 1 Flamengo\n2. Corinthians 1 x 1 Santos')}
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

            {selectedFinanceRound ? (
              (() => {
                const round = rounds.find(r => r.id === selectedFinanceRound);
                const participants = getRoundParticipants(selectedFinanceRound);
                const summary = getRoundFinancialSummary(selectedFinanceRound);
                
                const filteredParticipants = participants.filter(user => {
                  if (paymentFilter === 'paid') return getPaymentStatus(user.id, selectedFinanceRound);
                  if (paymentFilter === 'pending') return !getPaymentStatus(user.id, selectedFinanceRound);
                  return true;
                });

                return (
                  <div className="space-y-6">
                    {/* Resumo Financeiro */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-600 text-sm font-medium">Total Esperado</p>
                            <p className="text-2xl font-bold text-blue-900">R$ {summary.totalExpected.toFixed(2)}</p>
                            <p className="text-xs text-blue-600 mt-1">{summary.totalParticipants} participantes</p>
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

                      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-red-600 text-sm font-medium">Pendente</p>
                            <p className="text-2xl font-bold text-red-900">R$ {summary.totalPending.toFixed(2)}</p>
                            <p className="text-xs text-red-600 mt-1">{summary.pendingCount} devendo</p>
                          </div>
                          <AlertCircle className="text-red-400" size={32} />
                        </div>
                      </div>

                      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-600 text-sm font-medium">Taxa de Pagamento</p>
                            <p className="text-2xl font-bold text-purple-900">
                              {summary.totalParticipants > 0 ? Math.round((summary.paidCount / summary.totalParticipants) * 100) : 0}%
                            </p>
                            <p className="text-xs text-purple-600 mt-1">
                              {summary.paidCount}/{summary.totalParticipants}
                            </p>
                          </div>
                          <Trophy className="text-purple-400" size={32} />
                        </div>
                      </div>
                    </div>

                    {/* Filtros */}
                    <div className="bg-white rounded-xl shadow-sm border p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700">Filtrar:</span>
                        <button
                          onClick={() => setPaymentFilter('all')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            paymentFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Todos ({summary.totalParticipants})
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
                    </div>

                    {/* Lista de Participantes */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                        <h3 className="font-bold text-lg">{round?.name}</h3>
                      </div>
                      
                      {filteredParticipants.length === 0 ? (
                        <div className="p-12 text-center">
                          <Users className="mx-auto text-gray-400 mb-4" size={48} />
                          <h3 className="text-xl font-semibold mb-2">
                            {paymentFilter === 'paid' && 'Nenhum pagamento confirmado'}
                            {paymentFilter === 'pending' && 'Todos os pagamentos confirmados! 🎉'}
                            {paymentFilter === 'all' && 'Nenhum participante nesta rodada'}
                          </h3>
                        </div>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Participante</th>
                              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">WhatsApp</th>
                              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Valor</th>
                              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Ação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {filteredParticipants.map(user => {
                              const isPaid = getPaymentStatus(user.id, selectedFinanceRound);
                              return (
                                <tr key={user.id} className={isPaid ? 'bg-green-50' : ''}>
                                  <td className="px-6 py-4">
                                    <span className="font-medium">{user.name}</span>
                                  </td>
                                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                                    {user.whatsapp}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-lg font-bold text-gray-900">R$ 15,00</span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    {isPaid ? (
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
                                      onClick={() => togglePaymentStatus(user.id, selectedFinanceRound)}
                                      className={`px-4 py-2 rounded-lg font-medium transition ${
                                        isPaid
                                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                          : 'bg-green-600 text-white hover:bg-green-700'
                                      }`}
                                    >
                                      {isPaid ? 'Marcar Pendente' : 'Marcar Pago'}
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
      {editingPassword && <PasswordModal user={editingPassword} onSave={savePassword} onCancel={() => setEditingPassword(null)} />}
    </div>
  );
};

const UserPanel = ({ setView }) => {
  const { currentUser, setCurrentUser, teams, rounds, predictions, users, addPrediction } = useApp();
  const [activeTab, setActiveTab] = useState('predictions');
  const [selectedRound, setSelectedRound] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPredictions, setPendingPredictions] = useState(null);
  const [expandedRounds, setExpandedRounds] = useState({});
  const [selectedRankingRound, setSelectedRankingRound] = useState(null);

  const toggleRound = (roundId) => {
    setExpandedRounds(prev => ({ ...prev, [roundId]: !prev[roundId] }));
  };

  const openRounds = rounds.filter(r => r.status === 'open');
  const closedRounds = rounds.filter(r => r.status === 'closed').sort((a, b) => b.number - a.number);
  const finishedRounds = rounds.filter(r => r.status === 'finished').sort((a, b) => b.number - a.number);
  const upcomingRounds = rounds.filter(r => r.status === 'upcoming').sort((a, b) => a.number - b.number);

  // Inicializar com a primeira rodada finalizada
  useEffect(() => {
    if (!selectedRankingRound && finishedRounds.length > 0) {
      setSelectedRankingRound(finishedRounds[0].id);
    }
  }, [finishedRounds]);

  const getRoundPredictions = (roundId) => {
    return predictions.filter(p => p.userId === currentUser.id && p.roundId === roundId);
  };

  const calculateRoundPoints = (roundId) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round || round.status !== 'finished') return null;
    
    // Verificar se pagou
    const userRoundPreds = predictions.filter(p => p.userId === currentUser.id && p.roundId === roundId);
    const isPaid = userRoundPreds.length > 0 && userRoundPreds[0]?.paid;
    if (!isPaid) return 0; // Se não pagou, retorna 0 pontos
    
    let points = 0;
    round.matches?.forEach(match => {
      const pred = predictions.find(p => 
        p.userId === currentUser.id && 
        p.roundId === roundId && 
        p.matchId === match.id
      );
      
      if (pred && match.finished && match.homeScore !== null && match.awayScore !== null) {
        // Placar exato: 3 pontos
        if (pred.homeScore === match.homeScore && pred.awayScore === match.awayScore) {
          points += 3;
        }
        // Acertou o vencedor ou empate: 1 ponto
        else {
          const predResult = pred.homeScore > pred.awayScore ? 'home' : pred.homeScore < pred.awayScore ? 'away' : 'draw';
          const matchResult = match.homeScore > match.awayScore ? 'home' : match.homeScore < match.awayScore ? 'away' : 'draw';
          if (predResult === matchResult) {
            points += 1;
          }
        }
      }
    });
    return points;
  };

  const RoundAccordion = ({ round }) => {
    const isExpanded = expandedRounds[round.id];
    const userPreds = getRoundPredictions(round.id);
    const hasPredictions = userPreds.length > 0;
    const points = calculateRoundPoints(round.id);
    const isPaid = userPreds.length > 0 && userPreds[0]?.paid;
    
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
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                  {status.icon} {status.text}
                </span>
                {hasPredictions && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${isPaid ? 'bg-green-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
                    {isPaid ? '💰 Pago' : '⚠️ Pagamento Pendente'}
                  </span>
                )}
                {round.status === 'finished' && points !== null && (
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {points} pontos
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
                  onClick={() => setSelectedRound(round)}
                  className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Fazer Palpites Agora
                </button>
              </div>
            )}

            {((round.status === 'open' && hasPredictions) || round.status === 'closed' || round.status === 'finished') && (
              <div className="space-y-3">
                {round.matches?.map((match) => {
                  const homeTeam = teams.find(t => t.id === match.homeTeamId);
                  const awayTeam = teams.find(t => t.id === match.awayTeamId);
                  const pred = predictions.find(p => 
                    p.userId === currentUser.id && 
                    p.roundId === round.id && 
                    p.matchId === match.id
                  );

                  let matchPoints = null;
                  if (round.status === 'finished' && match.finished && pred) {
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
                    <div key={match.id} className="bg-white rounded-lg p-4 border">
                      <div className="grid grid-cols-12 gap-3 items-center">
                        {/* Time Casa */}
                        <div className="col-span-4 flex items-center gap-2">
                          <img src={homeTeam?.logo} alt="" className="w-8 h-8 object-contain" />
                          <span className="font-medium text-sm">{homeTeam?.name}</span>
                        </div>

                        {/* Resultado */}
                        <div className="col-span-4">
                          {/* Palpite */}
                          {pred && (
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <span className="text-xs text-gray-500">Palpite:</span>
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded font-bold">{pred.homeScore}</span>
                                <span className="text-gray-400 font-bold">X</span>
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded font-bold">{pred.awayScore}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Resultado Real */}
                          {match.finished && match.homeScore !== null && (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-xs text-gray-500">Real:</span>
                              <div className="flex items-center gap-2">
                                <span className="bg-green-600 text-white px-3 py-1 rounded font-bold">{match.homeScore}</span>
                                <span className="text-gray-400 font-bold">X</span>
                                <span className="bg-green-600 text-white px-3 py-1 rounded font-bold">{match.awayScore}</span>
                              </div>
                            </div>
                          )}

                          {!pred && round.status !== 'upcoming' && (
                            <div className="text-center">
                              <span className="text-xs text-red-600">Sem palpite</span>
                            </div>
                          )}
                        </div>

                        {/* Time Fora */}
                        <div className="col-span-4 flex items-center gap-2 justify-end">
                          <span className="font-medium text-sm">{awayTeam?.name}</span>
                          <img src={awayTeam?.logo} alt="" className="w-8 h-8 object-contain" />
                        </div>
                      </div>

                      {/* Pontuação do jogo */}
                      {matchPoints !== null && (
                        <div className="mt-3 pt-3 border-t flex justify-center">
                          {matchPoints === 3 && (
                            <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                              <Check size={16} /> Placar Exato: +3 pontos
                            </span>
                          )}
                          {matchPoints === 1 && (
                            <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                              <Check size={16} /> Acertou: +1 ponto
                            </span>
                          )}
                          {matchPoints === 0 && (
                            <span className="bg-red-100 text-red-700 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                              <X size={16} /> Errou: 0 pontos
                            </span>
                          )}
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

  const isRoundFinalized = (roundId) => {
    const round = rounds.find(r => r.id === roundId);
    return round?.matches?.every(match => predictions.find(p => p.userId === currentUser.id && p.roundId === roundId && p.matchId === match.id)?.finalized);
  };

  const PredictionForm = ({ round }) => {
    const [localPreds, setLocalPreds] = useState({});
    const isFinalized = isRoundFinalized(round.id);

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

      setPendingPredictions({ round, predictions: allPreds });
      setShowConfirmModal(true);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b sticky top-0 bg-white">
            <h3 className="text-2xl font-bold">{round.name}</h3>
            <p className="text-gray-600 mt-1">{isFinalized ? <span className="text-green-600">✅ Finalizados</span> : 'R$ 15,00'}</p>
          </div>
          <div className="p-6 space-y-4">
            {round.matches?.map((match) => {
              const homeTeam = teams.find(t => t.id === match.homeTeamId);
              const awayTeam = teams.find(t => t.id === match.awayTeamId);
              const userPred = predictions.find(p => p.userId === currentUser.id && p.roundId === round.id && p.matchId === match.id);
              return (
                <div key={match.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex flex-col gap-3">
                    {/* Times e Logos */}
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
                    
                    {/* Inputs de Palpite */}
                    <div className="flex items-center justify-center gap-3">
                      <input 
                        type="number" 
                        min="0" 
                        max="20" 
                        defaultValue={userPred?.homeScore} 
                        onChange={(e) => setLocalPreds({ ...localPreds, [match.id]: { ...localPreds[match.id], home: e.target.value } })} 
                        disabled={isFinalized} 
                        className={`w-16 px-2 py-2 border rounded text-center font-bold ${isFinalized ? 'bg-gray-200' : ''}`} 
                        placeholder="0" 
                      />
                      <span className="font-bold text-gray-400">X</span>
                      <input 
                        type="number" 
                        min="0" 
                        max="20" 
                        defaultValue={userPred?.awayScore} 
                        onChange={(e) => setLocalPreds({ ...localPreds, [match.id]: { ...localPreds[match.id], away: e.target.value } })} 
                        disabled={isFinalized} 
                        className={`w-16 px-2 py-2 border rounded text-center font-bold ${isFinalized ? 'bg-gray-200' : ''}`} 
                        placeholder="0" 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-6 border-t flex gap-3 sticky bottom-0 bg-white">
            <button onClick={() => setSelectedRound(null)} className="px-6 py-2 border rounded-lg">{isFinalized ? 'Fechar' : 'Cancelar'}</button>
            {!isFinalized && <button onClick={handleSubmit} className="px-6 py-2 bg-green-600 text-white rounded-lg">Confirmar</button>}
          </div>
        </div>
      </div>
    );
  };

  const ConfirmModal = ({ round, predictionsData, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="p-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Award size={32} />
            <div>
              <h3 className="text-2xl font-bold">Confirmar Palpites</h3>
              <p className="text-yellow-100">{round.name}</p>
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
              <span className="text-2xl font-bold text-green-600">R$ 15,00</span>
            </div>
          </div>
        </div>
        <div className="p-6 border-t flex gap-3">
          <button onClick={onCancel} className="flex-1 px-6 py-3 border-2 rounded-lg font-semibold hover:bg-gray-50">Revisar Palpites</button>
          <button onClick={onConfirm} className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:from-green-700 hover:to-green-800">Confirmar Definitivo</button>
        </div>
      </div>
    </div>
  );

  const confirmAndSave = async () => {
    if (!pendingPredictions) return;
    try {
      for (const pred of pendingPredictions.predictions) {
        await addPrediction({
          userId: currentUser.id,
          roundId: pendingPredictions.round.id,
          matchId: pred.match.id,
          homeScore: pred.homeScore,
          awayScore: pred.awayScore,
          finalized: true
        });
      }
      sendWhatsAppMessage(
        currentUser.whatsapp, 
        pendingPredictions.round.name, 
        pendingPredictions.predictions, 
        teams,
        settings?.whatsappMessage
      );
      setShowConfirmModal(false);
      setPendingPredictions(null);
      setSelectedRound(null);
      alert('✅ Palpites confirmados! Verifique seu WhatsApp.\n\n⚠️ IMPORTANTE: Os pontos só serão computados após a confirmação do pagamento pelo administrador.');
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const userPredictions = predictions.filter(p => p.userId === currentUser.id);
  
  // Calcula pontos totais do usuário
  const totalPoints = rounds
    .filter(r => r.status === 'finished')
    .reduce((sum, round) => sum + (calculateRoundPoints(round.id) || 0), 0);
  
  // Função para calcular pontos de um usuário em uma rodada específica
  const calculateUserRoundPoints = (userId, roundId) => {
    const round = rounds.find(r => r.id === roundId);
    if (!round || round.status !== 'finished') return 0;
    
    // Verificar se pagou
    const userRoundPreds = predictions.filter(p => p.userId === userId && p.roundId === roundId);
    const isPaid = userRoundPreds.length > 0 && userRoundPreds[0]?.paid;
    if (!isPaid) return 0; // Se não pagou, retorna 0 pontos
    
    let points = 0;
    round.matches?.forEach(match => {
      const pred = predictions.find(p => 
        p.userId === userId && 
        p.roundId === roundId && 
        p.matchId === match.id
      );
      
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
  };
  
  // Ranking por rodada específica
  const getRankingForRound = (roundId) => {
    if (!roundId) return [];
    
    return users.filter(u => !u.isAdmin).map(user => {
      const userPoints = calculateUserRoundPoints(user.id, roundId);
      const userRoundPreds = predictions.filter(p => p.userId === user.id && p.roundId === roundId);
      
      return {
        user,
        points: userPoints,
        predictions: userRoundPreds.length
      };
    }).sort((a, b) => {
      // Ordena por pontos, se empate ordena por quem tem mais palpites
      if (b.points !== a.points) return b.points - a.points;
      return b.predictions - a.predictions;
    });
  };
  
  const ranking = selectedRankingRound ? getRankingForRound(selectedRankingRound) : [];

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
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Trophy className="text-yellow-300" size={24} />
                <div>
                  <p className="text-green-100 text-sm">Pontos</p>
                  <p className="text-2xl font-bold">{totalPoints}</p>
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Target className="text-blue-300" size={24} />
                <div>
                  <p className="text-green-100 text-sm">Palpites</p>
                  <p className="text-2xl font-bold">{userPredictions.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Award className="text-purple-300" size={24} />
                <div>
                  <p className="text-green-100 text-sm">Posição</p>
                  <p className="text-2xl font-bold">{ranking.findIndex(r => r.user.id === currentUser.id) + 1 || '-'}º</p>
                </div>
              </div>
            </div>
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
            <p className="text-gray-600 mb-6">Escolha uma rodada e faça seus palpites</p>
            {openRounds.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-semibold mb-2">Nenhuma rodada disponível</h3>
              </div>
            ) : (
              <div className="grid gap-4">
                {openRounds.map((round) => {
                  const isFinalized = isRoundFinalized(round.id);
                  const userRoundPreds = predictions.filter(p => p.userId === currentUser.id && p.roundId === round.id);
                  const isPaid = userRoundPreds.length > 0 && userRoundPreds[0]?.paid;
                  
                  return (
                    <div key={round.id} className="bg-white rounded-xl shadow-sm border p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold">{round.name}</h3>
                            {isFinalized && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">✅ Finalizado</span>}
                            {isFinalized && (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${isPaid ? 'bg-green-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
                                {isPaid ? '💰 Pago' : '⚠️ Pendente'}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mt-1">{round.matches?.length || 0} jogos • R$ 15,00</p>
                        </div>
                        <button onClick={() => setSelectedRound(round)} className={`px-6 py-3 rounded-lg font-medium ${isFinalized ? 'bg-gray-100 text-gray-700' : 'bg-green-600 text-white'}`}>
                          {isFinalized ? 'Ver Palpites' : 'Fazer Palpites'}
                        </button>
                      </div>
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
                <p className="text-gray-600 mt-1">Classificação por rodada</p>
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
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                  <h3 className="font-bold text-lg">
                    {rounds.find(r => r.id === selectedRankingRound)?.name}
                  </h3>
                </div>
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Posição</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Participante</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Palpites</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase">Pontos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ranking.map((item, index) => (
                      <tr key={item.user.id} className={item.user.id === currentUser.id ? 'bg-green-50' : ''}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {index === 0 && <Trophy className="text-yellow-500" size={20} />}
                            {index === 1 && <Trophy className="text-gray-400" size={20} />}
                            {index === 2 && <Trophy className="text-orange-600" size={20} />}
                            <span className="text-lg font-bold">{index + 1}º</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium">{item.user.name}</span>
                          {item.user.id === currentUser.id && (
                            <span className="ml-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">Você</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={item.predictions === 0 ? 'text-red-600 font-medium' : ''}>
                            {item.predictions}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xl font-bold text-green-600">{item.points}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {ranking.length === 0 && (
                  <div className="p-12 text-center">
                    <Users className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-xl font-semibold mb-2">Nenhum participante ainda</h3>
                  </div>
                )}
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
                {/* Rodadas Abertas */}
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

                {/* Rodadas Fechadas */}
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

                {/* Rodadas Finalizadas */}
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

                {/* Rodadas Futuras */}
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

      {selectedRound && <PredictionForm round={selectedRound} />}
      {showConfirmModal && pendingPredictions && <ConfirmModal round={pendingPredictions.round} predictionsData={pendingPredictions.predictions} onConfirm={confirmAndSave} onCancel={() => { setShowConfirmModal(false); setPendingPredictions(null); }} />}
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
