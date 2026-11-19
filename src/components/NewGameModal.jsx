import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Play, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import GameModeSelector from './newgame/GameModeSelector';
import BurracoTableFormation from './newgame/BurracoTableFormation';
import TableSeatAssignmentTray from './newgame/TableSeatAssignmentTray';
import TargetScoreSelector from './newgame/TargetScoreSelector';
import SemipulitoToggle from './newgame/SemipulitoToggle';
import { DEFAULT_TARGET_SCORE, validateTargetScore } from '../constants/burraco';
import { sound } from '../utils/soundEffects';
import { useModalEscape } from '../hooks/useModalEscape';

function NewGameModalContent({
  onClose,
  onStartGame,
  friendsList = [],
  storedPlayers = [],
  hasActiveGame,
  initialSetup = null,
  currentUser = null,
  lastGame = null
}) {
  const [mode, setMode] = useState(() => initialSetup?.mode || 'pairs');
  const [team1Name, setTeam1Name] = useState(() => initialSetup?.team1Name || '');
  const [team2Name, setTeam2Name] = useState(() => initialSetup?.team2Name || '');

  const [p1A, setP1A] = useState(() => initialSetup?.p1A || '');
  const [p1B, setP1B] = useState(() => initialSetup?.p1B || '');
  const [p2A, setP2A] = useState(() => initialSetup?.p2A || '');
  const [p2B, setP2B] = useState(() => initialSetup?.p2B || '');
  const [p3A, setP3A] = useState(() => initialSetup?.p3A || '');

  const [activeSlot, setActiveSlot] = useState('p1A');
  const [showTeamNamesEdit, setShowTeamNamesEdit] = useState(false);

  const [targetScore, setTargetScore] = useState(() => initialSetup?.targetScore || DEFAULT_TARGET_SCORE);
  const [customTarget, setCustomTarget] = useState('');
  const [allowSemipulito, setAllowSemipulito] = useState(() => initialSetup?.allowSemipulito ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetValidation = customTarget.trim() !== ''
    ? validateTargetScore(customTarget)
    : validateTargetScore(targetScore);
  const targetError = customTarget.trim() !== '' ? targetValidation.error : null;

  const handleModeChange = useCallback((nextMode) => {
    setMode(nextMode);
    const validSlots = nextMode === 'pairs'
      ? ['p1A', 'p1B', 'p2A', 'p2B']
      : nextMode === 'singles'
      ? ['p1A', 'p2A']
      : ['p1A', 'p2A', 'p3A'];
    setActiveSlot(prev => (validSlots.includes(prev) ? prev : 'p1A'));
  }, []);

  const handleAdvanceSlot = useCallback((currentSlot) => {
    const slots = mode === 'pairs'
      ? ['p1A', 'p1B', 'p2A', 'p2B']
      : mode === 'singles'
      ? ['p1A', 'p2A']
      : ['p1A', 'p2A', 'p3A'];

    const values = { p1A, p1B, p2A, p2B, p3A };
    const currentIndex = slots.indexOf(currentSlot);

    for (let i = 1; i <= slots.length; i++) {
      const nextKey = slots[(currentIndex + i) % slots.length];
      if (!values[nextKey]?.trim()) {
        setActiveSlot(nextKey);
        return;
      }
    }
    setActiveSlot(slots[(currentIndex + 1) % slots.length]);
  }, [mode, p1A, p1B, p2A, p2B, p3A]);

  const handleUseLastGameFormation = useCallback(() => {
    if (!lastGame) return;
    try { sound.playCardDeal(); } catch {}
    handleModeChange(lastGame.mode || 'pairs');
    setTeam1Name(lastGame.team1?.name || '');
    setTeam2Name(lastGame.team2?.name || '');
    const t1 = lastGame.team1?.players || [];
    const t2 = lastGame.team2?.players || [];
    const t3 = lastGame.team3?.players || [];
    setP1A(t1[0] || '');
    setP1B(t1[1] || '');
    setP2A(t2[0] || '');
    setP2B(t2[1] || '');
    setP3A(t3[0] || '');
    setTargetScore(lastGame.targetScore || DEFAULT_TARGET_SCORE);
    setCustomTarget('');
    setAllowSemipulito(lastGame.allowSemipulito ?? true);
  }, [lastGame, handleModeChange]);

  const t1Players = mode === 'pairs'
    ? [p1A.trim(), p1B.trim()].filter(Boolean)
    : [p1A.trim()].filter(Boolean);

  const t2Players = mode === 'pairs'
    ? [p2A.trim(), p2B.trim()].filter(Boolean)
    : [p2A.trim()].filter(Boolean);

  const t3Players = mode === 'trio'
    ? [p3A.trim()].filter(Boolean)
    : [];

  const defaultT1Name = mode === 'pairs'
    ? (t1Players.length > 0 ? t1Players.join(' & ') : 'Coppia 1')
    : (t1Players.length > 0 ? t1Players[0] : 'Giocatore 1');

  const defaultT2Name = mode === 'pairs'
    ? (t2Players.length > 0 ? t2Players.join(' & ') : 'Coppia 2')
    : (t2Players.length > 0 ? t2Players[0] : 'Giocatore 2');

  const defaultT3Name = t3Players.length > 0 ? t3Players[0] : 'Giocatore 3';

  const finalTeam1Name = team1Name.trim() || defaultT1Name;
  const finalTeam2Name = team2Name.trim() || defaultT2Name;
  const finalTeam3Name = defaultT3Name;

  const handleStart = (e) => {
    e.preventDefault();
    if (!targetValidation.valid) return;
    try { sound.playSuccess(); } catch {}

    const newGame = {
      id: 'game_' + Date.now(),
      createdAt: new Date().toISOString(),
      mode,
      allowSemipulito,
      targetScore: targetValidation.value,
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
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Nuova partita di Burraco"
    >
      <div
        className="relative w-full max-w-6xl club-card-solid rounded-t-3xl sm:rounded-3xl max-h-[94dvh] flex flex-col overflow-hidden club-sheet-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle mobile */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="w-10 h-1 rounded-full bg-white/25" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b club-divider flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center font-display font-bold text-lg shrink-0">
              ♣
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl font-bold text-white m-0 truncate">
                Nuova Partita
              </h2>
              <p className="text-xs club-text-subtle m-0 truncate">
                Disponi i posti al tavolo e imposta il traguardo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-xl club-btn-secondary flex items-center justify-center cursor-pointer shrink-0"
            title="Chiudi"
            aria-label="Chiudi nuova partita"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-4">
          {hasActiveGame && (
            <div className="p-3 rounded-2xl club-inset border border-[var(--accent-gold)] text-xs club-text-gold flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>La partita attualmente aperta verrà salvata automaticamente nello storico.</span>
            </div>
          )}

          {lastGame && !initialSetup && (
            <div className="p-3 rounded-2xl club-inset border club-border flex items-center justify-between gap-3 text-xs">
              <div className="truncate min-w-0">
                <span className="club-text-gold font-bold">Ultima formazione: </span>
                <span className="text-white truncate">
                  {lastGame.team1?.name} vs {lastGame.team2?.name} ({lastGame.targetScore || DEFAULT_TARGET_SCORE} pt)
                </span>
              </div>
              <button
                type="button"
                onClick={handleUseLastGameFormation}
                className="min-h-[40px] px-3.5 rounded-xl gold-gradient font-bold text-xs active:scale-95 cursor-pointer shrink-0"
              >
                Ripeti
              </button>
            </div>
          )}

          <GameModeSelector mode={mode} setMode={handleModeChange} />

          <form onSubmit={handleStart} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
              {/* TAVOLO + TRAY */}
              <div className="lg:col-span-7 space-y-3.5">
                <BurracoTableFormation
                  mode={mode}
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
                  team1Name={team1Name}
                  setTeam1Name={setTeam1Name}
                  team2Name={team2Name}
                  setTeam2Name={setTeam2Name}
                  currentUser={currentUser}
                  activeSlot={activeSlot}
                  onSelectSlot={(slot) => setActiveSlot(slot)}
                />

                <TableSeatAssignmentTray
                  activeSlot={activeSlot}
                  mode={mode}
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
                  storedPlayers={storedPlayers}
                  onAdvanceSlot={handleAdvanceSlot}
                />
              </div>

              {/* IMPOSTAZIONI DESTRA */}
              <div className="lg:col-span-5 space-y-3.5">
                {/* Personalizzazione Nomi Squadre */}
                <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setShowTeamNamesEdit(!showTeamNamesEdit)}
                    className="w-full min-h-[36px] flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 club-text-gold" />
                      <span className="text-xs font-bold text-white">Nomi Squadre Personalizzati</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs club-text-subtle">
                      <span>{showTeamNamesEdit ? 'Chiudi' : 'Opzionale'}</span>
                      {showTeamNamesEdit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {showTeamNamesEdit && (
                    <div className="space-y-2.5 pt-2 border-t club-divider">
                      <div>
                        <label className="text-[11px] uppercase font-bold club-text-gold block mb-1">
                          Nome {mode === 'pairs' ? 'Coppia 1' : 'Giocatore 1'}
                        </label>
                        <input
                          type="text"
                          placeholder={defaultT1Name}
                          value={team1Name}
                          onChange={(e) => setTeam1Name(e.target.value)}
                          className="w-full min-h-[42px] px-3 rounded-xl club-input text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] uppercase font-bold text-sky-300 block mb-1">
                          Nome {mode === 'pairs' ? 'Coppia 2' : 'Giocatore 2'}
                        </label>
                        <input
                          type="text"
                          placeholder={defaultT2Name}
                          value={team2Name}
                          onChange={(e) => setTeam2Name(e.target.value)}
                          className="w-full min-h-[42px] px-3 rounded-xl club-input text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Obiettivo Punti */}
                <div className="p-3.5 rounded-2xl club-inset border club-divider">
                  <TargetScoreSelector
                    targetScore={targetScore}
                    setTargetScore={setTargetScore}
                    customTarget={customTarget}
                    setCustomTarget={setCustomTarget}
                    error={targetError}
                  />
                </div>

                {/* Burraco Semipulito */}
                <SemipulitoToggle
                  allowSemipulito={allowSemipulito}
                  setAllowSemipulito={setAllowSemipulito}
                />

                {/* Riepilogo Partita */}
                <div className="p-3.5 rounded-2xl bg-black/30 border club-border space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider club-text-gold block">
                    Riepilogo Tavolo
                  </span>
                  <div className="flex items-center justify-between text-sm font-bold text-white gap-2">
                    <span className="club-text-gold truncate max-w-[44%]">
                      {finalTeam1Name}
                    </span>
                    <span className="club-text-subtle font-display italic text-xs shrink-0">vs</span>
                    <span className="text-sky-300 truncate max-w-[44%] text-right">
                      {finalTeam2Name}
                    </span>
                  </div>
                  <div className="text-xs club-text-subtle flex items-center justify-between pt-2 border-t club-divider font-mono-num">
                    <span>Traguardo: <strong className="text-white">{customTarget || targetScore} pt</strong></span>
                    <span>Semipulito: <strong className="text-white">{allowSemipulito ? '150 pt' : 'No'}</strong></span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !targetValidation.valid}
                  className={`w-full min-h-[50px] px-4 rounded-2xl gold-gradient font-bold text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isSubmitting || !targetValidation.valid ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{isSubmitting ? 'Preparazione...' : 'Inizia Partita'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function NewGameModal(props) {
  useModalEscape(props.isOpen, props.onClose);

  if (!props.isOpen || typeof document === 'undefined') return null;

  const setupKey = props.initialSetup
    ? `${props.initialSetup.mode || 'pairs'}_${props.initialSetup.team1Name || ''}_${props.initialSetup.team2Name || ''}_${props.initialSetup.p1A || ''}_${props.initialSetup.p2A || ''}_${props.initialSetup.targetScore || DEFAULT_TARGET_SCORE}`
    : 'default';

  return <NewGameModalContent key={setupKey} {...props} />;
}
