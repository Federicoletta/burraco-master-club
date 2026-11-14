import React from 'react';
import { Sparkles } from 'lucide-react';
import { sound } from '../../utils/soundEffects';

export default function SemipulitoToggle({ allowSemipulito, setAllowSemipulito }) {
  const handleToggle = () => {
    try { sound.playTap(); } catch {}
    setAllowSemipulito(!allowSemipulito);
  };

  return (
    <div 
      onClick={handleToggle}
      className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-400/50 transition-all select-none"
    >
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs font-bold text-white block truncate">
            Burraco Semipulito (150 pt)
          </span>
        </div>
        <p className="text-[11px] text-emerald-400/80 leading-tight">
          Consenti 7+ carte con pinella o jolly agli estremi
        </p>
      </div>

      <button
        type="button"
        aria-checked={allowSemipulito}
        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
          allowSemipulito ? 'bg-amber-400 shadow-sm' : 'bg-emerald-900 border border-emerald-700'
        }`}
      >
        <div 
          className={`w-4 h-4 rounded-full bg-emerald-950 transition-transform absolute top-1 ${
            allowSemipulito ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
