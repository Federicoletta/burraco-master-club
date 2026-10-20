import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Trophy, Trash2, Sun, LogOut, Cloud, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { wakeLock } from '../../utils/wakeLock';

export default function ScoreBoardToolbar({
  roundsCount = 0,
  syncStatus = 'synced',
  onEndGame,
  onDeleteLastRound,
  onAddRound,
  onCloseTable,
  onSaveGame,
}) {
  const [wakeLockState, setWakeLockState] = useState({
    enabled: wakeLock.enabled,
    active: wakeLock.active
  });

  const [saveState, setSaveState] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'offline' | 'error'
  const [lastSavedTime, setLastSavedTime] = useState('');
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    return wakeLock.subscribe((state) => {
      setWakeLockState({ ...state });
    });
  }, []);

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

  return (
    <div className="py-2 px-3 rounded-xl felt-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-sm">
      
      {/* Info mano in corso & Schermo attivo & Cloud Sync */}
      <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
        <div className="px-2.5 py-1 rounded-lg bg-black/30 border border-white/10 text-xs font-semibold text-white/90 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span>Mano in corso: <strong className="text-amber-300">#{roundsCount + 1}</strong></span>
          <span className="text-emerald-600">•</span>
          <span className="text-emerald-400/80 font-normal">{roundsCount} {roundsCount === 1 ? 'registrata' : 'registrate'}</span>
        </div>

        {/* Indicatore & Controllo Rapido Blocco Schermo iPad */}
        <button
          type="button"
          onClick={() => wakeLock.toggle()}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
            wakeLockState.enabled
              ? 'bg-amber-400/15 text-amber-300 border-amber-400/35 hover:bg-amber-400/25 shadow-xs'
              : 'bg-emerald-900/40 text-emerald-400/60 border-emerald-800/40 hover:bg-emerald-900/70'
          }`}
          title="Tocca per attivare o disattivare il blocco spegnimento schermo"
        >
          <Sun className={`w-3.5 h-3.5 ${wakeLockState.enabled ? 'text-amber-400' : 'text-emerald-500/50'}`} />
          <span>
            {wakeLockState.enabled ? 'Schermo Attivo' : 'Standby Auto'}
          </span>
        </button>

        {/* Indicatore Stato Sincronizzazione Cloud */}
        <div
          className={`hidden xs:flex px-2 py-1 rounded-lg text-[11px] font-semibold items-center gap-1.5 border transition-all select-none ${
            syncStatus === 'syncing'
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : syncStatus === 'offline'
              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              : 'bg-emerald-900/40 text-emerald-300/80 border-emerald-800/40'
          }`}
          title={
            syncStatus === 'syncing'
              ? 'Sincronizzazione cloud in corso...'
              : syncStatus === 'offline'
              ? 'Dispositivo offline: le smazzate sono salvate in locale'
              : 'Tutte le smazzate sono salvate e sincronizzate nel cloud'
          }
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${
            syncStatus === 'syncing'
              ? 'bg-amber-400 animate-ping'
              : syncStatus === 'offline'
              ? 'bg-rose-400'
              : 'bg-emerald-400'
          }`} />
          <span>{syncStatus === 'syncing' ? 'Sync...' : syncStatus === 'offline' ? 'Offline' : 'Cloud'}</span>
        </div>
      </div>

      {/* Pulsanti Azione (Salva, Chiudi Tavolo, Termina, Annulla, + Aggiungi Mano) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Tasto Dedicato Salva nel Cloud */}
          {onSaveGame && (
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={saveState === 'saving'}
              className={`px-2.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95 border ${
                saveState === 'saving'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 cursor-wait'
                  : saveState === 'saved'
                  ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400 font-bold shadow-md shadow-emerald-950/50'
                  : saveState === 'offline'
                  ? 'bg-amber-500/25 text-amber-200 border-amber-400 font-bold'
                  : saveState === 'error'
                  ? 'bg-rose-500/25 text-rose-200 border-rose-400 font-bold'
                  : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 hover:text-white border-emerald-600/50 hover:border-emerald-400'
              }`}
              title={
                lastSavedTime 
                  ? `Ultimo salvataggio: ${lastSavedTime}. Tocca per salvare adesso nel Cloud.`
                  : 'Tocca per salvare subito la partita nel Cloud'
              }
            >
              {saveState === 'saving' && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>Salvataggio...</span>
                </>
              )}
              {saveState === 'saved' && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 animate-in zoom-in-75" />
                  <span>Salvata nel Cloud!</span>
                </>
              )}
              {saveState === 'offline' && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Salvata in Locale (Offline)</span>
                </>
              )}
              {saveState === 'error' && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-300" />
                  <span>Errore Salvataggio</span>
                </>
              )}
              {saveState === 'idle' && (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Salva</span>
                  {lastSavedTime && (
                    <span className="text-[10px] text-emerald-400/80 font-normal">
                      ({lastSavedTime})
                    </span>
                  )}
                </>
              )}
            </button>
          )}

          {onCloseTable && (
            <button
              type="button"
              onClick={onCloseTable}
              className="px-2.5 py-2 sm:py-1.5 rounded-lg bg-emerald-950/80 hover:bg-rose-950/70 text-emerald-300 hover:text-rose-200 border border-emerald-700/50 hover:border-rose-600/50 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95"
              title="Chiudi questo tavolo di gioco (la partita rimane salvata nell'archivio)"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Chiudi Tavolo</span>
            </button>
          )}

          {roundsCount > 0 && onEndGame && (
            <button
              onClick={onEndGame}
              className="px-2.5 py-2 sm:py-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-800 text-amber-300 border border-emerald-600/40 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm hover:brightness-110 active:scale-95"
              title="Concludi ora la partita e salvala nello storico"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Termina</span>
            </button>
          )}

          {roundsCount > 0 && onDeleteLastRound && (
            <button
              onClick={onDeleteLastRound}
              className="px-2.5 py-2 sm:py-1.5 rounded-lg bg-emerald-900/70 hover:bg-rose-950/70 text-rose-300 border border-rose-800/40 hover:border-rose-600/50 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95"
              title="Annulla ed elimina l'ultima mano registrata"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Annulla</span>
            </button>
          )}
        </div>

        {onAddRound && (
          <button
            onClick={onAddRound}
            className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/30 cursor-pointer active:scale-95 transition-all hover:brightness-110"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuova Mano</span>
          </button>
        )}
      </div>

    </div>
  );
}
