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
    <div className="p-3.5 rounded-2xl club-inset space-y-2.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-bold club-text-gold uppercase tracking-wider text-[11px]">
          Solitario (Pozzetto da 18)
        </span>
        <span className="text-[11px] club-text-subtle">Regola FIBUR</span>
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
              className={`min-h-[48px] py-2 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                isSelected
                  ? 'gold-gradient font-bold border-amber-300'
                  : 'club-card club-text-muted hover:text-white'
              }`}
            >
              <span className="text-xs font-bold truncate max-w-full">{icon} {team?.name}</span>
              <span className={`text-[10px] ${isSelected ? 'opacity-85 font-semibold' : 'club-text-subtle'}`}>
                {isSelected ? 'Solitario' : 'In Coppia'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="text-xs club-text-muted flex flex-wrap items-center justify-between gap-1 border-t club-divider pt-2">
        <span>
          Coppia: <strong className="text-white">{pairNames}</strong>
        </span>
        <span className="font-mono-num club-text-gold text-[11px] font-semibold">
          {pairRawScore} ÷ 2 = {pairSplitScore} pt cad. (FIBUR mult. 5)
        </span>
      </div>
    </div>
  );
}
