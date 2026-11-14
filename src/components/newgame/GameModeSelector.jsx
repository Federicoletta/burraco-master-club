import React from 'react';
import { Users, User, Triangle } from 'lucide-react';
import { sound } from '../../utils/soundEffects';

export default function GameModeSelector({ mode, setMode }) {
  const handleSelectMode = (newMode) => {
    try { sound.playTap(); } catch {}
    setMode(newMode);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider">
          Modalità di Gioco
        </label>
        <span className="text-[11px] text-amber-300/80 font-semibold">
          {mode === 'pairs' ? '4 Giocatori • 2 Pozzetti' : mode === 'singles' ? '2 Giocatori • Testa a testa' : '3 Giocatori • A rotazione'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        
        {/* A COPPIE (2 vs 2) */}
        <button
          type="button"
          onClick={() => handleSelectMode('pairs')}
          className={`py-2 px-2.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mode === 'pairs'
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/40'
              : 'bg-emerald-950/50 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-600'
          }`}
        >
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
            mode === 'pairs' ? 'gold-gradient text-emerald-950 shadow-xs' : 'bg-emerald-900/80 text-emerald-400'
          }`}>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-center sm:text-left leading-tight">
            <span className="block">A Coppie</span>
            <span className="text-[10px] font-normal text-emerald-400/70 hidden sm:block">2 contro 2</span>
          </div>
        </button>

        {/* SINGOLO (1 vs 1) */}
        <button
          type="button"
          onClick={() => handleSelectMode('singles')}
          className={`py-2 px-2.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mode === 'singles'
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/40'
              : 'bg-emerald-950/50 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-600'
          }`}
        >
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
            mode === 'singles' ? 'gold-gradient text-emerald-950 shadow-xs' : 'bg-emerald-900/80 text-emerald-400'
          }`}>
            <User className="w-4 h-4" />
          </div>
          <div className="text-center sm:text-left leading-tight">
            <span className="block">Singolo</span>
            <span className="text-[10px] font-normal text-emerald-400/70 hidden sm:block">1 contro 1</span>
          </div>
        </button>

        {/* A TRE (1 vs 2) */}
        <button
          type="button"
          onClick={() => handleSelectMode('trio')}
          className={`py-2 px-2.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mode === 'trio'
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/40'
              : 'bg-emerald-950/50 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-600'
          }`}
        >
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
            mode === 'trio' ? 'gold-gradient text-emerald-950 shadow-xs' : 'bg-emerald-900/80 text-emerald-400'
          }`}>
            <Triangle className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="text-center sm:text-left leading-tight">
            <span className="block">A Tre</span>
            <span className="text-[10px] font-normal text-emerald-400/70 hidden sm:block">1 vs 2</span>
          </div>
        </button>

      </div>
    </div>
  );
}
