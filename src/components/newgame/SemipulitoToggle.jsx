import React from 'react';
import { Sparkles } from 'lucide-react';
import { sound } from '../../utils/soundEffects';

export default function SemipulitoToggle({ allowSemipulito, setAllowSemipulito }) {
  const handleToggle = () => {
    try { sound.playTap(); } catch {}
    setAllowSemipulito(!allowSemipulito);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={allowSemipulito}
      onClick={handleToggle}
      className="w-full min-h-[56px] p-3.5 rounded-2xl club-inset border club-divider flex items-center justify-between gap-3 cursor-pointer hover:border-[var(--border-hairline)] transition-all text-left"
    >
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 club-text-gold shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-white block truncate">
            Burraco Semipulito (150 pt)
          </span>
        </div>
        <p className="text-[11px] club-text-subtle leading-tight m-0">
          Consenti 7+ carte con matta agli estremi
        </p>
      </div>

      <span
        aria-hidden="true"
        className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
          allowSemipulito ? 'bg-[var(--accent-gold)]' : 'bg-black/40 border club-divider'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full bg-[var(--surface-card-solid)] transition-transform absolute top-1 shadow ${
            allowSemipulito ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  );
}
