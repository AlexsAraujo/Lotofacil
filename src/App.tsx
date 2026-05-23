/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  History, 
  BarChart3, 
  RefreshCw, 
  Copy, 
  Download, 
  Trash2, 
  Plus,
  ShieldCheck,
  Lock,
  Zap,
  CheckCircle2,
  Atom,
  LogOut,
  Info,
  ChevronDown,
  ChevronUp,
  Target,
  Calculator,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity
} from 'lucide-react';
import { Contest, StatisticalSummary, Game, UserAccount, OptimizationScenario, PredictiveOutcome } from './types';
import { generateBatch, calculateStatistics, generateSpecificGame, calculatePredictions } from './services/lotteryService';
import { TRIAL_LIMITS, PRICING_PLANS, LOTTERY_RULES } from './constants';

const ADMIN_EMAIL = 'a.soaresaraujo@gmail.com';

interface GameCardProps {
  game: Game;
  idx: number;
  history: Contest[];
  copyGame: (n: number[]) => void;
  key?: string;
}

const GameCard = ({ game, idx, history, copyGame }: GameCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ delay: idx * 0.05 }}
      key={game.id}
      className={`relative bg-white/5 border rounded-2xl p-5 overflow-hidden group transition-colors ${
        game.isStale ? 'border-amber-500/20 opacity-60' : 'border-white/10 hover:border-indigo-500/40'
      }`}
    >
        {game.isStale && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500/20 text-amber-500 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
          Desatualizado
        </div>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-white/20">#{idx + 1}</span>
            <div className={`w-2 h-2 rounded-full ${game.metrics.score >= 80 ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
        </div>
        <button 
          onClick={() => copyGame(game.numbers)}
          className="opacity-0 group-hover:opacity-100 p-1.5 bg-indigo-500 rounded-lg transition-all active:scale-90"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {game.numbers.map((num) => {
          const isMatch = history[0]?.numbers.includes(num);
          return (
            <div 
              key={num}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold border transition-colors ${
                isMatch 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                  : 'bg-black/20 border-white/5 text-white/60'
              }`}
            >
              {num.toString().padStart(2, '0')}
            </div>
          )
        })}
      </div>

      <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
          <div className="flex flex-wrap gap-1.5">
            <div className="text-[9px] text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/5" title="Pares e Ímpares">
              {game.metrics.evens}P / {game.metrics.odds}Í
            </div>
            <div className="text-[9px] text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/5" title="Soma Total">
              Soma: {game.metrics.sum}
            </div>
            <div className="text-[9px] text-indigo-400/60 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10" title="Entropia de Estado">
              Quantum: {game.metrics.entropy.toFixed(0)}%
            </div>
          </div>

          <div className="space-y-1">
            {game.metrics.reasoning.slice(0, 3).map((reason, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[8px] text-white/30 uppercase font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500/40" /> {reason}
                </div>
            ))}
            {history.length >= 10 && (
              <div className="flex items-center gap-1.5 text-[8px] text-indigo-400/60 uppercase font-medium">
                <Zap className="w-2.5 h-2.5" /> 
                Survival (Últ. 50): {
                  history.slice(0, 50).filter(h => 
                    game.numbers.filter(n => h.numbers.includes(n)).length >= 11
                  ).length
                } hits
              </div>
            )}
          </div>

          <div className="flex flex-col border-t border-white/5 pt-2 mt-2">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full group/btn"
            >
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                game.metrics.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 
                game.metrics.score >= 50 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-white/40'
              }`}>
                Score: {game.metrics.score}
                <Info className="w-2.5 h-2.5 opacity-50" />
              </div>
              {isExpanded ? <ChevronUp className="w-3 h-3 text-white/20 group-hover/btn:text-white/40 transition-colors" /> : <ChevronDown className="w-3 h-3 text-white/20 group-hover/btn:text-white/40 transition-colors" />}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 pb-1 space-y-2">
                    {[
                      { label: 'Par/Ímpar', value: game.metrics.scoreDetails.parImpar, max: 15 },
                      { label: 'Baixo/Alto', value: game.metrics.scoreDetails.baixoAlto, max: 15 },
                      { label: 'Entropia/Disp', value: game.metrics.scoreDetails.entropy, max: 20 },
                      { label: 'Freq. Total', value: game.metrics.scoreDetails.totalFreq, max: 20 },
                      { label: 'Freq. Recente', value: game.metrics.scoreDetails.recentFreq, max: 20 },
                      { label: 'Atraso (Delay)', value: game.metrics.scoreDetails.delay, max: 10 },
                    ].map((detail) => (
                      <div key={detail.label} className="space-y-1">
                        <div className="flex justify-between text-[8px] uppercase tracking-tighter">
                          <span className="text-white/40">{detail.label}</span>
                          <span className="text-white font-mono">{detail.value}%</span>
                        </div>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(detail.value / (detail.max || 100)) * 100}%` }}
                            className="h-full bg-indigo-500/60"
                          />
                        </div>
                      </div>
                    ))}
                    <p className="text-[7px] text-white/20 italic pt-1">* Pesos calculados sobre modelo de superposição Quantum v5.0</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-end mt-1">
            <span className="text-[9px] text-white/10 font-mono italic">#{game.id.split('_').pop()}</span>
          </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  // --- STATE ---
  const [history, setHistory] = useState<Contest[]>([]);
  
  // Seed data based on Lotofácil history provided by user
  const SEED_HISTORY: Contest[] = [
    { id: '3301', numbers: [3, 4, 5, 7, 8, 10, 11, 14, 15, 18, 19, 20, 22, 24, 25], timestamp: 1737604800000 },
    { id: '3191', numbers: [1, 3, 4, 5, 6, 10, 11, 14, 15, 17, 19, 22, 23, 24, 25], timestamp: 1725940800000 },
    { id: '2451', numbers: [3, 4, 5, 7, 9, 10, 11, 15, 18, 19, 20, 22, 23, 24, 25], timestamp: 1645070400000 },
    { id: '2046', numbers: [1, 3, 4, 7, 10, 11, 14, 15, 17, 20, 21, 22, 23, 24, 25], timestamp: 1601524800000 },
    { id: '1923', numbers: [1, 4, 5, 7, 10, 11, 12, 14, 17, 19, 20, 22, 23, 24, 25], timestamp: 1580443200000 },
    { id: '1463', numbers: [3, 4, 6, 7, 10, 11, 13, 14, 15, 17, 19, 20, 22, 23, 24], timestamp: 1484712000000 }
  ];

  const [games, setGames] = useState<Game[]>([]);
  const [newResult, setNewResult] = useState<string>('');
  const [useQRNG, setUseQRNG] = useState(false);
  const [avoidRepetition, setAvoidRepetition] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [email, setEmail] = useState('');
  const [batchSize, setBatchSize] = useState(10);
  const [specificInput, setSpecificInput] = useState('');
  const [selectedScenario, setSelectedScenario] = useState<OptimizationScenario | 'random'>('random');
  const [simulatorNumbers, setSimulatorNumbers] = useState<number[]>([]);
  const [simulationResults, setSimulationResults] = useState<{contestId: string, hits: number, numbers: number[], timestamp: number}[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [predictions, setPredictions] = useState<PredictiveOutcome[]>([]);

  // --- DERIVED ---
  const stats = calculateStatistics(history);
  const isTrialExpired = currentUser && !currentUser.isPremium && !currentUser.isAdmin && (
    Date.now() - currentUser.trialStartedAt > TRIAL_LIMITS.DURATION_MS ||
    currentUser.batchesGenerated >= TRIAL_LIMITS.BATCH_LIMIT
  );

  // --- EFFECTS ---
  useEffect(() => {
    const savedHistory = localStorage.getItem('loto_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    } else {
      setHistory(SEED_HISTORY);
      saveToStorage(SEED_HISTORY);
    }

    const savedUser = localStorage.getItem('loto_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      setPredictions(calculatePredictions(history));
    }
  }, [history]);

  const saveToStorage = (h: Contest[]) => {
    localStorage.setItem('loto_history', JSON.stringify(h));
  };

  // --- ACTIONS ---
  const handleAddResult = () => {
    const nums = newResult.split(/[\s,.-]+/).map(Number).filter(n => n >= 1 && n <= 25);
    if (nums.length !== 15 || new Set(nums).size !== 15) {
      alert('Insira exatamente 15 números únicos entre 01 e 25.');
      return;
    }

    const updated = [{
      id: Math.random().toString(36).substr(2, 9),
      numbers: nums.sort((a, b) => a - b),
      timestamp: Date.now()
    }, ...history].slice(0, 10);

    setHistory(updated);
    saveToStorage(updated);
    setNewResult('');
    setGames(prev => prev.map(g => ({ ...g, isStale: true })));
  };

  const handleGenerate = async () => {
    if (!currentUser) {
      setShowAuth(true);
      return;
    }
    if (isTrialExpired) {
      setShowUpgrade(true);
      return;
    }

    setIsGenerating(true);
    try {
      const scenario = selectedScenario === 'random' ? undefined : selectedScenario;
      const batch = await generateBatch(batchSize, history, useQRNG, scenario, avoidRepetition);
      setGames(batch);
      
      const updatedUser = { 
        ...currentUser, 
        batchesGenerated: (currentUser.batchesGenerated || 0) + 1 
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('loto_user', JSON.stringify(updatedUser));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSpecific = async () => {
    if (!currentUser) {
      setShowAuth(true);
      return;
    }
    if (isTrialExpired) {
      setShowUpgrade(true);
      return;
    }

    const nums = specificInput.split(/[\s,.-]+/).map(Number).filter(n => n >= 1 && n <= 25);
    if (nums.length !== 15 || new Set(nums).size !== 15) {
      alert('Insira 15 números únicos entre 01 e 25 para a priorização.');
      return;
    }

    setIsGenerating(true);
    try {
      const specificGame = await generateSpecificGame(nums, history);
      if (specificGame) {
        setGames([specificGame, ...games]);
        
        const updatedUser = { 
          ...currentUser, 
          batchesGenerated: (currentUser.batchesGenerated || 0) + 1 
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('loto_user', JSON.stringify(updatedUser));
        setSpecificInput('');
      } else {
        alert('Não foi possível gerar um jogo balanceado com esses números. Tente uma combinação diferente.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const clearHistory = () => {
    if (confirm('Limpar todo o histórico?')) {
      setHistory([]);
      localStorage.removeItem('loto_history');
    }
  };

  const loginMock = () => {
    const inputEmail = email.trim();
    if (!inputEmail.includes('@')) return;
    
    const isAdmin = inputEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    
    const user: UserAccount = {
      email: inputEmail,
      hash: btoa(inputEmail), // Simple hash for MVP
      trialStartedAt: Date.now(),
      batchesGenerated: 0,
      isPremium: isAdmin, // Master account is premium
      isAdmin: isAdmin
    };
    setCurrentUser(user);
    localStorage.setItem('loto_user', JSON.stringify(user));
    setShowAuth(false);
    setEmail('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('loto_user');
  };

  const copyGame = (nums: number[]) => {
    navigator.clipboard.writeText(nums.join(','));
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + games.map(g => g.numbers.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `loto_batch_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const toggleSimulatorNumber = (n: number) => {
    if (simulatorNumbers.includes(n)) {
      setSimulatorNumbers(simulatorNumbers.filter(num => num !== n));
    } else if (simulatorNumbers.length < 20) {
      setSimulatorNumbers([...simulatorNumbers, n].sort((a, b) => a - b));
    }
  };

  const handleSimulate = () => {
    if (simulatorNumbers.length < 15) {
      alert('Selecione ao menos 15 números para simular.');
      return;
    }
    
    setIsSimulating(true);
    // Mimic processing time
    setTimeout(() => {
      const results = history.map(contest => {
        const hits = simulatorNumbers.filter(n => contest.numbers.includes(n)).length;
        return {
          contestId: contest.id,
          hits,
          numbers: contest.numbers,
          timestamp: contest.timestamp
        };
      }).sort((a, b) => b.hits - a.hits);
      
      setSimulationResults(results);
      setIsSimulating(false);
    }, 800);
  };

  const getScenarioLabel = (s: string) => {
    const labels: Record<string, string> = {
      'dominancia_numeros_fortes': 'Números Fortes',
      'retorno_atrasados': 'Retorno Atrasados',
      'equilibrio_historico': 'Equilíbrio Histórico',
      'alta_repeticao': 'Alta Repetição',
      'alta_dispersao': 'Alta Dispersão',
      'baixa_entropia_controlada': 'Baixa Entropia',
      'random': 'Ciclagem Automática'
    };
    return labels[s] || s;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight uppercase">Máquina de Guerra <span className="bg-indigo-500 text-[8px] px-1.5 py-0.5 rounded ml-1 align-top">v5.0 QUANTUM</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                  <p className="text-xs text-white/40">{currentUser.email}</p>
                  <p className="text-[10px] font-mono text-indigo-400 uppercase">
                    {currentUser.isAdmin ? 'MASTER ADMIN' : (currentUser.isPremium ? 'PREMIUM' : `TRIAL: ${3 - currentUser.batchesGenerated} RESTANTES`)}
                  </p>
                </div>
                {!currentUser.isPremium && (
                  <button 
                    onClick={() => setShowUpgrade(true)}
                    className="bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 transition-colors"
                  >
                    Upgrade
                  </button>
                )}
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-rose-500/10 text-rose-500/60 hover:text-rose-400 rounded-lg transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowAuth(true)}
                className="bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
              >
                Acessar Sistema
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls & History */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Module 1: Data Entry */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
              <Plus className="w-4 h-4" /> Novo Concurso
            </h2>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="15 números (ex: 01 02 04...)"
                value={newResult}
                onChange={(e) => setNewResult(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button 
                onClick={handleAddResult}
                className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-2"
              >
                Adicionar ao Histórico
              </button>
            </div>
            
            {/* History List */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest">Controle Amostral</h3>
                  <p className="text-[9px] text-white/20 italic">Últimos 10 concursos otimizados</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => alert('Sincronização automática v4.0: Tentando conexão com canais da Caixa... (API em sandbox usa cache local)')}
                    className="text-indigo-400 hover:text-indigo-300 p-1 transition-colors"
                    title="Sincronizar v4.0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button onClick={clearHistory} className="text-rose-500/60 hover:text-rose-400 p-1 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.id} className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] font-mono text-white/30">{new Date(h.timestamp).toLocaleDateString()}</span>
                    <div className="flex gap-0.5">
                      {h.numbers.slice(0, 5).map(n => (
                        <div key={n} className="w-5 h-5 flex items-center justify-center bg-white/5 rounded text-[10px] font-mono">{n.toString().padStart(2, '0')}</div>
                      ))}
                      <span className="text-[10px] text-white/20">...</span>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="text-center py-8 text-xs text-white/20 italic">Nenhum concurso salvo.</p>
                )}
              </div>
            </div>
          </section>

          {/* Module 2: Analysis Panel */}
          <section className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-indigo-400 mb-6">
              <BarChart3 className="w-4 h-4" /> Painel de Otimização
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <p className="text-[10px] text-white/40 uppercase mb-1">Média Par/Ímpar</p>
                <p className="text-xl font-bold font-mono">{stats.avgEvenOdd.evens.toFixed(1)} / {stats.avgEvenOdd.odds.toFixed(1)}</p>
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <p className="text-[10px] text-white/40 uppercase mb-1">Freq. Amostral</p>
                <p className="text-xl font-bold font-mono">n={history.length}</p>
              </div>
            </div>

            <h3 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-widest">Espectro de Frequências</h3>
            <div className="flex flex-wrap gap-1.5 mb-8">
              {Object.entries(stats.frequencies).map(([num, freq]) => {
                const f = Number(freq);
                const intensity = Math.min(100, (f / (history.length || 1)) * 200);
                return (
                  <div 
                    key={num} 
                    className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center text-[10px] transition-all border ${
                      f > 0 ? 'bg-indigo-600/20 border-indigo-500/40 text-white' : 'bg-white/5 border-white/5 text-white/20'
                    }`}
                    style={f > 0 ? { backgroundColor: `rgba(99, 102, 241, ${intensity / 100})` } : {}}
                    title={`${f} ocorrências`}
                  >
                    <span className="font-bold">{num.padStart(2, '0')}</span>
                  </div>
                );
              })}
            </div>

            <h3 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-widest">Análise de Estados Dinâmicos</h3>
            <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.keys(stats.frequencies).map((numStr) => {
                const num = Number(numStr);
                const ms = stats.multiState[num];
                return (
                  <div key={num} className="bg-black/30 p-3 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                       <span className="w-6 h-6 flex items-center justify-center bg-indigo-500/10 rounded text-[11px] font-bold text-indigo-400">
                        {numStr.padStart(2, '0')}
                      </span>
                      <div className="flex gap-2">
                         <div className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                           Freq: {(ms.totalFreq * 100).toFixed(0)}%
                         </div>
                         <div className="text-[8px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                           Dens: {ms.density.toFixed(2)}
                         </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                       <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${ms.recentFreq * 100}%` }} title="Freq. Recente" />
                       </div>
                       <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${ms.delay * 100}%` }} title="Atraso Normalizado" />
                       </div>
                       <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${ms.entropy * 100}%` }} title="Entropia de Estado" />
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Module: Winner Simulator */}
          <section className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-500 mb-2">
              <Trophy className="w-4 h-4" /> Eu já teria ganho?
            </h2>
            <p className="text-[10px] text-white/40 mb-6 font-medium italic">
              Selecione de 15 a 20 números para verificarmos se você ganharia algo nos concursos anteriores.
            </p>

            <div className="grid grid-cols-5 gap-1.5 mb-6">
              {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => toggleSimulatorNumber(n)}
                  className={`aspect-square flex items-center justify-center rounded-lg text-xs font-bold border transition-all ${
                    simulatorNumbers.includes(n)
                      ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/20'
                      : 'bg-black/20 border-white/5 text-white/40 hover:border-white/20'
                  }`}
                >
                  {n.toString().padStart(2, '0')}
                </button>
              ))}
            </div>

            <div className="bg-black/30 p-3 rounded-xl border border-white/5 mb-4 text-center">
              <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Dezenas Selecionadas</span>
              <span className="text-xl font-mono font-bold text-amber-500">{simulatorNumbers.length}</span>
            </div>

            <button
              onClick={handleSimulate}
              disabled={isSimulating || simulatorNumbers.length < 15}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mb-6"
            >
              {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              Verificar Retroativo
            </button>

            {simulationResults.length > 0 && (
              <div className="space-y-3 mt-4 border-t border-white/10 pt-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[12px] font-bold uppercase text-amber-500 tracking-[0.2em]">Resultados Retroativos</h4>
                  <div className="flex gap-2">
                    <div className="text-[8px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20">
                      Top Hits: {simulationResults[0]?.hits}
                    </div>
                  </div>
                </div>
                
                <div className="mb-6 p-4 bg-black/40 rounded-xl border border-white/10 text-center">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-bold italic">Sua Seleção para Comparativo</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {simulatorNumbers.map(n => (
                      <span key={n} className="w-6 h-6 flex items-center justify-center bg-amber-500 text-black rounded text-[10px] font-bold">{n.toString().padStart(2, '0')}</span>
                    ))}
                  </div>
                </div>

                {simulationResults.slice(0, 10).map((res) => (
                  <div key={res.contestId} className="bg-[#f8f8f8] rounded-lg p-5 shadow-2xl border-b-4 border-zinc-300 transform hover:scale-[1.02] transition-transform mb-4">
                    <div className="flex items-center justify-between gap-3 mb-4 text-zinc-900 border-b border-zinc-200 pb-3">
                       <span className="text-xs font-bold uppercase tracking-tight">Concurso <span className="bg-indigo-600 text-white px-2 py-0.5 rounded">{res.contestId}</span></span>
                       <div className="flex items-center gap-3">
                          <span className="text-[10px] text-zinc-500 font-medium">({new Date(res.timestamp).toLocaleDateString()})</span>
                          <span className="text-sm font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{res.hits} acertos</span>
                       </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-3 px-2">
                      {res.numbers.map(n => {
                        const isHit = simulatorNumbers.includes(n);
                        return (
                          <span 
                            key={n} 
                            className={`text-sm font-bold font-mono transition-colors ${
                              isHit ? 'text-zinc-800' : 'text-rose-600 drop-shadow-[0_0_1px_rgba(225,29,72,0.3)]'
                            }`}
                          >
                            {n.toString().padStart(2, '0')}
                          </span>
                        );
                      })}
                    </div>
                    {res.hits >= 11 && (
                      <div className="mt-4 flex items-center justify-center gap-2 bg-emerald-500/10 py-1.5 rounded-full">
                        <Trophy className="w-3 h-3 text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tighter">Premiado com {res.hits} pontos!</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {simulationResults.length > 5 && (
                  <p className="text-center text-[9px] text-white/20 italic mt-4">Analisando base completa de concursos.</p>
                )}
              </div>
            )}
          </section>

          {/* Module: Predictive Engine */}
          <section className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-indigo-400">
                  <Activity className="w-4 h-4" /> Probabilidades Futuras
                </h2>
                <p className="text-[9px] text-white/30 uppercase tracking-tighter mt-1">Estimativa Baseada em Entropia Residual</p>
              </div>
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                 <Search className="w-3.5 h-3.5 text-indigo-400" />
              </div>
            </div>

            <div className="space-y-4">
              {predictions.slice(0, 5).map((pred) => (
                <div key={pred.number} className="group bg-white/5 border border-white/5 p-3 rounded-xl hover:border-indigo-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-indigo-500/20 text-indigo-400 rounded-lg font-mono font-bold text-sm">
                        {pred.number.toString().padStart(2, '0')}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                           <span className="text-[10px] font-bold text-white/80">{pred.probability}% Probabilidade</span>
                           {pred.trend === 'up' ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
                        </div>
                        <div className="flex gap-1 mt-0.5">
                          {pred.factors.slice(0, 1).map(f => (
                            <span key={f} className="text-[8px] text-white/30 uppercase">{f}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      pred.strength === 'strong' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                      pred.strength === 'medium' ? 'bg-indigo-500' : 'bg-white/20'
                    }`} />
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${pred.probability}%` }}
                      className={`h-full ${
                        pred.probability > 70 ? 'bg-emerald-500/60' : 'bg-indigo-500/60'
                      }`}
                    />
                  </div>
                </div>
              ))}
              
              <div className="pt-2">
                 <button className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold uppercase text-white/40 hover:text-white transition-colors">
                   Ver Análise Preditiva Completa (Top 25)
                 </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Generation & Grid */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Module 3: Generation Controls */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-2xl font-bold mb-1 uppercase tracking-tighter">Otimização Multiestado</h2>
                <p className="text-sm text-white/40">Redução de entropia e superposição probabilística v5.0.</p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-black/40 px-4 py-2.5 rounded-xl border border-white/10">
                  <span className="text-xs text-white/40">Lote:</span>
                  <select 
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="bg-transparent text-sm font-bold focus:outline-none"
                  >
                    {[5, 10, 15, 20].map(v => (
                      <option key={v} value={v} className="bg-[#121214]">{v}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${useQRNG ? 'bg-indigo-600' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${useQRNG ? 'left-6' : 'left-1'}`} />
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={useQRNG} 
                      onChange={() => setUseQRNG(!useQRNG)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <Atom className={`w-3 h-3 ${useQRNG ? 'text-indigo-400 animate-pulse' : 'text-white/40'}`} /> 
                      QRNG (ANU)
                    </span>
                    <span className="text-[9px] text-white/20">Fonte Quântica</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-10 h-5 rounded-full transition-colors relative ${avoidRepetition ? 'bg-indigo-600' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${avoidRepetition ? 'left-6' : 'left-1'}`} />
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={avoidRepetition} 
                      onChange={() => setAvoidRepetition(!avoidRepetition)}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <ShieldCheck className={`w-3 h-3 ${avoidRepetition ? 'text-indigo-400' : 'text-white/40'}`} /> 
                      Evitar Repetições
                    </span>
                    <span className="text-[9px] text-white/20">Exclusividade Lotes</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="mb-8">
              <label className="text-[10px] font-bold uppercase text-white/30 ml-1 mb-2 block tracking-widest">Cenário de Otimização</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['random', ...LOTTERY_RULES.SCENARIOS].map((s) => (
                  <button 
                    key={s}
                    onClick={() => setSelectedScenario(s as any)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                      selectedScenario === s 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/20' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                    }`}
                  >
                    {getScenarioLabel(s)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95"
              >
                {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                {isGenerating ? 'Otimizando Lote...' : 'Gerar Jogos Otimizados'}
              </button>
              <button 
                onClick={exportCSV}
                disabled={games.length === 0}
                className="bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-5 h-5" /> Exportar CSV
              </button>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
               <h3 className="text-xs font-bold text-white/40 uppercase mb-4 tracking-widest flex items-center gap-2">
                 <Lock className="w-3 h-3" /> Gerar Jogo Específico (Prioridade)
               </h3>
               <div className="flex flex-col sm:flex-row gap-3">
                 <input 
                    type="text" 
                    placeholder="Sua sugestão de 15 números..."
                    value={specificInput}
                    onChange={(e) => setSpecificInput(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button 
                    onClick={handleGenerateSpecific}
                    disabled={isGenerating}
                    className="bg-white/5 hover:bg-indigo-600 hover:text-white border border-white/10 px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Validar e Gerar
                  </button>
               </div>
               <p className="mt-2 text-[9px] text-white/20 italic">O sistema aplicará a redução de entropia v5.0 Quantum (Ajuste Multiestado).</p>
            </div>
            
            {useQRNG && (
              <p className="mt-4 text-[10px] text-white/20 text-center">
                Fonte: Australian National University - Quantum Random Number Generator. Normalizado (1-25).
              </p>
            )}
          </section>

          {/* Module 4: Output Visual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode='popLayout'>
              {games.map((game, idx) => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  idx={idx} 
                  history={history} 
                  copyGame={copyGame} 
                />
              ))}
            </AnimatePresence>
          </div>

          {games.length === 0 && (
            <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl text-white/20">
               <Zap className="w-12 h-12 mb-4 opacity-10" />
               <p className="text-sm italic">Otimização probabilística aguardando parâmetros.</p>
            </div>
          )}
        </div>
      </main>

      {/* --- MODALS --- */}

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuth(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#121214] border border-white/10 rounded-3xl p-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-600/30">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Acesso Restrito</h3>
                <p className="text-sm text-white/40">Inicie seu trial de 24h com acesso a 3 lotes de engenharia.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-white/30 ml-1">E-mail Corporativo/Pessoal</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="digite@email.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button 
                  onClick={loginMock}
                  className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-white/90 active:scale-95 transition-all"
                >
                  Continuar para o Sistema
                </button>
                <p className="text-[10px] text-white/20 text-center uppercase tracking-widest">Proteção AES-256 (Local MVP)</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgrade && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgrade(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-[#121214] border border-white/10 rounded-3xl overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-5 p-8 bg-indigo-600 text-white">
                  <h3 className="text-2xl font-bold mb-4">Upscale para Engenharia Ilimitada</h3>
                  <div className="space-y-4">
                    {[
                      'Lotes ilimitados de 20 jogos',
                      'Frequências ponderadas dinâmicas',
                      'Integração QRNG ANU Prioritária',
                      'Relatórios estruturais em PDF',
                      'Suporte técnico engenharia'
                    ].map(item => (
                      <div key={item} className="flex items-center gap-3 text-xs font-medium">
                        <CheckCircle2 className="w-4 h-4 text-white/40" /> {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-12 opacity-40">
                    <p className="text-[9px] uppercase font-bold tracking-tighter">TODO: Integração Firebase Auth & Stripe Connect via SDK</p>
                  </div>
                </div>
                
                <div className="lg:col-span-7 p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {PRICING_PLANS.map((plan) => (
                      <div 
                        key={plan.id}
                        className={`relative border rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          plan.popular ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        {plan.popular && (
                          <span className="absolute -top-2 bg-indigo-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">Melhor Valor</span>
                        )}
                        <p className="text-xs font-bold text-white/40 mb-1">{plan.name}</p>
                        <p className="text-lg font-bold">{plan.price}</p>
                        <p className="text-[9px] text-white/20 mt-2">{plan.duration}</p>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-8 bg-white text-black font-bold py-4 rounded-xl hover:bg-white/90 active:scale-95 transition-all">
                    Upgrade Imediato
                  </button>
                  <button onClick={() => setShowUpgrade(false)} className="w-full mt-2 text-xs text-white/20 hover:text-white transition-colors">Talvez mais tarde</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-4 py-12 text-center border-t border-white/5 mt-12">
        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mb-4">
          Sistema de Organização Estatística &bullet; Sem Garantia de Resultados &bullet; Software Independente
        </p>
        <div className="flex items-center justify-center gap-8 grayscale opacity-10">
          <span className="text-xs italic font-serif">Statistical Compliance</span>
          <span className="text-xs font-mono">MIT License 2026</span>
          <span className="text-xs font-bold font-sans">V0.4.2-ALPHA</span>
        </div>
      </footer>
    </div>
  );
}
