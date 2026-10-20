import React from 'react';
import { Users, Sparkles, Award } from 'lucide-react';
import { DEFAULT_TARGET_SCORES } from '../../constants/burraco';

export default function TournamentWizard({
  tournamentName,
  setTournamentName,
  targetScore,
  setTargetScore,
  scoringSystem = 'fibur',
  setScoringSystem,
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
      
      {/* 1. NOME TORNEO & TRAGUARDO PARTITE */}
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
            className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
            Traguardo Punti Partite
          </label>
          <select
            value={targetScore}
            onChange={(e) => setTargetScore(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {DEFAULT_TARGET_SCORES.map(s => (
              <option key={s.value} value={s.value} className="bg-zinc-900 text-white">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. FORMULA E SISTEMA PUNTEGGIO (FIBUR VICTORY POINTS VS CLASSICO) */}
      <div className="p-3 rounded-2xl felt-card border border-amber-500/30 space-y-2">
        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Sistema di Punteggio & Formula di Calcolo</span>
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Opzione 1: FIBUR Ufficiale Victory Points */}
          <button
            type="button"
            onClick={() => setScoringSystem && setScoringSystem('fibur')}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              scoringSystem === 'fibur'
                ? 'bg-amber-400/20 border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                : 'bg-black/25 border-white/10 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <span>🥇 FIBUR Victory Points (20-0)</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-amber-400 text-emerald-950 uppercase">
                Ufficiale
              </span>
            </div>
            <p className="text-[11px] text-white/70 m-0">
              Conversione dello scarto punti in VP da 10-10 a 20-0 secondo la scala federale nazionale FIBUR.
            </p>
          </button>

          {/* Opzione 2: Classico (3-1-0) */}
          <button
            type="button"
            onClick={() => setScoringSystem && setScoringSystem('classic')}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              scoringSystem === 'classic'
                ? 'bg-amber-400/20 border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                : 'bg-black/25 border-white/10 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs font-black text-white">
                ⚽ Classico (3 pt Vittoria, 1 pt Pareggio)
              </span>
            </div>
            <p className="text-[11px] text-white/70 m-0">
              3 punti a chi vince l'incontro, 1 punto per pareggio, 0 per sconfitta.
            </p>
          </button>
        </div>
      </div>

      {/* 3. SELETTORE NUMERO COPPIE */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-white uppercase tracking-wider">
            Numero di Coppie Partecipanti: <strong className="text-amber-400 text-sm">{numTeams}</strong>
          </label>
          <span className="text-[11px] text-white/70">Minimo 2, consigliato 4 o 6</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onNumTeamsChange(n)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                numTeams === n
                  ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-md font-black'
                  : 'bg-black/30 border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              {n} Coppie
            </button>
          ))}
        </div>
      </div>

      {/* 4. PARTECIPANTI RECENTI / RUBRICA PER INSERIMENTO RAPIDO */}
      {playersList && playersList.length > 0 && (
        <div className="p-3 rounded-xl felt-card border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Partecipanti Recenti (Tocca per inserire)</span>
            </span>
            <span className="text-[11px] text-white/70">
              Slot attivo: Coppia #{activePlayerField.teamIndex + 1} Gioc. {activePlayerField.playerSlot}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {playersList.map(name => {
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
                      ? 'bg-white/5 text-white/40 border-white/5 opacity-60'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/15 hover:border-amber-400 shadow-sm'
                  }`}
                  title={isAssigned ? `${name} (già inserito)` : `Inserisci ${name}`}
                >
                  <span className="text-amber-400 text-xs font-black">+</span>
                  <span>{name}</span>
                  {isAssigned && <span className="text-[10px] text-amber-400">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. CONFIGURAZIONE FORMAZIONI COPPIE */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
            Composizione delle Coppie
          </label>
          <span className="text-[11px] text-white/70">
            Tocca uno slot per selezionarlo e riempirlo
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[38vh] overflow-y-auto pr-1">
          {teamsForm.map((team, idx) => {
            const isP1Active = activePlayerField.teamIndex === idx && activePlayerField.playerSlot === 1;
            const isP2Active = activePlayerField.teamIndex === idx && activePlayerField.playerSlot === 2;

            return (
              <div key={team.id} className="p-3 rounded-xl felt-card border border-white/10 space-y-2">
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
                    className="px-2 py-0.5 rounded-lg bg-black/40 border border-white/15 text-xs text-white font-bold w-44 text-right focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Giocatore 1"
                      value={team.player1}
                      onFocus={() => setActivePlayerField({ teamIndex: idx, playerSlot: 1 })}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTeamsForm(prev => prev.map((item, i) => i === idx ? { ...item, player1: val } : item));
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-white focus:outline-none transition-all ${
                        isP1Active
                          ? 'bg-amber-400/20 border-2 border-amber-400 ring-2 ring-amber-400/30'
                          : 'bg-black/30 border border-white/15'
                      }`}
                    />
                    {isP1Active && (
                      <span className="absolute -top-1.5 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Giocatore 2"
                      value={team.player2}
                      onFocus={() => setActivePlayerField({ teamIndex: idx, playerSlot: 2 })}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTeamsForm(prev => prev.map((item, i) => i === idx ? { ...item, player2: val } : item));
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium text-white focus:outline-none transition-all ${
                        isP2Active
                          ? 'bg-amber-400/20 border-2 border-amber-400 ring-2 ring-amber-400/30'
                          : 'bg-black/30 border border-white/15'
                      }`}
                    />
                    {isP2Active && (
                      <span className="absolute -top-1.5 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AZIONI AVVIO TORNEO */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
        {activeTournament && (
          <button
            type="button"
            onClick={onCancelCreating}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Annulla e Torna al Torneo Attivo
          </button>
        )}
        <button
          type="submit"
          className="ml-auto px-6 py-2.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs sm:text-sm shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-emerald-950" />
          <span>Genera Calendario & Avvia Torneo 🏆</span>
        </button>
      </div>

    </form>
  );
}
