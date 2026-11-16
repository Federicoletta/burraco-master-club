import React, { useState } from 'react';
import {
  Users,
  User,
  RotateCcw,
  KeyRound,
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

  const [pinInput, setPinInput] = useState('');
  const [isSearchingPin, setIsSearchingPin] = useState(false);

  const lastGame = gamesHistory && gamesHistory.length > 0 ? gamesHistory[0] : null;

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

  const handleQuickLaunchMode = (mode) => {
    try {
      sound.playCardDeal();
    } catch {}

    const myName = currentUser?.displayName || currentUser?.email?.split('@')[0] || storedPlayers[0] || 'Giocatore 1';

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
    <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-5">
      {/* 1. INTESTAZIONE CIRCOLO */}
      <section className="club-card p-5 sm:p-6 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] club-text-gold flex items-center gap-2">
              <span>Salotto del Circolo</span>
              <span className="club-text-subtle">·</span>
              <span className="club-text-muted tracking-widest">♠ ♥ ♦ ♣</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Benvenuto, {playerName}
            </h2>
            <p className="text-xs sm:text-sm club-text-muted max-w-md leading-relaxed">
              Scegli la formula del tavolo per iniziare la smazzata o entra con il codice PIN.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenNewGameModal}
            className="min-h-[44px] px-4 py-2.5 rounded-xl club-btn-secondary font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer shrink-0"
            title="Configura punti personalizzati, nomi o regole speciali"
          >
            <SlidersHorizontal className="w-4 h-4 club-text-gold" />
            <span>Configurazione Avanzata</span>
          </button>
        </div>
      </section>

      {/* 2. LE 3 FORMULE DI GIOCO */}
      <section className="space-y-2.5">
        <div className="flex items-baseline justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider club-text-gold">
            Nuova Partita
          </h3>
          <span className="text-xs club-text-subtle font-medium">
            Traguardo predefinito 2005 pt
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* A Coppie */}
          <button
            type="button"
            onClick={() => handleSelectModeLaunch('pairs')}
            className="club-card p-4 sm:p-5 rounded-2xl border-amber-400/45 hover:border-amber-400/80 text-left transition-all cursor-pointer active:scale-[0.98] group flex sm:flex-col items-center sm:items-stretch justify-between gap-3 sm:min-h-[144px]"
          >
            <div className="flex sm:block items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl gold-gradient flex items-center justify-center sm:mb-3 shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h4 className="font-bold text-white text-base">A Coppie</h4>
                  <span className="text-[11px] font-semibold club-text-gold">Classico</span>
                </div>
                <p className="text-xs club-text-muted mt-0.5">2 contro 2 con pozzetti</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold club-text-gold shrink-0 group-hover:translate-x-0.5 transition-transform">
              <span className="hidden sm:inline">Prepara Tavolo</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Singolo */}
          <button
            type="button"
            onClick={() => handleSelectModeLaunch('singles')}
            className="club-card p-4 sm:p-5 rounded-2xl hover:border-amber-400/50 text-left transition-all cursor-pointer active:scale-[0.98] group flex sm:flex-col items-center sm:items-stretch justify-between gap-3 sm:min-h-[144px]"
          >
            <div className="flex sm:block items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl club-inset club-text-gold flex items-center justify-center sm:mb-3 shrink-0 group-hover:scale-105 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Singolo</h4>
                <p className="text-xs club-text-muted mt-0.5">1 contro 1 testa a testa</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold club-text-muted group-hover:text-amber-300 shrink-0 group-hover:translate-x-0.5 transition-all">
              <span className="hidden sm:inline">Prepara Tavolo</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* A Tre */}
          <button
            type="button"
            onClick={() => handleSelectModeLaunch('trio')}
            className="club-card p-4 sm:p-5 rounded-2xl hover:border-amber-400/50 text-left transition-all cursor-pointer active:scale-[0.98] group flex sm:flex-col items-center sm:items-stretch justify-between gap-3 sm:min-h-[144px]"
          >
            <div className="flex sm:block items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl club-inset club-text-gold flex items-center justify-center sm:mb-3 shrink-0 group-hover:scale-105 transition-transform">
                <span className="text-sm font-bold font-mono-num">3P</span>
              </div>
              <div>
                <h4 className="font-bold text-white text-base">A Tre</h4>
                <p className="text-xs club-text-muted mt-0.5">Rotazione con pozzetto 18</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold club-text-muted group-hover:text-amber-300 shrink-0 group-hover:translate-x-0.5 transition-all">
              <span className="hidden sm:inline">Prepara Tavolo</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </section>

      {/* 3. UNISCITI CON PIN TAVOLO */}
      <section className="club-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl club-inset club-text-gold flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white">Entra in un Tavolo con PIN</h3>
            <p className="text-xs club-text-subtle">
              Inserisci il codice a 6 cifre mostrato sul dispositivo del tavolo
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
            className="flex-1 sm:w-40 min-h-[44px] px-3.5 py-2 rounded-xl club-input text-sm font-mono-num font-bold tracking-wider text-center"
          />
          <button
            type="submit"
            disabled={isSearchingPin || pinInput.trim().length < 4}
            className="min-h-[44px] px-5 py-2 rounded-xl gold-gradient font-bold text-sm active:scale-95 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer transition-all shrink-0"
          >
            {isSearchingPin ? 'Cerca...' : 'Entra'}
          </button>
        </form>
      </section>

      {/* 4. RIVINCITA RAPIDA ULTIMA PARTITA */}
      {lastGame && (
        <section className="club-card p-4 rounded-2xl flex items-center justify-between gap-3 border-amber-400/30">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl club-inset club-text-gold flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider club-text-gold block">
                Ripeti ultima formazione
              </span>
              <p className="text-sm font-semibold text-white truncate">
                {lastGame.team1?.name} vs {lastGame.team2?.name}
                {lastGame.mode === 'trio' && lastGame.team3?.name ? ` vs ${lastGame.team3.name}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickRematch}
            className="min-h-[44px] px-4 py-2 rounded-xl gold-gradient font-bold text-xs sm:text-sm active:scale-95 cursor-pointer shrink-0 transition-transform flex items-center gap-1.5"
          >
            <span>Rivincita</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      )}
    </div>
  );
}
