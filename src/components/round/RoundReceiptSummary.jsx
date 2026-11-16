import React from 'react';

export default function RoundReceiptSummary({
  currentTeamName,
  currentChiusuraPoints = 0,
  currentHonorsBurrachi = 0,
  currentPozzettoPoints = 0,
  currentTablePoints = 0,
  currentHandPoints = 0,
  currentTeamScore = 0
}) {
  const cardsDiff = currentTablePoints - currentHandPoints;
  const formattedCardsDiff = cardsDiff >= 0 ? `+${cardsDiff}` : `${cardsDiff}`;

  return (
    <div className="p-3.5 rounded-2xl club-inset flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 club-text-muted">
        <span className="font-bold text-white">{currentTeamName}</span>

        {currentChiusuraPoints > 0 && (
          <>
            <span className="club-text-subtle">·</span>
            <span className="text-amber-300 font-semibold font-mono-num">
              Chiusura +{currentChiusuraPoints}
            </span>
          </>
        )}

        {currentHonorsBurrachi > 0 && (
          <>
            <span className="club-text-subtle">·</span>
            <span className="text-emerald-300 font-semibold font-mono-num">
              Burrachi +{currentHonorsBurrachi}
            </span>
          </>
        )}

        {currentPozzettoPoints !== 0 && (
          <>
            <span className="club-text-subtle">·</span>
            <span className="text-rose-300 font-semibold font-mono-num">
              Pozzetto {currentPozzettoPoints}
            </span>
          </>
        )}

        <span className="club-text-subtle">·</span>
        <span className="font-mono-num">
          Carte {currentTablePoints} - {currentHandPoints} ={' '}
          <strong className={cardsDiff >= 0 ? 'text-white' : 'text-rose-300'}>
            {formattedCardsDiff}
          </strong>
        </span>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 club-divider">
        <span className="club-text-subtle font-semibold sm:hidden">Totale squadra</span>
        <div className={`font-mono-num font-bold text-sm sm:text-base px-3 py-1 rounded-xl ${
          currentTeamScore >= 0
            ? 'gold-gradient'
            : 'bg-rose-950/70 text-rose-200 border border-rose-500/40'
        }`}>
          {currentTeamScore >= 0 ? `+${currentTeamScore}` : currentTeamScore} pt
        </div>
      </div>
    </div>
  );
}
