import React from 'react';
import { Target } from 'lucide-react';
import { DEFAULT_TARGET_SCORES } from '../../constants/burraco';
import { sound } from '../../utils/soundEffects';

export default function TargetScoreSelector({
  targetScore,
  setTargetScore,
  customTarget,
  setCustomTarget
}) {
  const handleSelectScore = (val) => {
    try { sound.playTap(); } catch {}
    setTargetScore(val);
    setCustomTarget('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          <span>Obiettivo Punti per la Vittoria</span>
        </label>
        <span className="text-[11px] text-amber-300 font-extrabold font-mono">
          {customTarget ? `${customTarget} pt (Personalizzato)` : `${targetScore} pt`}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
        {DEFAULT_TARGET_SCORES.map(item => {
          const isSelected = targetScore === item.value && !customTarget;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => handleSelectScore(item.value)}
              className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/40 font-bold'
                  : 'bg-emerald-950/50 border-emerald-700/40 text-emerald-300/90 hover:bg-emerald-900/40 hover:border-emerald-600'
              }`}
            >
              <span className="text-xs sm:text-sm font-extrabold">{item.value}</span>
              <span className="text-[10px] text-emerald-400/80 font-normal">
                {item.desc || 'pt'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Punteggio Personalizzato */}
      <div className="pt-0.5">
        <input
          type="number"
          placeholder="Oppure inserisci punteggio personalizzato (es. 1500, 3000)..."
          value={customTarget}
          onChange={(e) => {
            const val = e.target.value;
            setCustomTarget(val);
            if (val && Number(val) > 0) {
              setTargetScore(Number(val));
            }
          }}
          className="w-full px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-700/50 text-white text-xs placeholder-emerald-400/40 focus:outline-none focus:border-amber-400"
        />
      </div>
    </div>
  );
}
