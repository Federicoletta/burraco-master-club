import React, { useState, useMemo } from 'react';
import { CheckCircle2, Clock, PlayCircle, Edit2, Share2, Check, Filter } from 'lucide-react';
import { formatScheduleForSharing, calculateFiburVictoryPoints } from '../../utils/tournament';
import { sound } from '../../utils/soundEffects';

export default function TournamentScheduleTab({
  tournament,
  rounds = [],
  selectedRoundFilter = 'all',
  setSelectedRoundFilter,
  onPlayMatch,
  onEditMatch
}) {
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
  const [copied, setCopied] = useState(false);
  const isFibur = tournament?.scoringSystem !== 'classic';

  // Tutte le squadre presenti per il filtro a tendina
  const teams = useMemo(() => {
    return tournament?.teams || [];
  }, [tournament?.teams]);

  // Calcola statistiche avanzamento
  const { totalMatches, completedMatches, percentComplete } = useMemo(() => {
    const all = rounds.flatMap(r => r.matches || []);
    const completed = all.filter(m => m.status === 'completed').length;
    const total = all.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { totalMatches: total, completedMatches: completed, percentComplete: percent };
  }, [rounds]);

  // Match filtrati per giornata e per squadra
  const filteredRounds = useMemo(() => {
    return rounds
      .filter(r => selectedRoundFilter === 'all' || r.roundNumber === selectedRoundFilter)
      .map(r => ({
        ...r,
        matches: (r.matches || []).filter(m => {
          if (selectedTeamFilter === 'all') return true;
          return m.team1Id === selectedTeamFilter || m.team2Id === selectedTeamFilter;
        })
      }))
      .filter(r => r.matches.length > 0);
  }, [rounds, selectedRoundFilter, selectedTeamFilter]);

  const handleShareSchedule = () => {
    if (!tournament) return;
    const text = formatScheduleForSharing(
      tournament, 
      selectedRoundFilter !== 'all' ? selectedRoundFilter : null
    );

    if (navigator.share) {
      navigator.share({
        title: `Calendario ${tournament.name}`,
        text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      sound.playTap();
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="space-y-3.5">
      
      {/* 1. BARRA AVANZAMENTO TORNEO & CONDIVISIONE */}
      <div className="p-3 rounded-2xl felt-card border border-white/10 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Avanzamento Torneo:</span>
              <strong className="text-amber-400">{completedMatches} di {totalMatches} incontri completati</strong>
              <span className="text-[11px] text-white/70">({percentComplete}%)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleShareSchedule}
            className="px-3 py-1.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
            title="Invia il calendario su WhatsApp"
          >
            {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />}
            <span>{copied ? 'Calendario Copiato!' : 'Condividi Calendario'}</span>
          </button>
        </div>

        {/* Barra di Progresso */}
        <div className="w-full bg-black/40 rounded-full h-2.5 p-0.5 border border-white/10 overflow-hidden shadow-inner">
          <div 
            className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-200 h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* 2. FILTRI DOPPI: GIORNATA & COPPIA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {/* Filtro Giornate (Tabs / Pills orizzontali) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedRoundFilter('all')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedRoundFilter === 'all'
                ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-sm font-black'
                : 'bg-black/30 border-white/10 text-white/80 hover:bg-white/10'
            }`}
          >
            Tutte ({rounds.length})
          </button>
          {rounds.map(r => (
            <button
              key={r.roundNumber}
              type="button"
              onClick={() => setSelectedRoundFilter(r.roundNumber)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedRoundFilter === r.roundNumber
                  ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-sm font-black'
                  : 'bg-black/30 border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              {r.title}
            </button>
          ))}
        </div>

        {/* Filtro per Coppia (Dropdown comodo) */}
        {teams.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white font-medium focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all" className="bg-zinc-900 text-white">Tutte le Coppie</option>
              {teams.map(t => (
                <option key={t.id} value={t.id} className="bg-zinc-900 text-white">
                  Solo: {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 3. LISTA MATCH */}
      <div className="space-y-3">
        {filteredRounds.length === 0 ? (
          <div className="p-8 text-center felt-card rounded-2xl border border-white/10 space-y-2">
            <p className="text-xs text-white/70 m-0">
              Nessun incontro trovato con i filtri selezionati.
            </p>
            {selectedTeamFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedTeamFilter('all')}
                className="text-xs text-amber-400 hover:underline font-bold cursor-pointer"
              >
                Mostra tutte le coppie
              </button>
            )}
          </div>
        ) : (
          filteredRounds.map(round => (
            <div key={round.roundNumber} className="rounded-2xl border border-white/10 overflow-hidden felt-card shadow-md">
              <div className="px-3.5 py-2 bg-black/40 border-b border-white/10 flex items-center justify-between text-xs font-bold text-amber-300">
                <span className="flex items-center gap-2">
                  <span>📍 {round.title}</span>
                </span>
                <span className="text-[10px] text-white/70 font-normal">
                  {round.matches.filter(m => m.status === 'completed').length} / {round.matches.length} conclusi
                </span>
              </div>

              <div className="p-2 sm:p-2.5 divide-y divide-white/10">
                {round.matches.map(match => {
                  const isCompleted = match.status === 'completed';
                  const isT1Winner = isCompleted && match.team1Score > match.team2Score;
                  const isT2Winner = isCompleted && match.team2Score > match.team1Score;

                  // Se formula FIBUR, calcola i Victory Points assegnati
                  const fiburVp = (isCompleted && isFibur)
                    ? calculateFiburVictoryPoints(match.team1Score, match.team2Score)
                    : null;

                  return (
                    <div key={match.id} className="py-2.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      
                      {/* INFO MATCH & SQUADRE */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-black/40 text-amber-300 border border-white/10">
                            Tavolo {match.tableNumber || 1}
                          </span>
                          {isCompleted ? (
                            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-amber-400" />
                              <span>Completata</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-white/60 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>In attesa di gioco</span>
                            </span>
                          )}
                        </div>

                        {/* CONFRONTO SQUADRE */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {/* Squadra 1 */}
                          <div className={`p-2 rounded-xl border transition-all ${
                            isT1Winner 
                              ? 'bg-amber-400/20 border-amber-400 text-white shadow-xs' 
                              : 'bg-black/25 border-white/10 text-white/90'
                          }`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold truncate">{match.team1Name}</span>
                              {isCompleted && (
                                <div className="text-right shrink-0">
                                  <span className="text-sm font-black text-white block">
                                    {match.team1Score.toLocaleString('it-IT')}
                                  </span>
                                  {fiburVp && (
                                    <span className="text-[10px] font-black text-amber-400">
                                      {fiburVp.team1Vp} VP
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            {match.team1Players && match.team1Players.length > 0 && (
                              <div className="text-[10px] text-white/70 truncate mt-0.5">
                                {match.team1Players.join(' & ')}
                              </div>
                            )}
                          </div>

                          {/* Squadra 2 */}
                          <div className={`p-2 rounded-xl border transition-all ${
                            isT2Winner 
                              ? 'bg-amber-400/20 border-amber-400 text-white shadow-xs' 
                              : 'bg-black/25 border-white/10 text-white/90'
                          }`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold truncate">{match.team2Name}</span>
                              {isCompleted && (
                                <div className="text-right shrink-0">
                                  <span className="text-sm font-black text-white block">
                                    {match.team2Score.toLocaleString('it-IT')}
                                  </span>
                                  {fiburVp && (
                                    <span className="text-[10px] font-black text-amber-400">
                                      {fiburVp.team2Vp} VP
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            {match.team2Players && match.team2Players.length > 0 && (
                              <div className="text-[10px] text-white/70 truncate mt-0.5">
                                {match.team2Players.join(' & ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* AZIONI MATCH */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => onPlayMatch(match)}
                          className="px-3 py-1.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                          title="Carica questo incontro sul foglio segnapunti dell'app"
                        >
                          <PlayCircle className="w-3.5 h-3.5 text-emerald-950 stroke-[2.5]" />
                          <span>{isCompleted ? 'Rigioca al Tavolo' : 'Gioca al Tavolo ♠'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onEditMatch(match)}
                          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs transition-all cursor-pointer"
                          title="Inserisci o correggi manualmente il punteggio finale"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-300" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
