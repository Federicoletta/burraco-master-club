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
    <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-600/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs shadow-lg">
      
      {/* Lista Voci di Punteggio */}
      <div className="flex flex-wrap items-center gap-1.5 text-emerald-300">
        <span className="font-black text-white px-2 py-0.5 rounded-md bg-emerald-900/80 border border-emerald-700/60">
          {currentTeamName}
        </span>
        
        {currentChiusuraPoints > 0 && (
          <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
            Chiusura +{currentChiusuraPoints}
          </span>
        )}
        
        {currentHonorsBurrachi > 0 && (
          <span className="px-2 py-0.5 rounded-md bg-emerald-900 text-emerald-200 font-bold border border-emerald-700/50">
            Burrachi +{currentHonorsBurrachi}
          </span>
        )}
        
        {currentPozzettoPoints !== 0 && (
          <span className="px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 font-bold border border-rose-800/60">
            Pozzetto {currentPozzettoPoints}
          </span>
        )}
        
        <span className="px-2 py-0.5 rounded-md bg-emerald-900/60 text-emerald-300 font-medium">
          Carte: {currentTablePoints} - {currentHandPoints} = <strong className={cardsDiff >= 0 ? 'text-emerald-300 font-black' : 'text-rose-400 font-black'}>{formattedCardsDiff}</strong>
        </span>
      </div>

      {/* Totale Netto Evidenziato */}
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-emerald-800/40">
        <span className="text-[11px] text-emerald-400/80 font-bold sm:hidden">Totale Squadra:</span>
        <div className={`font-black text-sm sm:text-base px-3 py-1 rounded-xl shadow-md border ${
          currentTeamScore >= 0 
            ? 'gold-gradient text-emerald-950 border-amber-400' 
            : 'bg-rose-950 text-rose-300 border-rose-600/60'
        }`}>
          {currentTeamScore >= 0 ? `+${currentTeamScore}` : currentTeamScore} pt
        </div>
      </div>

    </div>
  );
}
