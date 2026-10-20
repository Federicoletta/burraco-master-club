import React from 'react';
import { Users, User } from 'lucide-react';

export default function GameModeSelector({ mode, setMode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
        Modalità di Gioco
      </label>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setMode('pairs')}
          className={`py-2 px-2 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            mode === 'pairs'
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
              : 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>A Coppie (2v2)</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('trio')}
          className={`py-2 px-2 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            mode === 'trio'
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/30'
              : 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/40'
          }`}
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span>A 3 (1 vs 2)</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('singles')}
          className={`py-2 px-2 rounded-xl border flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            mode === 'singles'
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
              : 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/40'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Singolo (1v1)</span>
        </button>
      </div>
    </div>
  );
}
