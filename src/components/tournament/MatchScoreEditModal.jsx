import React from 'react';

export default function MatchScoreEditModal({
  editingMatch,
  onClose,
  manualScore1,
  setManualScore1,
  manualScore2,
  setManualScore2,
  onSave
}) {
  if (!editingMatch) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-sm felt-card rounded-2xl border-2 border-amber-400 p-4 shadow-2xl text-center space-y-3">
        <h3 className="text-sm font-bold text-white m-0">
          Punteggio Rapido: {editingMatch.team1Name} vs {editingMatch.team2Name}
        </h3>
        <p className="text-[11px] text-emerald-300/80 m-0">
          Inserisci direttamente i punti realizzati dalle due coppie
        </p>
        <form onSubmit={onSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-left">
            <div>
              <label className="text-[11px] font-bold text-amber-300 truncate block mb-1">
                {editingMatch.team1Name}
              </label>
              <input
                type="number"
                inputMode="numeric"
                required
                placeholder="0"
                value={manualScore1}
                onChange={(e) => setManualScore1(e.target.value)}
                className="w-full text-center text-xl font-black py-2 rounded-xl bg-emerald-900/80 border border-amber-400/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-blue-300 truncate block mb-1">
                {editingMatch.team2Name}
              </label>
              <input
                type="number"
                inputMode="numeric"
                required
                placeholder="0"
                value={manualScore2}
                onChange={(e) => setManualScore2(e.target.value)}
                className="w-full text-center text-xl font-black py-2 rounded-xl bg-emerald-900/80 border border-blue-400/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-800/60">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg gold-gradient text-emerald-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 cursor-pointer"
            >
              Salva Risultato
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
