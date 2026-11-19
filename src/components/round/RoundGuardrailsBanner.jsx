import React from 'react';
import { AlertTriangle, Info, Wrench } from 'lucide-react';
import { sound } from '../../utils/soundEffects';

/**
 * Avvisi regolamentari non bloccanti nel calcolatore guidato,
 * ciascuno con correzione rapida 1-tap quando applicabile.
 */
export default function RoundGuardrailsBanner({ warnings = [], onApplyFix }) {
  if (!Array.isArray(warnings) || warnings.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-2.5 p-2.5 rounded-2xl club-inset border border-[var(--accent-gold)]/45 space-y-2 shrink-0 max-h-32 overflow-y-auto club-modal-scroll"
    >
      {warnings.map((w) => {
        const isWarn = w.severity === 'warning';
        return (
          <div
            key={w.id}
            className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs"
          >
            <div className="flex items-start gap-2 min-w-0 flex-1">
              {isWarn ? (
                <AlertTriangle className="w-4 h-4 club-text-gold shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 club-team2 shrink-0 mt-0.5" />
              )}
              <span className="club-text-primary leading-snug">{w.message}</span>
            </div>

            {w.fixAction && w.fixLabel && typeof onApplyFix === 'function' && (
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  onApplyFix(w.fixAction);
                }}
                className="min-h-[36px] px-3 py-1 rounded-xl club-btn-secondary club-text-gold text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                <Wrench className="w-3.5 h-3.5 shrink-0" />
                <span>{w.fixLabel}</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
