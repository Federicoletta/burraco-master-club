import React from 'react';
import { createPortal } from 'react-dom';
import { calculateFiburVictoryPoints } from '../../utils/tournament';
import { useModalEscape } from '../../hooks/useModalEscape';

export default function MatchScoreEditModal({
  editingMatch,
  scoringSystem = 'fibur',
  onClose,
  manualScore1,
  setManualScore1,
  manualScore2,
  setManualScore2,
  onSave
}) {
  useModalEscape(Boolean(editingMatch), onClose);

  if (!editingMatch || typeof document === 'undefined') return null;

  const isFibur = scoringSystem !== 'classic';
  const s1 = Number(manualScore1);
  const s2 = Number(manualScore2);
  const hasScores = !isNaN(s1) && !isNaN(s2) && (manualScore1 !== '' || manualScore2 !== '');
  const vpPreview = hasScores && isFibur ? calculateFiburVictoryPoints(s1, s2) : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Risultato ${editingMatch.team1Name} vs ${editingMatch.team2Name}`}
    >
      <div
        className="w-full max-w-sm club-card-solid rounded-t-3xl sm:rounded-2xl p-5 text-center space-y-4 club-sheet-enter pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full club-handle mx-auto sm:hidden" />

        <div>
          <h3 className="font-display text-base sm:text-lg font-bold club-text-primary">
            {editingMatch.team1Name} vs {editingMatch.team2Name}
          </h3>
          <p className="text-xs club-text-muted mt-0.5">
            Inserisci i punti realizzati nell&apos;incontro
          </p>
        </div>

        <form onSubmit={onSave} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3 text-left">
            <div>
              <label className="text-xs font-bold club-team1 truncate block mb-1">
                {editingMatch.team1Name}
              </label>
              <input
                type="number"
                inputMode="numeric"
                required
                placeholder="0"
                value={manualScore1}
                onChange={(e) => setManualScore1(e.target.value)}
                className="w-full min-h-[48px] text-center text-xl font-mono-num font-bold py-2 rounded-xl club-input"
              />
            </div>
            <div>
              <label className="text-xs font-bold club-team2 truncate block mb-1">
                {editingMatch.team2Name}
              </label>
              <input
                type="number"
                inputMode="numeric"
                required
                placeholder="0"
                value={manualScore2}
                onChange={(e) => setManualScore2(e.target.value)}
                className="w-full min-h-[48px] text-center text-xl font-mono-num font-bold py-2 rounded-xl club-input"
              />
            </div>
          </div>

          {vpPreview && (
            <div className="p-2.5 rounded-xl club-inset text-xs font-mono-num">
              <div className="flex items-center justify-between font-bold">
                <span className="club-team1">{vpPreview.team1Vp} VP</span>
                <span className="text-[11px] club-text-subtle font-sans">
                  Scarto {Math.abs(vpPreview.diff).toLocaleString('it-IT')} pt
                </span>
                <span className="club-team2">{vpPreview.team2Vp} VP</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t club-divider">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] rounded-xl club-btn-secondary text-xs font-semibold cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[44px] rounded-xl gold-gradient font-bold text-xs cursor-pointer active:scale-95"
            >
              Salva Risultato
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
