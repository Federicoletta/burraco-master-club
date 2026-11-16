import React from 'react';

/**
 * Rende compatti gli eventi della smazzata (Chiusura, Burrachi, Pozzetto) senza sovraccarico visivo
 */
export default function RoundEventChips({ details }) {
  if (!details) return null;
  const items = [];

  if (details.chiusura) {
    items.push(
      <span key="chiusura" className="text-amber-300 font-semibold">
        Chiusura
      </span>
    );
  }

  if (details.burracoPulito > 0) {
    items.push(
      <span key="pulito" className="text-emerald-300 font-semibold">
        {details.burracoPulito} {details.burracoPulito === 1 ? 'Pulito' : 'Puliti'}
      </span>
    );
  }

  if (details.burracoSemipulito > 0) {
    items.push(
      <span key="semipulito" className="text-purple-300 font-semibold">
        {details.burracoSemipulito} {details.burracoSemipulito === 1 ? 'Semipulito' : 'Semipuliti'}
      </span>
    );
  }

  if (details.burracoSporco > 0) {
    items.push(
      <span key="sporco" className="club-text-muted font-medium">
        {details.burracoSporco} {details.burracoSporco === 1 ? 'Sporco' : 'Sporchi'}
      </span>
    );
  }

  if (details.pozzetto === 'non_preso') {
    items.push(
      <span key="nopozzetto" className="text-rose-300 font-semibold">
        No pozzetto
      </span>
    );
  } else if (details.pozzetto === 'preso_non_giocato') {
    items.push(
      <span key="pozzettong" className="text-rose-300 font-semibold">
        Pozzetto non giocato
      </span>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[11px] leading-snug">
      {items.map((node, idx) => (
        <React.Fragment key={node.key || idx}>
          {idx > 0 && <span className="club-text-subtle">·</span>}
          {node}
        </React.Fragment>
      ))}
    </div>
  );
}