import React from 'react';

export default function SemipulitoToggle({ allowSemipulito, setAllowSemipulito }) {
  return (
    <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-700/40 flex items-center justify-between">
      <div>
        <span className="text-xs font-bold text-white block">Consenti Burraco Semipulito (150 pt)</span>
        <span className="text-[11px] text-emerald-400/80">Sequenza di 7+ carte con una pinella o jolly agli estremi</span>
      </div>
      <button
        type="button"
        onClick={() => setAllowSemipulito(!allowSemipulito)}
        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
          allowSemipulito ? 'bg-amber-400' : 'bg-emerald-900 border border-emerald-700'
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
