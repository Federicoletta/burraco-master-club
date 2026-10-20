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
    <div className="p-2 rounded-xl bg-emerald-950/90 border border-emerald-800/80 flex flex-wrap items-center justify-between gap-1 text-[11px]">
      <div className="flex flex-wrap items-center gap-1.5 text-emerald-300/90">
        <span className="font-semibold text-white">{currentTeamName}:</span>
        {currentChiusuraPoints > 0 && <span>Chiusura (+{currentChiusuraPoints})</span>}
        {currentHonorsBurrachi > 0 && <span>• Burrachi (+{currentHonorsBurrachi})</span>}
        {currentPozzettoPoints !== 0 && (
          <span className="text-rose-400">• Pozzetto ({currentPozzettoPoints})</span>
        )}
        <span>
          • Carte ({currentTablePoints} - {currentHandPoints} = {formattedCardsDiff})
        </span>
      </div>
      <div className="font-black text-amber-300 ml-auto">
        TOTALE: {currentTeamScore >= 0 ? `+${currentTeamScore}` : currentTeamScore} pt
      </div>
    </div>
  );
}
