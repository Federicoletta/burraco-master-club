import React from 'react';
import PlayerAutocompleteInput from '../PlayerAutocompleteInput';

export default function PlayerRosterInputs({
  mode,
  team1Name,
  setTeam1Name,
  team2Name,
  setTeam2Name,
  p1A,
  setP1A,
  p1B,
  setP1B,
  p2A,
  setP2A,
  p2B,
  setP2B,
  p3A,
  setP3A,
  currentUser,
  friendsList = [],
  availablePlayers = []
}) {
  return (
    <div className={`grid grid-cols-1 ${mode === 'trio' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
      
      {/* SQUADRA / GIOCATORE 1 */}
      <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600/30 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <span>♦</span> {mode === 'pairs' ? 'Squadra / Coppia 1' : 'Giocatore 1'}
          </span>
        </div>

        {mode === 'pairs' && (
          <input
            type="text"
            placeholder="Nome Squadra 1 (opzionale)"
            value={team1Name}
            onChange={(e) => setTeam1Name(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 text-white text-xs placeholder-emerald-400/40 focus:outline-none focus:border-amber-400"
          />
        )}

        <div className="space-y-2">
          <div>
            <label className="text-[11px] text-emerald-300/80 block mb-0.5">
              {mode === 'pairs' ? 'Giocatore A' : 'Nome Partecipante'}
            </label>
            <PlayerAutocompleteInput
              value={p1A}
              onChange={setP1A}
              currentUser={currentUser}
              friendsList={friendsList}
              availablePlayers={availablePlayers}
              alreadySelected={[p1B, p2A, p2B, p3A]}
              className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-sm focus:outline-none focus:border-amber-400"
              placeholder={mode === 'pairs' ? 'Nome Giocatore 1 (opzionale)' : 'Nome Giocatore (opzionale)'}
            />
          </div>

          {mode === 'pairs' && (
            <div>
              <label className="text-[11px] text-emerald-300/80 block mb-0.5">Giocatore B</label>
              <PlayerAutocompleteInput
                value={p1B}
                onChange={setP1B}
                currentUser={currentUser}
                friendsList={friendsList}
                availablePlayers={availablePlayers}
                alreadySelected={[p1A, p2A, p2B, p3A]}
                className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-sm focus:outline-none focus:border-amber-400"
                placeholder="Nome Giocatore 2 (opzionale)"
              />
            </div>
          )}
        </div>
      </div>

      {/* SQUADRA / GIOCATORE 2 */}
      <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600/30 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1">
            <span>♠</span> {mode === 'pairs' ? 'Squadra / Coppia 2' : 'Giocatore 2'}
          </span>
        </div>

        {mode === 'pairs' && (
          <input
            type="text"
            placeholder="Nome Squadra 2 (opzionale)"
            value={team2Name}
            onChange={(e) => setTeam2Name(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/50 border border-emerald-700/50 text-white text-xs placeholder-emerald-400/40 focus:outline-none focus:border-blue-400"
          />
        )}

        <div className="space-y-2">
          <div>
            <label className="text-[11px] text-emerald-300/80 block mb-0.5">
              {mode === 'pairs' ? 'Giocatore A' : 'Nome Partecipante'}
            </label>
            <PlayerAutocompleteInput
              value={p2A}
              onChange={setP2A}
              currentUser={currentUser}
              friendsList={friendsList}
              availablePlayers={availablePlayers}
              alreadySelected={[p1A, p1B, p2B, p3A]}
              className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-sm focus:outline-none focus:border-blue-400"
              placeholder={mode === 'pairs' ? 'Nome Giocatore 1 (opzionale)' : 'Nome Giocatore (opzionale)'}
            />
          </div>

          {mode === 'pairs' && (
            <div>
              <label className="text-[11px] text-emerald-300/80 block mb-0.5">Giocatore B</label>
              <PlayerAutocompleteInput
                value={p2B}
                onChange={setP2B}
                currentUser={currentUser}
                friendsList={friendsList}
                availablePlayers={availablePlayers}
                alreadySelected={[p1A, p1B, p2A, p3A]}
                className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-sm focus:outline-none focus:border-blue-400"
                placeholder="Nome Giocatore 2 (opzionale)"
              />
            </div>
          )}
        </div>
      </div>

      {/* GIOCATORE 3 (Solo in modalità A 3) */}
      {mode === 'trio' && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-600/30 space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1">
              <span>♥</span> Giocatore 3
            </span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-emerald-300/80 block mb-0.5">
                Nome Partecipante
              </label>
              <PlayerAutocompleteInput
                value={p3A}
                onChange={setP3A}
                currentUser={currentUser}
                friendsList={friendsList}
                availablePlayers={availablePlayers}
                alreadySelected={[p1A, p1B, p2A, p2B]}
                className="w-full px-3 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-sm focus:outline-none focus:border-rose-400"
                placeholder="Nome Giocatore (opzionale)"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
