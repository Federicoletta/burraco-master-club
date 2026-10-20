import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Check } from 'lucide-react';
import GameModeSelector from './newgame/GameModeSelector';
import PlayerRosterInputs from './newgame/PlayerRosterInputs';
import QuickPlayerChips from './newgame/QuickPlayerChips';
import TargetScoreSelector from './newgame/TargetScoreSelector';
import SemipulitoToggle from './newgame/SemipulitoToggle';

export default function NewGameModal({ 
  isOpen, 
  onClose, 
  onStartGame, 
  friendsList = [],
  hasActiveGame,
  initialSetup = null,
  currentUser = null
}) {
  const [mode, setMode] = useState('pairs'); // 'pairs' (2v2) | 'singles' (1v1) | 'trio' (A 3)
  const [team1Name, setTeam1Name] = useState('');
  const [team2Name, setTeam2Name] = useState('');
  
  // Nomi dei giocatori (iniziano completamente vuoti, nessun nome forzato)
  const [p1A, setP1A] = useState('');
  const [p1B, setP1B] = useState('');
  const [p2A, setP2A] = useState('');
  const [p2B, setP2B] = useState('');
  const [p3A, setP3A] = useState('');

  const [targetScore, setTargetScore] = useState(2505);
  const [customTarget, setCustomTarget] = useState('');
  const [allowSemipulito, setAllowSemipulito] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inizializza o resetta i campi ogni volta che si apre il modale
  useEffect(() => {
    setIsSubmitting(false);
    if (isOpen) {
      if (initialSetup) {
        setMode(initialSetup.mode || 'pairs');
        setTeam1Name(initialSetup.team1Name || '');
        setTeam2Name(initialSetup.team2Name || '');
        setP1A(initialSetup.p1A || '');
        setP1B(initialSetup.p1B || '');
        setP2A(initialSetup.p2A || '');
        setP2B(initialSetup.p2B || '');
        setP3A(initialSetup.p3A || '');
        setTargetScore(initialSetup.targetScore || 2505);
        setCustomTarget('');
      } else {
        setMode('pairs');
        setTeam1Name('');
        setTeam2Name('');
        setP1A('');
        setP1B('');
        setP2A('');
        setP2B('');
        setP3A('');
        setTargetScore(2505);
        setCustomTarget('');
      }
    }
  }, [isOpen, initialSetup]);

  const handleQuickSelectPlayer = useCallback((name) => {
    if (!p1A) setP1A(name);
    else if (mode === 'pairs' && !p1B) setP1B(name);
    else if (!p2A) setP2A(name);
    else if (mode === 'pairs' && !p2B) setP2B(name);
    else if (mode === 'trio' && !p3A) setP3A(name);
    else setP1A(name);
  }, [mode, p1A, p1B, p2A, p2B, p3A]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleStart = (e) => {
    e.preventDefault();
    const finalTarget = customTarget ? Number(customTarget) : Number(targetScore);

    // Raccoglie i giocatori inseriti (solo quelli non vuoti)
    const t1Players = mode === 'pairs'
      ? [p1A.trim(), p1B.trim()].filter(Boolean)
      : [p1A.trim()].filter(Boolean);

    const t2Players = mode === 'pairs'
      ? [p2A.trim(), p2B.trim()].filter(Boolean)
      : [p2A.trim()].filter(Boolean);

    const t3Players = mode === 'trio'
      ? [p3A.trim()].filter(Boolean)
      : [];

    // Se l'utente non ha specificato il nome squadra o giocatori, assegna etichette pulite
    const defaultT1Name = mode === 'pairs' ? 'Coppia 1' : 'Giocatore 1';
    const defaultT2Name = mode === 'pairs' ? 'Coppia 2' : 'Giocatore 2';
    const defaultT3Name = 'Giocatore 3';

    const finalTeam1Name = team1Name.trim() || (t1Players.length > 0 ? t1Players.join(' & ') : defaultT1Name);
    const finalTeam2Name = team2Name.trim() || (t2Players.length > 0 ? t2Players.join(' & ') : defaultT2Name);
    const finalTeam3Name = t3Players.length > 0 ? t3Players[0] : defaultT3Name;

    const newGame = {
      id: 'game_' + Date.now(),
      createdAt: new Date().toISOString(),
      mode,
      allowSemipulito,
      targetScore: finalTarget > 0 ? finalTarget : 2505,
      team1: {
        name: finalTeam1Name,
        players: t1Players.length > 0 ? t1Players : [finalTeam1Name],
      },
      team2: {
        name: finalTeam2Name,
        players: t2Players.length > 0 ? t2Players : [finalTeam2Name],
      },
      ...(mode === 'trio' ? {
        team3: {
          name: finalTeam3Name,
          players: t3Players.length > 0 ? t3Players : [finalTeam3Name],
        }
      } : {}),
      rounds: [],
      winner: null,
      isFinished: false,
    };

    setIsSubmitting(true);
    try {
      if (typeof onStartGame === 'function') {
        onStartGame(newGame);
      }
    } catch (err) {
      console.error('Errore avvio nuova partita:', err);
    } finally {
      if (typeof onClose === 'function') {
        onClose();
      }
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg felt-card rounded-2xl border border-amber-500/40 p-5 sm:p-6 my-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3.5 border-b border-emerald-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md">
              ♣
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white m-0">Nuova Partita di Burraco</h2>
              <p className="text-[11px] sm:text-xs text-emerald-300/80 m-0">Configura giocatori, coppie e obiettivo punti</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {hasActiveGame && (
          <div className="my-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Nota: Iniziando una nuova partita, quella in corso verrà archiviata automaticamente nello storico.</span>
          </div>
        )}

        <form onSubmit={handleStart} className="space-y-4 mt-3.5">
          {/* 1. Selettore Modalità */}
          <GameModeSelector mode={mode} setMode={setMode} />

          {/* 2. Selezione Partecipanti */}
          <PlayerRosterInputs
            mode={mode}
            team1Name={team1Name}
            setTeam1Name={setTeam1Name}
            team2Name={team2Name}
            setTeam2Name={setTeam2Name}
            p1A={p1A}
            setP1A={setP1A}
            p1B={p1B}
            setP1B={setP1B}
            p2A={p2A}
            setP2A={setP2A}
            p2B={p2B}
            setP2B={setP2B}
            p3A={p3A}
            setP3A={setP3A}
            currentUser={currentUser}
            friendsList={friendsList}
          />

          {/* 3. Suggerimenti veloci Tu & Amici Burraco Club Google */}
          <QuickPlayerChips
            currentUser={currentUser}
            friendsList={friendsList}
            onSelectPlayer={handleQuickSelectPlayer}
          />

          {/* 4. Punteggio Obiettivo */}
          <TargetScoreSelector
            targetScore={targetScore}
            setTargetScore={setTargetScore}
            customTarget={customTarget}
            setCustomTarget={setCustomTarget}
          />

          {/* 5. Regola Burraco Semipulito */}
          <SemipulitoToggle
            allowSemipulito={allowSemipulito}
            setAllowSemipulito={setAllowSemipulito}
          />

          {/* Pulsanti Azione */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-emerald-700/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-emerald-300 hover:bg-emerald-900/50 text-xs font-bold transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs sm:text-sm shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <Check className="w-4 h-4 text-emerald-950" />
              <span>{isSubmitting ? 'Avvio...' : 'Inizia Partita'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>,
    document.body
  );
}
