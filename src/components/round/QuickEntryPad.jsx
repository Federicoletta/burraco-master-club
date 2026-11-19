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
    <div className="my-4 space-y-4">
      <p className="text-xs club-text-muted text-center">
        Inserisci direttamente il punteggio netto finale della smazzata (supporta anche numeri negativi, es. -100).
      </p>
      <div className={`grid grid-cols-1 ${isTrio ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
        <div className="p-4 rounded-2xl club-inset border-[var(--accent-gold)]/40">
          <span className="text-xs font-bold club-team1 uppercase tracking-wider block">
            ♦ {activeGame.team1.name}
          </span>
          <span className="text-xs club-text-subtle block mb-2.5 truncate">
            {(activeGame.team1.players || []).join(' & ')}
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={team1Data.manualScore}
            onChange={(e) => setTeam1Data(p => ({ ...p, manualScore: e.target.value }))}
            placeholder="0"
            className="w-full min-h-[54px] text-center text-3xl font-mono-num font-bold py-2 rounded-xl club-input"
          />
        </div>

        <div className="p-4 rounded-2xl club-inset border-sky-500/40">
          <span className="text-xs font-bold club-team2 uppercase tracking-wider block">
            ♠ {activeGame.team2.name}
          </span>
          <span className="text-xs club-text-subtle block mb-2.5 truncate">
            {(activeGame.team2.players || []).join(' & ')}
          </span>
          <input
            type="number"
            inputMode="numeric"
            value={team2Data.manualScore}
            onChange={(e) => setTeam2Data(p => ({ ...p, manualScore: e.target.value }))}
            placeholder="0"
            className="w-full min-h-[54px] text-center text-3xl font-mono-num font-bold py-2 rounded-xl club-input"
          />
        </div>

        {isTrio && (
          <div className="p-4 rounded-2xl club-inset border-rose-500/40">
            <span className="text-xs font-bold club-team3 uppercase tracking-wider block">
              ♥ {activeGame.team3?.name || 'Giocatore 3'}
            </span>
            <span className="text-xs club-text-subtle block mb-2.5 truncate">
              {(activeGame.team3?.players || []).join(' & ')}
            </span>
            <input
              type="number"
              inputMode="numeric"
              value={team3Data.manualScore}
              onChange={(e) => setTeam3Data(p => ({ ...p, manualScore: e.target.value }))}
              placeholder="0"
              className="w-full min-h-[54px] text-center text-3xl font-mono-num font-bold py-2 rounded-xl club-input"
            />
          </div>
        )}
      </div>
    </div>
  );
}
