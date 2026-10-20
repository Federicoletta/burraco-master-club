import React, { useState, useEffect } from 'react';
import { PlusCircle, Trophy, Trash2, Sun } from 'lucide-react';
import { wakeLock } from '../../utils/wakeLock';

export default function ScoreBoardToolbar({
  roundsCount = 0,
  syncStatus = 'synced',
  onEndGame,
  onDeleteLastRound,
  onAddRound,
}) {
  const [wakeLockState, setWakeLockState] = useState({
    enabled: wakeLock.enabled,
    active: wakeLock.active
  });

  useEffect(() => {
    return wakeLock.subscribe((state) => {
      setWakeLockState({ ...state });
    });
  }, []);

  return (
    <div className="py-2 px-3 rounded-xl bg-emerald-950/80 border border-emerald-800/40 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-sm">
      
      {/* Info mano in corso & Schermo attivo & Cloud Sync */}
      <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
        <div className="px-2.5 py-1 rounded-lg bg-emerald-900/60 text-xs font-semibold text-emerald-200 flex items-center gap-1.5">
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

      {/* Pulsanti Azione (Termina, Annulla, + Aggiungi Mano) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {roundsCount > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            {onEndGame && (
              <button
                onClick={onEndGame}
                className="px-2.5 py-2 sm:py-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-800 text-amber-300 border border-emerald-600/40 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm hover:brightness-110 active:scale-95"
                title="Concludi ora la partita e salvala nello storico"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Termina</span>
              </button>
            )}

            {onDeleteLastRound && (
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
        )}

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
