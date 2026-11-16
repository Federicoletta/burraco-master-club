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
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-extrabold club-text-muted uppercase tracking-wider">
          Modalità di Gioco
        </label>
        <span className="text-xs club-text-gold font-semibold">
          {mode === 'pairs' ? '4 Giocatori · 2 Pozzetti' : mode === 'singles' ? '2 Giocatori · Testa a testa' : '3 Giocatori · 1 vs 2'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => handleSelectMode('pairs')}
          className={`min-h-[54px] py-2 px-2.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mode === 'pairs'
              ? 'club-card border-[var(--accent-gold)] text-white ring-1 ring-[var(--accent-ring)]'
              : 'club-inset border-[var(--border-subtle)] club-text-muted hover:bg-white/5'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              mode === 'pairs' ? 'gold-gradient' : 'bg-black/30 club-text-muted'
            }`}
          >
            <Users className="w-4 h-4" />
          </div>
          <div className="text-center sm:text-left leading-tight">
            <span className="block">A Coppie</span>
            <span className="text-[11px] font-normal club-text-subtle hidden sm:block">2 contro 2</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMode('singles')}
          className={`min-h-[54px] py-2 px-2.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mode === 'singles'
              ? 'club-card border-[var(--accent-gold)] text-white ring-1 ring-[var(--accent-ring)]'
              : 'club-inset border-[var(--border-subtle)] club-text-muted hover:bg-white/5'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              mode === 'singles' ? 'gold-gradient' : 'bg-black/30 club-text-muted'
            }`}
          >
            <User className="w-4 h-4" />
          </div>
          <div className="text-center sm:text-left leading-tight">
            <span className="block">Singolo</span>
            <span className="text-[11px] font-normal club-text-subtle hidden sm:block">1 contro 1</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMode('trio')}
          className={`min-h-[54px] py-2 px-2.5 rounded-2xl border flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            mode === 'trio'
              ? 'club-card border-[var(--accent-gold)] text-white ring-1 ring-[var(--accent-ring)]'
              : 'club-inset border-[var(--border-subtle)] club-text-muted hover:bg-white/5'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              mode === 'trio' ? 'gold-gradient' : 'bg-black/30 club-text-muted'
            }`}
          >
            <Triangle className="w-3.5 h-3.5 fill-current" />
          </div>
          <div className="text-center sm:text-left leading-tight">
            <span className="block">A Tre</span>
            <span className="text-[11px] font-normal club-text-subtle hidden sm:block">1 vs 2 FIBUR</span>
          </div>
        </button>
      </div>
    </div>
  );
}
