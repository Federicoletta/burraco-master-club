import React from 'react';
import { calculateFiburVictoryPoints } from '../../utils/tournament';

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
  if (!editingMatch) return null;

  const isFibur = scoringSystem !== 'classic';
  const s1 = Number(manualScore1);
  const s2 = Number(manualScore2);
  const hasScores = !isNaN(s1) && !isNaN(s2) && (manualScore1 !== '' || manualScore2 !== '');
  const vpPreview = hasScores && isFibur ? calculateFiburVictoryPoints(s1, s2) : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-sm felt-card rounded-2xl border-2 border-amber-400 p-4 shadow-2xl text-center space-y-3 animate-in zoom-in-95 duration-150">
        <h3 className="text-sm font-bold text-white m-0">
          Punteggio: {editingMatch.team1Name} vs {editingMatch.team2Name}
        </h3>
        <p className="text-[11px] text-white/70 m-0">
          Inserisci i punti realizzati dalle due coppie nell'incontro
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
                className="w-full text-center text-xl font-black py-2 rounded-xl bg-black/40 border border-amber-400/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                className="w-full text-center text-xl font-black py-2 rounded-xl bg-black/40 border border-blue-400/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Anteprima Live Victory Points FIBUR */}
          {vpPreview && (
            <div className="p-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white/90">
              <div className="flex items-center justify-between font-bold">
                <span className="text-amber-300">{vpPreview.team1Vp} VP</span>
                <span className="text-[10px] text-white/60">
                  Scarto: {Math.abs(vpPreview.diff).toLocaleString('it-IT')} pt
                </span>
                <span className="text-blue-300">{vpPreview.team2Vp} VP</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer transition-all"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg gold-gradient text-emerald-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 cursor-pointer transition-all"
            >
              Salva Risultato
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
