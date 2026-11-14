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
    <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-950/90 border border-emerald-700/60 flex flex-wrap items-center justify-between gap-2 text-xs shadow-inner">
      <div className="flex flex-wrap items-center gap-1.5 text-emerald-300">
        <span className="font-black text-white">{currentTeamName}:</span>
        {currentChiusuraPoints > 0 && <span className="text-amber-300 font-bold">Chiusura (+{currentChiusuraPoints})</span>}
        {currentHonorsBurrachi > 0 && <span>• Onori (+{currentHonorsBurrachi})</span>}
        {currentPozzettoPoints !== 0 && (
          <span className="text-rose-400 font-bold">• Pozzetto ({currentPozzettoPoints})</span>
        )}
        <span>
          • Carte ({currentTablePoints} - {currentHandPoints} = <strong className={cardsDiff >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{formattedCardsDiff}</strong>)
        </span>
      </div>
      <div className="font-black text-amber-300 ml-auto text-sm px-2.5 py-0.5 rounded-lg bg-emerald-900 border border-amber-400/40">
        {currentTeamScore >= 0 ? `+${currentTeamScore}` : currentTeamScore} pt
      </div>
    </div>
  );
}
