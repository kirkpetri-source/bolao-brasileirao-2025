import React, { useState, useEffect, createContext, useContext } from 'react';
import { Trophy, Users, Calendar, TrendingUp, LogOut, Eye, EyeOff, Plus, Edit2, Trash2, Upload, ExternalLink, X, UserPlus, Target, Award, ChevronDown, ChevronUp, Check, Key } from 'lucide-react';
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

    console.log('🎉 Done!');
  } catch (error) {
    console.error('Error:', error);
  }
};

const sendWhatsAppMessage = (userPhone, roundName, predictions, teams) => {
  let message = `🏆 *BOLÃO BRASILEIRÃO 2025*\n\n📋 *${roundName}*\n✅ Confirmado!\n\n`;
  predictions.forEach((pred, i) => {
    const homeTeam = teams.find(t => t.id === pred.match.homeTeamId);
    const awayTeam = teams.find(t => t.id === pred.match.awayTeamId);
    message += `${i + 1}. ${homeTeam?.name} ${pred.homeScore} x ${pred.awayScore} ${awayTeam?.name}\n`;
  });
  message += `\n💰 R$ 15,00\n⚠️ *Não pode alterar*\n\nBoa sorte! 🍀`;
  window.open(`https://wa.me/${userPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
};

const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await initializeDatabase();
        const [u, t, r, p] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'teams')),
          getDocs(collection(db, 'rounds')),
          getDocs(collection(db, 'predictions'))
        ]);
        setUsers(u.docs.map(d => ({ id: d.id, ...d.data() })));
        setTeams(t.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)));
        setRounds(r.docs.map(d => ({ id: d.id, ...d.data() })));
        setPredictions(p.docs.map(d => ({ id: d.id, ...d.data() })));
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
      onSnapshot(collection(db, 'users'), s => setUsers(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    ];
    return () => uns.forEach(u => u());
  }, []);

  const value = {
    currentUser, setCurrentUser, users, teams, rounds, predictions, loading,
    addUser: async (d) => { const r = await addDoc(collection(db, 'users'), { ...d, createdAt: serverTimestamp() }); return { id: r.id, ...d }; },
    updateUser: async (id, d) => await updateDoc(doc(db, 'users', id), d),
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
    addPrediction: async (d) => { const r = await addDoc(collection(db, 'predictions'), { ...d, createdAt: serverTimestamp() }); return { id: r.id, ...d }; }
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
  const { currentUser, setCurrentUser, teams, rounds, users, predictions, addRound, updateRound, deleteRound, addTeam, updateTeam, deleteTeam, updateUser, resetTeamsToSerieA2025 } = useApp();
  const [activeTab, setActiveTab] = useState('rounds');
  const [editingRound, setEditingRound] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);

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
          <div className="flex gap-6">
            {['rounds', 'teams', 'participants'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 px-2 border-b-2 font-medium ${activeTab === tab ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500'}`}>
                {tab === 'rounds' && <><Calendar className="inline mr-2" size={18} />Rodadas</>}
                {tab === 'teams' && <><Users className="inline mr-2" size={18} />Times</>}
                {tab === 'participants' && <><TrendingUp className="inline mr-2" size={18} />Participantes</>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
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
              <h2 className="text-2xl font-bold">Gerenciar Times</h2>
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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

  const openRounds = rounds.filter(r => r.status === 'open');

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
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4 flex items-center gap-2">
                      <img src={homeTeam?.logo} alt="" className="w-8 h-8" />
                      <span className="font-medium text-sm">{homeTeam?.name}</span>
                    </div>
                    <div className="col-span-4 flex items-center justify-center gap-2">
                      <input type="number" min="0" max="20" defaultValue={userPred?.homeScore} onChange={(e) => setLocalPreds({ ...localPreds, [match.id]: { ...localPreds[match.id], home: e.target.value } })} disabled={isFinalized} className={`w-16 px-2 py-2 border rounded text-center font-bold ${isFinalized ? 'bg-gray-200' : ''}`} placeholder="0" />
                      <span className="font-bold text-gray-400">X</span>
                      <input type="number" min="0" max="20" defaultValue={userPred?.awayScore} onChange={(e) => setLocalPreds({ ...localPreds, [match.id]: { ...localPreds[match.id], away: e.target.value } })} disabled={isFinalized} className={`w-16 px-2 py-2 border rounded text-center font-bold ${isFinalized ? 'bg-gray-200' : ''}`} placeholder="0" />
                    </div>
                    <div className="col-span-4 flex items-center gap-2 justify-end">
                      <span className="font-medium text-sm">{awayTeam?.name}</span>
                      <img src={awayTeam?.logo} alt="" className="w-8 h-8" />
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
          <button onClick={onCancel} className="flex-1 px-6 py-3 border-2 rounded-lg">Revisar</button>
          <button onClick={onConfirm} className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold">Confirmar</button>
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
      sendWhatsAppMessage(currentUser.whatsapp, pendingPredictions.round.name, pendingPredictions.predictions, teams);
      setShowConfirmModal(false);
      setPendingPredictions(null);
      setSelectedRound(null);
      alert('✅ Palpites confirmados! Verifique seu WhatsApp.');
    } catch (error) {
      alert('Erro: ' + error.message);
    }
  };

  const userPredictions = predictions.filter(p => p.userId === currentUser.id);
  const ranking = users.filter(u => !u.isAdmin).map(user => ({
    user,
    totalPoints: 0,
    totalPredictions: predictions.filter(p => p.userId === user.id).length
  })).sort((a, b) => b.totalPoints - a.totalPoints);

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
                  <p className="text-2xl font-bold">0</p>
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
                {tab === 'history' && <><Calendar className="inline mr-2" size={18} />Histórico</>}
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
                  return (
                    <div key={round.id} className="bg-white rounded-xl shadow-sm border p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold">{round.name}</h3>
                            {isFinalized && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">✅ Finalizado</span>}
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
            <h2 className="text-2xl font-bold mb-6">Classificação Geral</h2>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
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
                        {item.user.id === currentUser.id && <span className="ml-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">Você</span>}
                      </td>
                      <td className="px-6 py-4 text-center">{item.totalPredictions}</td>
                      <td className="px-6 py-4 text-center"><span className="text-xl font-bold text-green-600">{item.totalPoints}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Meu Histórico</h2>
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold mb-2">Nenhum palpite ainda</h3>
            </div>
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
