import React from 'react';
import { CheckCircle2, Clock, PlayCircle, Edit2 } from 'lucide-react';

export default function TournamentScheduleTab({
  rounds = [],
  selectedRoundFilter = 'all',
  setSelectedRoundFilter,
  onPlayMatch,
  onEditMatch
}) {
  const filteredRounds = rounds.filter(
    r => selectedRoundFilter === 'all' || r.roundNumber === selectedRoundFilter
  );

  return (
    <div className="space-y-3">
      {/* FILTRO GIORNATE */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedRoundFilter('all')}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            selectedRoundFilter === 'all'
              ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-sm font-black'
              : 'bg-emerald-950/60 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/60'
          }`}
        >
          Tutte le Giornate ({rounds.length})
        </button>
        {rounds.map(r => (
          <button
            key={r.roundNumber}
            type="button"
            onClick={() => setSelectedRoundFilter(r.roundNumber)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedRoundFilter === r.roundNumber
                ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-sm font-black'
                : 'bg-emerald-950/60 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/60'
            }`}
          >
            {r.title}
          </button>
        ))}
      </div>

      {/* LISTA MATCH */}
      <div className="space-y-3">
        {filteredRounds.map(round => (
          <div key={round.roundNumber} className="rounded-2xl border border-emerald-700/40 overflow-hidden bg-emerald-950/70 shadow-md">
            <div className="px-3.5 py-2 bg-emerald-900/70 border-b border-emerald-700/50 flex items-center justify-between text-xs font-bold text-amber-300">
              <span>{round.title}</span>
              <span className="text-[10px] text-emerald-300/80 font-normal">
                {round.matches.filter(m => m.status === 'completed').length} / {round.matches.length} conclusi
              </span>
            </div>

            <div className="p-2 sm:p-2.5 divide-y divide-emerald-800/30">
              {round.matches.map(match => {
                const isCompleted = match.status === 'completed';
                const isT1Winner = isCompleted && match.team1Score > match.team2Score;
                const isT2Winner = isCompleted && match.team2Score > match.team1Score;

                return (
                  <div key={match.id} className="py-2.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    
                    {/* INFO MATCH & SQUADRE */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider bg-emerald-900/80 text-emerald-300 border border-emerald-700/40">
                          Tavolo {match.tableNumber || 1}
                        </span>
                        {isCompleted ? (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Completata</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>In attesa</span>
                          </span>
                        )}
                      </div>

                      {/* CONFRONTO SQUADRE */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Squadra 1 */}
                        <div className={`p-2 rounded-xl border ${
                          isT1Winner 
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200' 
                            : 'bg-emerald-900/30 border-emerald-800/40 text-emerald-100'
                        }`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold truncate">{match.team1Name}</span>
                            {isCompleted && (
                              <span className="text-sm font-black text-white">{match.team1Score}</span>
                            )}
                          </div>
                          <div className="text-[10px] text-emerald-400/80 truncate">
                            {(match.team1Players || []).join(' & ')}
                          </div>
                        </div>

                        {/* Squadra 2 */}
                        <div className={`p-2 rounded-xl border ${
                          isT2Winner 
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200' 
                            : 'bg-emerald-900/30 border-emerald-800/40 text-emerald-100'
                        }`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold truncate">{match.team2Name}</span>
                            {isCompleted && (
                              <span className="text-sm font-black text-white">{match.team2Score}</span>
                            )}
                          </div>
                          <div className="text-[10px] text-emerald-400/80 truncate">
                            {(match.team2Players || []).join(' & ')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AZIONI MATCH */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => onPlayMatch(match)}
                        className="px-3 py-1.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 cursor-pointer"
                        title="Carica questo incontro sul foglio segnapunti dell'app"
                      >
                        <PlayCircle className="w-3.5 h-3.5 text-emerald-950" />
                        <span>{isCompleted ? 'Rigioca' : 'Gioca al Tavolo ♠'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditMatch(match)}
                        className="p-1.5 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-700/50 text-xs cursor-pointer"
                        title="Inserisci manualmente il punteggio finale"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-300" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
