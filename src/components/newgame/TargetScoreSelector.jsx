import React from 'react';
import { Target, AlertCircle } from 'lucide-react';
import {
  DEFAULT_TARGET_SCORES,
  MIN_TARGET_SCORE,
  MAX_TARGET_SCORE,
} from '../../constants/burraco';
import { sound } from '../../utils/soundEffects';

export default function TargetScoreSelector({
  targetScore,
  setTargetScore,
  customTarget,
  setCustomTarget,
  error = null,
}) {
  const handleSelectScore = (val) => {
    try { sound.playTap(); } catch {}
    setTargetScore(val);
    setCustomTarget('');
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="custom-target-score-input"
          className="text-xs font-extrabold club-text-muted uppercase tracking-wider flex items-center gap-1.5"
        >
          <Target className="w-4 h-4 club-text-gold" />
          <span>Traguardo Punti</span>
        </label>
        <span className={`font-mono-num text-xs font-bold ${error ? 'club-danger-text' : 'club-text-gold'}`}>
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

      <div className="space-y-1.5">
        <input
          id="custom-target-score-input"
          type="number"
          inputMode="numeric"
          min={MIN_TARGET_SCORE}
          max={MAX_TARGET_SCORE}
          step={1}
          placeholder={`Traguardo personalizzato (${MIN_TARGET_SCORE} - ${MAX_TARGET_SCORE})...`}
          value={customTarget}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'target-score-error' : 'target-score-hint'}
          onChange={(e) => {
            const val = e.target.value;
            setCustomTarget(val);
            const num = Number(val);
            if (val !== '' && Number.isInteger(num) && num >= MIN_TARGET_SCORE && num <= MAX_TARGET_SCORE) {
              setTargetScore(num);
            }
          }}
          className={`w-full min-h-[42px] px-3.5 rounded-xl club-input text-xs sm:text-sm ${
            error ? 'border-rose-500/80 ring-1 ring-rose-500/40' : ''
          }`}
        />

        {error ? (
          <p
            id="target-score-error"
            role="alert"
            className="text-[11px] font-semibold club-danger-text flex items-center gap-1.5 m-0"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : (
          <p id="target-score-hint" className="text-[11px] club-text-subtle m-0">
            Intervallo consentito: {MIN_TARGET_SCORE} – {MAX_TARGET_SCORE.toLocaleString('it-IT')} pt
          </p>
        )}
      </div>
    </div>
  );
}
