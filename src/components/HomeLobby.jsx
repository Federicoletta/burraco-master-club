import React, { useState } from 'react';
import { 
  Users, 
  User, 
  RotateCcw, 
  KeyRound, 
  Sparkles, 
  Play, 
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { sound } from '../utils/soundEffects';
import { findGameByPinOrId } from '../services/firebase';
import { useAlert } from '../context/confirmContextStore';

export default function HomeLobby({
  currentUser,
  storedPlayers = [],
  gamesHistory = [],
  onStartGame,
  onResumeGame,
  onOpenNewGameModal,
}) {
  const customAlert = useAlert();

  // Stato PIN rapido per unirsi al tavolo
  const [pinInput, setPinInput] = useState('');
  const [isSearchingPin, setIsSearchingPin] = useState(false);

  // Ultima partita per rivincita rapida
  const lastGame = gamesHistory && gamesHistory.length > 0 ? gamesHistory[0] : null;

  // Apertura configurazione tavolo con modalità preselezionata
  const handleSelectModeLaunch = (mode) => {
    try {
      sound.playTap();
    } catch {}
    if (typeof onOpenNewGameModal === 'function') {
      onOpenNewGameModal(mode);
    } else {
      handleQuickLaunchMode(mode);
    }
  };

  // Avvio rapido per modalità specifica (fallback)
  const handleQuickLaunchMode = (mode) => {
    try {
      sound.playCardDeal();
    } catch {}

    const myName = currentUser?.displayName || currentUser?.email?.split('@')[0] || storedPlayers[0] || 'Giocatore 1';
    
    // Se ci sono giocatori salvati o amici, costruiamo squadre di default pulite
    let team1 = { name: 'Coppia 1', players: ['Giocatore 1', 'Giocatore 2'] };
    let team2 = { name: 'Coppia 2', players: ['Giocatore 3', 'Giocatore 4'] };
    let team3 = null;

    if (mode === 'singles') {
      const p2 = storedPlayers.find(p => p !== myName) || 'Avversario';
      team1 = { name: myName, players: [myName] };
      team2 = { name: p2, players: [p2] };
    } else if (mode === 'trio') {
      team1 = { name: myName, players: [myName] };
      team2 = { name: storedPlayers[1] || 'Giocatore 2', players: [storedPlayers[1] || 'Giocatore 2'] };
      team3 = { name: storedPlayers[2] || 'Giocatore 3', players: [storedPlayers[2] || 'Giocatore 3'] };
    } else {
      // Coppie (2 vs 2)
      const p1 = myName;
      const p2 = storedPlayers[1] || 'Compagno';
      const p3 = storedPlayers[2] || 'Avversario 1';
      const p4 = storedPlayers[3] || 'Avversario 2';
      team1 = { name: `${p1} & ${p2}`, players: [p1, p2] };
      team2 = { name: `${p3} & ${p4}`, players: [p3, p4] };
    }

    const newGame = {
      id: 'game_' + Date.now(),
      createdAt: new Date().toISOString(),
      mode,
      allowSemipulito: true,
      targetScore: 2005,
      team1,
      team2,
      ...(team3 ? { team3 } : {}),
      rounds: [],
      winner: null,
      isFinished: false,
    };

    onStartGame(newGame);
  };

  // Partecipazione tramite PIN
  const handleJoinByPin = async (e) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (!cleanPin || cleanPin.length < 4) return;

    setIsSearchingPin(true);
    try {
      const found = await findGameByPinOrId(cleanPin);
      if (found && found.id) {
        try {
          sound.playTap();
        } catch {}
        onResumeGame(found);
      } else {
        if (customAlert) {
          customAlert({
            title: 'Tavolo non trovato',
            message: `Nessuna partita attiva trovata con il codice PIN "${cleanPin}". Verifica il codice a 6 cifre mostrato sul telefono dell'organizzatore del tavolo.`,
            variant: 'warning'
          });
        }
      }
    } catch (err) {
      console.warn('Errore ricerca PIN:', err);
      if (customAlert) {
        customAlert({
          title: 'Errore di connessione',
          message: 'Impossibile verificare il PIN. Assicurati di essere connesso a Internet.',
          variant: 'danger'
        });
      }
    } finally {
      setIsSearchingPin(false);
    }
  };

  // Rivincita immediata ultima partita
  const handleQuickRematch = () => {
    if (!lastGame) return;
    try {
      sound.playCardDeal();
    } catch {}

    const rematch = {
      id: 'game_' + Date.now(),
      createdAt: new Date().toISOString(),
      mode: lastGame.mode || 'pairs',
      allowSemipulito: lastGame.allowSemipulito ?? true,
      targetScore: lastGame.targetScore || 2005,
      team1: {
        name: lastGame.team1?.name || 'Coppia 1',
        players: lastGame.team1?.players || []
      },
      team2: {
        name: lastGame.team2?.name || 'Coppia 2',
        players: lastGame.team2?.players || []
      },
      ...(lastGame.mode === 'trio' && lastGame.team3 ? {
        team3: {
          name: lastGame.team3?.name || 'Giocatore 3',
          players: lastGame.team3?.players || []
        }
      } : {}),
      rounds: [],
      winner: null,
      isFinished: false,
    };

    onStartGame(rematch);
  };

  const playerName = currentUser?.displayName?.split(' ')[0] || (storedPlayers.length > 0 ? storedPlayers[0] : 'Giocatore');

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      
      {/* 1. HERO BANNER BENVENUTO CLUB */}
      <div className="felt-card p-5 sm:p-6 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden text-center sm:text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 blur-3xl pointer-events-none rounded-full" />
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Tavolo da Gioco</span>
              <span className="text-amber-400/60">•</span>
              <span className="text-emerald-300 font-mono">♠ ♥ ♦ ♣</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Ciao, {playerName}!
            </h2>
            <p className="text-xs sm:text-sm text-emerald-300/80 max-w-md">
              Scegli la modalità per iniziare una nuova partita o unisciti a un tavolo già aperto.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenNewGameModal}
            className="px-4 py-2.5 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 text-amber-300 font-bold text-xs border border-amber-400/40 shadow-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Configura punti personalizzati, nomi o regole speciali"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>Configura Partita</span>
          </button>
        </div>
      </div>

      {/* 2. LE 3 MODALITÀ DI GIOCO (BIG CARDS TATTILI) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Inizia una Nuova Partita</span>
          </span>
          <span className="text-[11px] text-emerald-400/70 font-semibold">
            Obiettivo 2005 pt
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Modalità 1: Coppie (2 vs 2) - Più usata */}
          <button
            type="button"
            onClick={() => handleSelectModeLaunch('pairs')}
            className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-emerald-900/80 to-emerald-950/90 hover:to-emerald-900 border-2 border-amber-400/60 hover:border-amber-400 shadow-xl text-left transition-all cursor-pointer active:scale-95 group flex flex-col justify-between min-h-[140px] relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-emerald-950 font-black text-[9px] uppercase tracking-wider">
              Classico
            </div>
            <div>
              <div className="w-10 h-10 rounded-2xl gold-gradient text-emerald-950 font-black flex items-center justify-center mb-2.5 shadow-md group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5 text-emerald-950" />
              </div>
              <h3 className="font-black text-white text-base">A Coppie</h3>
              <p className="text-xs text-emerald-300/80 mt-0.5">2 contro 2 con pozzetti</p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-black text-amber-300 group-hover:translate-x-1 transition-transform">
              <span>Configura Tavolo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Modalità 2: Singolo (1 vs 1) */}
          <button
            type="button"
            onClick={() => handleSelectModeLaunch('singles')}
            className="p-4 sm:p-5 rounded-3xl bg-emerald-950/70 hover:bg-emerald-900/60 border border-emerald-600/40 hover:border-amber-400/60 shadow-lg text-left transition-all cursor-pointer active:scale-95 group flex flex-col justify-between min-h-[140px]"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-amber-300 border border-emerald-700/60 font-black flex items-center justify-center mb-2.5 shadow-sm group-hover:scale-105 transition-transform">
                <User className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-black text-white text-base">Singolo</h3>
              <p className="text-xs text-emerald-300/80 mt-0.5">1 contro 1 testa a testa</p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-black text-emerald-300 group-hover:text-amber-300 group-hover:translate-x-1 transition-all">
              <span>Configura Tavolo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Modalità 3: A Tre (Trio a rotazione) */}
          <button
            type="button"
            onClick={() => handleSelectModeLaunch('trio')}
            className="p-4 sm:p-5 rounded-3xl bg-emerald-950/70 hover:bg-emerald-900/60 border border-emerald-600/40 hover:border-amber-400/60 shadow-lg text-left transition-all cursor-pointer active:scale-95 group flex flex-col justify-between min-h-[140px]"
          >
            <div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-amber-300 border border-emerald-700/60 font-black flex items-center justify-center mb-2.5 shadow-sm group-hover:scale-105 transition-transform">
                <span className="text-base font-black font-mono">3P</span>
              </div>
              <h3 className="font-black text-white text-base">A Tre</h3>
              <p className="text-xs text-emerald-300/80 mt-0.5">Trio a rotazione</p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-black text-emerald-300 group-hover:text-amber-300 group-hover:translate-x-1 transition-all">
              <span>Configura Tavolo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

        </div>
      </div>

      {/* 3. PARTECIPAZIONE TAVOLO CON PIN */}
      <div className="felt-card p-4 sm:p-5 rounded-3xl border border-emerald-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3.5">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <span className="p-2.5 rounded-2xl bg-emerald-900/80 text-amber-400 border border-emerald-700/60 shrink-0">
            <KeyRound className="w-5 h-5 text-amber-400" />
          </span>
          <div>
            <h3 className="text-sm font-black text-white">Unisciti con PIN Tavolo</h3>
            <p className="text-xs text-emerald-300/70">
              Inserisci il codice mostrato sul telefono dell'organizzatore:
            </p>
          </div>
        </div>

        <form onSubmit={handleJoinByPin} className="flex gap-2 w-full sm:w-auto shrink-0">
          <input
            type="text"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.toUpperCase())}
            placeholder="PIN (es. 684210)"
            maxLength={10}
            className="flex-1 sm:w-36 px-3.5 py-2.5 rounded-xl bg-emerald-950 border border-emerald-500/50 text-white placeholder-emerald-400/40 text-xs font-mono font-black tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-amber-400/60"
          />
          <button
            type="submit"
            disabled={isSearchingPin || pinInput.trim().length < 4}
            className="px-4 py-2.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shrink-0"
          >
            {isSearchingPin ? 'Cerca...' : 'Entra'}
          </button>
        </form>
      </div>

      {/* 4. RIVINCITA IMMEDIATA DALL'ULTIMA PARTITA (se presente) */}
      {lastGame && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-amber-400/20 text-amber-400 shrink-0">
              <RotateCcw className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                Ultima Partita Giocata
              </span>
              <p className="text-xs font-bold text-white truncate">
                {lastGame.team1?.name} vs {lastGame.team2?.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickRematch}
            className="px-3.5 py-2 rounded-xl gold-gradient text-emerald-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 cursor-pointer shrink-0 transition-transform flex items-center gap-1.5"
          >
            <span>Rivincita</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
