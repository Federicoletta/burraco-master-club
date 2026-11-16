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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-extrabold club-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Target className="w-4 h-4 club-text-gold" />
          <span>Traguardo Punti</span>
        </label>
        <span className="font-mono-num text-xs club-text-gold font-bold">
          {customTarget ? `${customTarget} pt` : `${targetScore} pt`}
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
              className={`min-h-[48px] py-1.5 px-1 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? 'gold-gradient border-[var(--accent-gold)] font-bold'
                  : 'club-btn-secondary club-text-muted'
              }`}
            >
              <span className="font-mono-num text-xs sm:text-sm font-bold">{item.value}</span>
              <span className={`text-[10px] ${isSelected ? 'opacity-80' : 'club-text-subtle'}`}>
                {item.desc || 'pt'}
              </span>
            </button>
          );
        })}
      </div>

      <input
        type="number"
        placeholder="Oppure traguardo personalizzato (es. 1500, 3000)..."
        value={customTarget}
        onChange={(e) => {
          const val = e.target.value;
          setCustomTarget(val);
          if (val && Number(val) > 0) {
            setTargetScore(Number(val));
          }
        }}
        className="w-full min-h-[42px] px-3.5 rounded-xl club-input text-xs sm:text-sm"
      />
    </div>
  );
}
