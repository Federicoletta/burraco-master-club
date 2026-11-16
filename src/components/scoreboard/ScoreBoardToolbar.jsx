import React, { useState, useEffect, useRef } from 'react';
import {
  PlusCircle,
  Trophy,
  Trash2,
  LogOut,
  Cloud,
  CheckCircle2,
  Loader2,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import { useModalEscape } from '../../hooks/useModalEscape';

export default function ScoreBoardToolbar({
  roundsCount = 0,
  onEndGame,
  onDeleteLastRound,
  onAddRound,
  onCloseTable,
  onSaveGame,
}) {
  const [saveState, setSaveState] = useState('idle');
  const [lastSavedTime, setLastSavedTime] = useState('');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const saveTimeoutRef = useRef(null);
  const moreContainerRef = useRef(null);

  useModalEscape(isMoreOpen, () => setIsMoreOpen(false));

  useEffect(() => {
    if (!isMoreOpen) return undefined;
    const handlePointerDown = (e) => {
      if (moreContainerRef.current && !moreContainerRef.current.contains(e.target)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isMoreOpen]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleSaveClick = async () => {
    if (!onSaveGame || saveState === 'saving') return;
    setSaveState('saving');
    try {
      const res = await onSaveGame();
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(timeStr);

      if (res?.success) {
        setSaveState('saved');
      } else if (res?.isOffline) {
        setSaveState('offline');
      } else {
        setSaveState('error');
      }
    } catch {
      setSaveState('error');
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      setSaveState('idle');
    }, 3000);
  };

  const hasOverflowActions = Boolean((roundsCount > 0 && onDeleteLastRound) || onCloseTable);

  return (
    <div className="p-3 rounded-2xl club-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 relative">
      {/* Stato Mano Corrente */}
      <div className="flex items-center justify-between sm:justify-start gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold club-text-muted">Mano in corso:</span>
          <strong className="font-mono-num font-bold club-text-gold text-sm">
            #{roundsCount + 1}
          </strong>
          <span className="club-text-subtle">·</span>
          <span className="club-text-subtle">
            {roundsCount} {roundsCount === 1 ? 'registrata' : 'registrate'}
          </span>
        </div>
      </div>

      {/* Azioni Rapide */}
      <div className="flex items-center justify-between sm:justify-end gap-2">
        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          {onSaveGame && (
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={saveState === 'saving'}
              className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 border ${
                saveState === 'saving'
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/50 cursor-wait'
                  : saveState === 'saved'
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/60'
                    : saveState === 'offline'
                      ? 'bg-amber-500/20 text-amber-200 border-amber-400/60'
                      : saveState === 'error'
                        ? 'bg-rose-500/20 text-rose-200 border-rose-400/60'
                        : 'club-btn-secondary club-text-muted hover:text-white'
              }`}
              title={lastSavedTime ? `Ultimo salvataggio: ${lastSavedTime}` : 'Salva ora nel Cloud'}
            >
              {saveState === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />}
              {saveState === 'saved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
              {saveState === 'offline' && <AlertCircle className="w-3.5 h-3.5 text-amber-300" />}
              {saveState === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-300" />}
              {saveState === 'idle' && <Cloud className="w-3.5 h-3.5 club-text-gold" />}
              <span>
                {saveState === 'saving'
                  ? 'Salvo...'
                  : saveState === 'saved'
                    ? 'Salvata'
                    : saveState === 'offline'
                      ? 'In locale'
                      : saveState === 'error'
                        ? 'Errore'
                        : 'Salva'}
              </span>
            </button>
          )}

          {roundsCount > 0 && onEndGame && (
            <button
              type="button"
              onClick={onEndGame}
              className="min-h-[42px] px-3.5 py-2 rounded-xl club-btn-secondary club-text-gold border-amber-400/40 hover:border-amber-400/75 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              title="Concludi ora la partita e salvala nello storico"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Termina Partita</span>
            </button>
          )}
        </div>

        {/* Desktop: tasti diretti */}
        <div className="hidden sm:flex items-center gap-1.5">
          {roundsCount > 0 && onDeleteLastRound && (
            <button
              type="button"
              onClick={onDeleteLastRound}
              className="min-h-[42px] px-3 py-2 rounded-xl club-inset hover:bg-rose-950/60 text-rose-300 border-rose-500/25 text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Elimina l'ultima mano registrata"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Annulla</span>
            </button>
          )}
          {onCloseTable && (
            <button
              type="button"
              onClick={onCloseTable}
              className="min-h-[42px] px-3 py-2 rounded-xl club-inset hover:bg-rose-950/60 club-text-muted hover:text-rose-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Chiudi questo tavolo (partita salvata in archivio)"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Chiudi</span>
            </button>
          )}
        </div>

        {/* Mobile (< sm): menu compatto "Altro" per azioni secondarie/distruttive */}
        {hasOverflowActions && (
          <div className="relative sm:hidden" ref={moreContainerRef}>
            <button
              type="button"
              onClick={() => setIsMoreOpen(prev => !prev)}
              aria-expanded={isMoreOpen}
              className="min-h-[42px] min-w-[42px] px-2.5 rounded-xl club-btn-secondary club-text-muted flex items-center justify-center cursor-pointer active:scale-95"
              aria-label="Altre opzioni partita"
              title="Altre opzioni partita"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMoreOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-56 rounded-2xl club-card-solid p-1.5 z-40 space-y-1">
                {roundsCount > 0 && onDeleteLastRound && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreOpen(false);
                      onDeleteLastRound();
                    }}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl hover:bg-rose-950/50 text-rose-300 text-xs font-semibold flex items-center gap-2.5 text-left cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>Annulla ultima mano</span>
                  </button>
                )}
                {onCloseTable && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreOpen(false);
                      onCloseTable();
                    }}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl hover:bg-white/5 text-slate-200 text-xs font-semibold flex items-center gap-2.5 text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Chiudi tavolo</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {onAddRound && (
          <button
            type="button"
            onClick={onAddRound}
            className="min-h-[42px] px-4 py-2 rounded-xl gold-gradient font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuova Mano</span>
          </button>
        )}
      </div>
    </div>
  );
}
