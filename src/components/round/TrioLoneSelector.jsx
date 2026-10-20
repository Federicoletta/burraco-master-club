import React from 'react';

export default function TrioLoneSelector({
  lonePlayer,
  setLonePlayer,
  activeGame,
  pairNames,
  pairRawScore,
  pairSplitScore
}) {
  return (
    <div className="p-3 rounded-xl bg-emerald-950/90 border border-amber-400/50 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <span>👤</span> Chi ha preso il Pozzetto da 18 carte (Solitario)?
        </span>
        <span className="text-[10px] text-emerald-400 font-medium">Regola Ufficiale FIBUR</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { key: 'team1', icon: '♦' },
          { key: 'team2', icon: '♠' },
          { key: 'team3', icon: '♥' },
        ].map(({ key, icon }) => {
          const isSelected = lonePlayer === key;
          const team = activeGame[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setLonePlayer(key)}
              className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs flex flex-col items-center justify-center gap-0.5 ${
                isSelected
                  ? 'gold-gradient text-emerald-950 font-black shadow-md ring-2 ring-amber-300/60 scale-[1.02]'
                  : 'bg-emerald-900/60 border-emerald-700/60 text-emerald-200 hover:text-white hover:bg-emerald-800/60'
              }`}
            >
              <span className="text-xs truncate max-w-full">{icon} {team?.name}</span>
              <span className={`text-[10px] ${isSelected ? 'text-emerald-950 font-extrabold' : 'text-emerald-400'}`}>
                {isSelected ? '★ Solitario' : 'In Coppia'}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-[11px] text-emerald-300/90 flex flex-wrap items-center justify-between gap-1 border-t border-emerald-800/50 pt-1.5">
        <span>
          👥 <strong>Coppia di questa mano:</strong> {pairNames}
        </span>
        <span className="text-amber-300 font-semibold text-[10px]">
          Punti coppia divisi al 50% ({pairRawScore} pt ÷ 2 = {pairSplitScore} pt cad.)
        </span>
      </div>
    </div>
  );
}
