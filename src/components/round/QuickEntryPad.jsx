import React from 'react';

export default function QuickEntryPad({
  isTrio,
  activeGame,
  team1Data,
  setTeam1Data,
  team2Data,
  setTeam2Data,
  team3Data,
  setTeam3Data
}) {
  return (
    <div className="my-5 space-y-4">
      <p className="text-xs text-emerald-300/90 text-center">
        Inserisci direttamente il punteggio netto calcolato per ciascun partecipante per questa smazzata.
      </p>
      <div className={`grid grid-cols-1 ${isTrio ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3.5`}>
        
        {/* SQUADRA 1 */}
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-amber-500/40">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block mb-0.5">
            ♦ {activeGame.team1.name}
          </span>
          <span className="text-[11px] text-emerald-400 block mb-2">
            {(activeGame.team1.players || []).join(' & ')}
          </span>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              value={team1Data.manualScore}
              onChange={(e) => setTeam1Data(p => ({ ...p, manualScore: e.target.value }))}
              placeholder="0"
              className="w-full text-center text-3xl font-black py-2.5 rounded-xl bg-emerald-900/80 border border-amber-400/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <span className="text-[10px] text-emerald-400/70 block text-center mt-1">
              Supporta anche negativi (-100)
            </span>
          </div>
        </div>

        {/* SQUADRA 2 */}
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-blue-500/40">
          <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block mb-0.5">
            ♠ {activeGame.team2.name}
          </span>
          <span className="text-[11px] text-emerald-400 block mb-2">
            {(activeGame.team2.players || []).join(' & ')}
          </span>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              value={team2Data.manualScore}
              onChange={(e) => setTeam2Data(p => ({ ...p, manualScore: e.target.value }))}
              placeholder="0"
              className="w-full text-center text-3xl font-black py-2.5 rounded-xl bg-emerald-900/80 border border-blue-400/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-[10px] text-emerald-400/70 block text-center mt-1">
              Supporta anche negativi (-100)
            </span>
          </div>
        </div>

        {/* SQUADRA 3 (SE IN MODALITÀ A 3) */}
        {isTrio && (
          <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-rose-500/40">
            <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block mb-0.5">
              ♥ {activeGame.team3?.name || 'Giocatore 3'}
            </span>
            <span className="text-[11px] text-emerald-400 block mb-2">
              {(activeGame.team3?.players || []).join(' & ')}
            </span>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                value={team3Data.manualScore}
                onChange={(e) => setTeam3Data(p => ({ ...p, manualScore: e.target.value }))}
                placeholder="0"
                className="w-full text-center text-3xl font-black py-2.5 rounded-xl bg-emerald-900/80 border border-rose-400/50 text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <span className="text-[10px] text-emerald-400/70 block text-center mt-1">
                Supporta anche negativi (-100)
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
