import React from 'react';
import { Users, Sparkles } from 'lucide-react';
import { DEFAULT_TARGET_SCORES } from '../../constants/burraco';

export default function TournamentWizard({
  tournamentName,
  setTournamentName,
  targetScore,
  setTargetScore,
  numTeams,
  onNumTeamsChange,
  playersList = [],
  teamsForm = [],
  setTeamsForm,
  activePlayerField,
  setActivePlayerField,
  onAssignPlayer,
  onCreateTournament,
  activeTournament,
  onCancelCreating
}) {
  return (
    <form onSubmit={onCreateTournament} className="overflow-y-auto pr-1 my-3 space-y-4 flex-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
            Nome Torneo
          </label>
          <input
            type="text"
            required
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            placeholder="Es: Torneo d'Autunno"
            className="w-full px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
            Traguardo Punti Partite
          </label>
          <select
            value={targetScore}
            onChange={(e) => setTargetScore(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {DEFAULT_TARGET_SCORES.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SELETTORE NUMERO COPPIE */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
            Numero di Coppie Partecipanti: <strong className="text-amber-400 text-sm">{numTeams}</strong>
          </label>
          <span className="text-[11px] text-emerald-400/80">Minimo 2, consigliato 4 o 6</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[2, 3, 4, 5, 6, 8, 10].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onNumTeamsChange(n)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                numTeams === n
                  ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-md font-black'
                  : 'bg-emerald-950/70 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/60'
              }`}
            >
              {n} Coppie
            </button>
          ))}
        </div>
      </div>

      {/* PARTECIPANTI RECENTI / RUBRICA PER INSERIMENTO RAPIDO */}
      {playersList && playersList.length > 0 && (
        <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-600/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Partecipanti Recenti</span>
            </span>
            <span className="text-[11px] text-emerald-400/80">
              Tocca un nome per inserirlo al volo
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {playersList.map(name => {
              // Controlla se questo partecipante è già assegnato in una delle coppie
              const isAssigned = teamsForm.some(
                t => t.player1.trim() === name.trim() || t.player2.trim() === name.trim()
              );
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onAssignPlayer(name)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                    isAssigned
                      ? 'bg-emerald-900/40 text-emerald-400/60 border-emerald-800/40 opacity-70'
                      : 'bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 hover:text-white border-emerald-600/60 hover:border-amber-400 shadow-sm'
                  }`}
                  title={isAssigned ? `${name} (già inserito)` : `Inserisci ${name}`}
                >
                  <span className="text-amber-400 text-xs font-black">+</span>
                  <span>{name}</span>
                  {isAssigned && <span className="text-[10px] text-emerald-400">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CONFIGURAZIONE FORMAZIONI COPPIE */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
            Composizione delle Coppie
          </label>
          <span className="text-[11px] text-emerald-400/80">
            Compila i giocatori o usa i bottoni rapidi sopra
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[38vh] overflow-y-auto pr-1">
          {teamsForm.map((team, idx) => {
            const isP1Active = activePlayerField.teamIndex === idx && activePlayerField.playerSlot === 1;
            const isP2Active = activePlayerField.teamIndex === idx && activePlayerField.playerSlot === 2;

            return (
              <div key={team.id} className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Coppia #{idx + 1}
                  </span>
                  <input
                    type="text"
                    placeholder={`Nome Coppia ${idx + 1}`}
                    value={team.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTeamsForm(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                    }}
                    className="text-right text-xs bg-transparent border-b border-emerald-700/60 text-white placeholder-emerald-500/50 font-bold focus:outline-none focus:border-amber-400 w-36"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Giocatore 1"
                    value={team.player1}
                    onFocus={() => setActivePlayerField({ teamIndex: idx, playerSlot: 1 })}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTeamsForm(prev => prev.map((item, i) => i === idx ? { ...item, player1: val } : item));
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-white text-xs placeholder-emerald-500/50 focus:outline-none transition-all ${
                      isP1Active
                        ? 'bg-emerald-900 border-2 border-amber-400 ring-2 ring-amber-400/20'
                        : 'bg-emerald-900/60 border border-emerald-700/50'
                    }`}
                    list="tournament-players-datalist"
                  />
                  <input
                    type="text"
                    placeholder="Giocatore 2"
                    value={team.player2}
                    onFocus={() => setActivePlayerField({ teamIndex: idx, playerSlot: 2 })}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTeamsForm(prev => prev.map((item, i) => i === idx ? { ...item, player2: val } : item));
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-white text-xs placeholder-emerald-500/50 focus:outline-none transition-all ${
                      isP2Active
                        ? 'bg-emerald-900 border-2 border-amber-400 ring-2 ring-amber-400/20'
                        : 'bg-emerald-900/60 border border-emerald-700/50'
                    }`}
                    list="tournament-players-datalist"
                  />
                </div>
              </div>
            );
          })}
        </div>
        <datalist id="tournament-players-datalist">
          {playersList.map(p => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </div>

      {/* PULSANTI AZIONE CREAZIONE */}
      <div className="pt-2 flex items-center justify-between gap-3 border-t border-emerald-700/50">
        {activeTournament && (
          <button
            type="button"
            onClick={onCancelCreating}
            className="px-4 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold cursor-pointer"
          >
            Annulla e Torna al Torneo Attivo
          </button>
        )}
        <button
          type="submit"
          className="ml-auto px-6 py-2.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs sm:text-sm shadow-md hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-emerald-950" />
          <span>Genera Torneo & Calendario</span>
        </button>
      </div>
    </form>
  );
}
