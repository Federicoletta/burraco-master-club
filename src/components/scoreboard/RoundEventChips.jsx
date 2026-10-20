import React from 'react';

/**
 * Componente per renderizzare le pillole/chip degli eventi di gioco (Burrachi, Chiusura, Pozzetto)
 */
export default function RoundEventChips({ details }) {
  if (!details) return null;
  const chips = [];

  if (details.chiusura) {
    chips.push(
      <span key="chiusura" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/35 shadow-sm">
        <span>🌟</span> Chiusura
      </span>
    );
  }

  if (details.burracoPulito > 0) {
    chips.push(
      <span key="pulito" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/35 shadow-sm">
        <span>💎</span> {details.burracoPulito} {details.burracoPulito === 1 ? 'Pulito' : 'Puliti'}
      </span>
    );
  }

  if (details.burracoSemipulito > 0) {
    chips.push(
      <span key="semipulito" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-400/20 text-purple-300 border border-purple-400/35 shadow-sm">
        <span>🃏</span> {details.burracoSemipulito} {details.burracoSemipulito === 1 ? 'Semipulito' : 'Semipuliti'}
      </span>
    );
  }

  if (details.burracoSporco > 0) {
    chips.push(
      <span key="sporco" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/60 text-slate-300 border border-slate-600/40 shadow-sm">
        <span>♠</span> {details.burracoSporco} {details.burracoSporco === 1 ? 'Sporco' : 'Sporchi'}
      </span>
    );
  }

  if (details.pozzetto === 'non_preso') {
    chips.push(
      <span key="nopozzetto" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/35 shadow-sm">
        <span>⚠️</span> No Pozzetto
      </span>
    );
  } else if (details.pozzetto === 'preso_non_giocato') {
    chips.push(
      <span key="pozzettong" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/35 shadow-sm">
        <span>⚠️</span> Pozzetto non giocato
      </span>
    );
  }

  if (chips.length === 0) return null;
  return <div className="flex flex-wrap gap-1.5 mt-1.5">{chips}</div>;
}