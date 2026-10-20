import React from 'react';
import { DEFAULT_TARGET_SCORES } from '../../constants/burraco';

export default function TargetScoreSelector({
  targetScore,
  setTargetScore,
  customTarget,
  setCustomTarget
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
        Punteggio per la Vittoria
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {DEFAULT_TARGET_SCORES.map(item => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setTargetScore(item.value);
              setCustomTarget('');
            }}
            className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
              targetScore === item.value && !customTarget
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm ring-1 ring-amber-400/30'
                : 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/40'
            }`}
          >
            <span className="text-xs sm:text-sm font-bold">{item.value} pt</span>
            {item.desc && (
              <span className="text-[10px] text-emerald-400/80 font-normal">
                {item.desc}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Punteggio Personalizzato */}
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          placeholder="Altro punteggio personalizzato (es. 1500, 3000)"
          value={customTarget}
          onChange={(e) => setCustomTarget(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 text-white text-xs placeholder-emerald-400/40 focus:outline-none focus:border-amber-400"
        />
      </div>
    </div>
  );
}
