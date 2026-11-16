import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Play, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import GameModeSelector from './newgame/GameModeSelector';
import BurracoTableFormation from './newgame/BurracoTableFormation';
import TableSeatAssignmentTray from './newgame/TableSeatAssignmentTray';
import TargetScoreSelector from './newgame/TargetScoreSelector';
import SemipulitoToggle from './newgame/SemipulitoToggle';
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

  // Posti dei giocatori al tavolo
  const [p1A, setP1A] = useState(() => initialSetup?.p1A || ''); // Sud (Tu / Caposquadra Coppia 1)
  const [p1B, setP1B] = useState(() => initialSetup?.p1B || ''); // Nord (Compagno Coppia 1)
  const [p2A, setP2A] = useState(() => initialSetup?.p2A || ''); // Ovest (Avversario 1 Coppia 2)
  const [p2B, setP2B] = useState(() => initialSetup?.p2B || ''); // Est (Avversario 2 Coppia 2)
  const [p3A, setP3A] = useState(() => initialSetup?.p3A || ''); // G3 (per trio)

  const [activeSlot, setActiveSlot] = useState('p1A');
  const [showTeamNamesEdit, setShowTeamNamesEdit] = useState(false);

  const [targetScore, setTargetScore] = useState(() => initialSetup?.targetScore || 2005);
  const [customTarget, setCustomTarget] = useState('');
  const [allowSemipulito, setAllowSemipulito] = useState(() => initialSetup?.allowSemipulito ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleModeChange = useCallback((nextMode) => {
    setMode(nextMode);
    const validSlots = nextMode === 'pairs'
      ? ['p1A', 'p1B', 'p2A', 'p2B']
      : nextMode === 'singles'
      ? ['p1A', 'p2A']
      : ['p1A', 'p2A', 'p3A'];
    setActiveSlot(prev => (validSlots.includes(prev) ? prev : 'p1A'));
  }, []);

  // Avanza automaticamente allo slot successivo libero
  const handleAdvanceSlot = useCallback((currentSlot) => {
    const slots = mode === 'pairs'
      ? ['p1A', 'p1B', 'p2A', 'p2B']
      : mode === 'singles'
      ? ['p1A', 'p2A']
      : ['p1A', 'p2A', 'p3A'];

    const values = { p1A, p1B, p2A, p2B, p3A };
    const currentIndex = slots.indexOf(currentSlot);

    // Cerca il prossimo slot vuoto partendo dal successivo
    for (let i = 1; i <= slots.length; i++) {
      const nextKey = slots[(currentIndex + i) % slots.length];
      if (!values[nextKey]?.trim()) {
        setActiveSlot(nextKey);
        return;
      }
    }
    // Se sono tutti occupati, avanza comunque al prossimo slot in senso orario
    setActiveSlot(slots[(currentIndex + 1) % slots.length]);
  }, [mode, p1A, p1B, p2A, p2B, p3A]);

  // Ripeti formazione dell'ultima partita giocata
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
    setTargetScore(lastGame.targetScore || 2005);
    setAllowSemipulito(lastGame.allowSemipulito ?? true);
  }, [lastGame, handleModeChange]);

  // Calcolo nomi ed etichette dinamiche
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
    try { sound.playSuccess(); } catch {}

    const finalTarget = customTarget ? Number(customTarget) : Number(targetScore);

    const newGame = {
      id: 'game_' + Date.now(),
      createdAt: new Date().toISOString(),
      mode,
      allowSemipulito,
      targetScore: finalTarget > 0 ? finalTarget : 2005,
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Nuova partita di Burraco"
    >
      <div
        className="relative w-full max-w-6xl felt-card rounded-3xl border border-amber-500/40 p-4 sm:p-6 my-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[94vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3.5 border-b border-emerald-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md text-base">
              ♣
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white m-0 tracking-tight">
                Nuova Partita di Burraco
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-300/80 m-0">
                Disponi il tavolo, assegna le coppie e imposta l'obiettivo punti
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avviso Partita in Corso */}
        {hasActiveGame && (
          <div className="my-3 p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Nota: Iniziando una nuova partita, quella in corso verrà archiviata automaticamente nello storico.</span>
          </div>
        )}

        {/* Banner Ripeti Formazione Ultima Partita */}
        {lastGame && !initialSetup && (
          <div className="my-2.5 p-2 sm:p-2.5 rounded-2xl bg-emerald-950/80 border border-amber-400/50 flex items-center justify-between gap-2 text-xs">
            <div className="truncate min-w-0">
              <span className="text-amber-300 font-bold">⚡ Ultima partita: </span>
              <span className="text-white truncate">
                {lastGame.team1?.name} vs {lastGame.team2?.name} ({lastGame.targetScore || 2005} pt)
              </span>
            </div>
            <button
              type="button"
              onClick={handleUseLastGameFormation}
              className="px-3 py-1.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs shadow-sm hover:brightness-110 active:scale-95 cursor-pointer shrink-0 transition-transform"
            >
              Usa Formazione
            </button>
          </div>
        )}

        {/* Selettore Modalità di Gioco in alto */}
        <div className="mt-3.5 mb-4">
          <GameModeSelector mode={mode} setMode={handleModeChange} />
        </div>

        <form onSubmit={handleStart} className="space-y-4">
          
          {/* GRIGLIA PRINCIPALE: TAVOLO VIRTUALE A SINISTRA + IMPOSTAZIONI A DESTRA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
            
            {/* COLONNA SINISTRA: IL TAVOLO DA GIOCO & ASSEGNAZIONE POSTI */}
            <div className="lg:col-span-7 space-y-3">
              
              {/* Tavolo da Gioco Virtuale */}
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

              {/* Barra Digitazione Veloce & Amici del Club */}
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

            {/* COLONNA DESTRA: NOMI SQUADRE, OBIETTIVO PUNTI E AVVIO */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Personalizzazione Nomi Squadre (Opzionale / Espandibile) */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/50 space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowTeamNamesEdit(!showTeamNamesEdit)}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-white">Nomi Squadre Personalizzati</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400/80">
                    <span>{showTeamNamesEdit ? 'Chiudi' : 'Modifica'}</span>
                    {showTeamNamesEdit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {showTeamNamesEdit && (
                  <div className="space-y-2 pt-1 border-t border-emerald-800/40">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-amber-300 block mb-1">
                        Nome {mode === 'pairs' ? 'Coppia 1' : 'Giocatore 1'}
                      </label>
                      <input
                        type="text"
                        placeholder={defaultT1Name}
                        value={team1Name}
                        onChange={(e) => setTeam1Name(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-700/50 text-white text-xs placeholder-emerald-400/40 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-blue-300 block mb-1">
                        Nome {mode === 'pairs' ? 'Coppia 2' : 'Giocatore 2'}
                      </label>
                      <input
                        type="text"
                        placeholder={defaultT2Name}
                        value={team2Name}
                        onChange={(e) => setTeam2Name(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-emerald-900/60 border border-emerald-700/50 text-white text-xs placeholder-emerald-400/40 focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Obiettivo Punti */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/50">
                <TargetScoreSelector
                  targetScore={targetScore}
                  setTargetScore={setTargetScore}
                  customTarget={customTarget}
                  setCustomTarget={setCustomTarget}
                />
              </div>

              {/* Burraco Semipulito */}
              <SemipulitoToggle
                allowSemipulito={allowSemipulito}
                setAllowSemipulito={setAllowSemipulito}
              />

              {/* Card Riepilogo Partita In Tempo Reale */}
              <div className="p-3.5 rounded-2xl bg-black/50 border border-amber-500/30 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 block">
                  Riepilogo Sfida
                </span>
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span className="text-amber-300 truncate max-w-[45%]">
                    {finalTeam1Name}
                  </span>
                  <span className="text-white/60 font-serif italic text-xs">vs</span>
                  <span className="text-blue-300 truncate max-w-[45%] text-right">
                    {finalTeam2Name}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400/80 flex items-center justify-between pt-1 border-t border-emerald-900/60">
                  <span>Traguardo: <strong className="text-white">{customTarget || targetScore} pt</strong></span>
                  <span>Semipulito: <strong className="text-white">{allowSemipulito ? '150 pt (Sì)' : 'No'}</strong></span>
                </div>
              </div>

              {/* Pulsante Avvio Partita */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 px-4 rounded-2xl gold-gradient text-emerald-950 font-black text-sm sm:text-base shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  <Play className="w-5 h-5 fill-emerald-950" />
                  <span>{isSubmitting ? 'Preparazione Tavolo...' : 'Inizia Partita'}</span>
                </button>
              </div>

            </div>

          </div>

        </form>

      </div>
    </div>,
    document.body
  );
}

export default function NewGameModal(props) {
  useModalEscape(props.isOpen, props.onClose);

  if (!props.isOpen || typeof document === 'undefined') return null;

  const setupKey = props.initialSetup
    ? `${props.initialSetup.mode || 'pairs'}_${props.initialSetup.team1Name || ''}_${props.initialSetup.team2Name || ''}_${props.initialSetup.p1A || ''}_${props.initialSetup.p2A || ''}_${props.initialSetup.targetScore || 2005}`
    : 'default';

  return <NewGameModalContent key={setupKey} {...props} />;
}
