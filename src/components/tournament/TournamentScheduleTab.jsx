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

  const teams = useMemo(() => tournament?.teams || [], [tournament?.teams]);

  const { totalMatches, completedMatches, percentComplete } = useMemo(() => {
    const all = rounds.flatMap(r => r.matches || []);
    const completed = all.filter(m => m.status === 'completed').length;
    const total = all.length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { totalMatches: total, completedMatches: completed, percentComplete: percent };
  }, [rounds]);

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
      {/* AVANZAMENTO & CONDIVISIONE */}
      <div className="p-3.5 rounded-2xl club-inset space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs sm:text-sm font-semibold text-white">
            Avanzamento:{' '}
            <strong className="font-mono-num club-text-gold">
              {completedMatches}/{totalMatches}
            </strong>{' '}
            incontri ({percentComplete}%)
          </div>

          <button
            type="button"
            onClick={handleShareSchedule}
            className="min-h-[40px] px-3.5 rounded-xl gold-gradient font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiato' : 'Condividi'}</span>
          </button>
        </div>

        <div className="w-full club-card rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* FILTRI GIORNATA & COPPIA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedRoundFilter('all')}
            className={`min-h-[40px] px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedRoundFilter === 'all'
                ? 'gold-gradient border-amber-300'
                : 'club-btn-secondary club-text-muted hover:text-white'
            }`}
          >
            Tutte ({rounds.length})
          </button>
          {rounds.map(r => (
            <button
              key={r.roundNumber}
              type="button"
              onClick={() => setSelectedRoundFilter(r.roundNumber)}
              className={`min-h-[40px] px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedRoundFilter === r.roundNumber
                  ? 'gold-gradient border-amber-300'
                  : 'club-btn-secondary club-text-muted hover:text-white'
              }`}
            >
              {r.title}
            </button>
          ))}
        </div>

        {teams.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 club-text-gold shrink-0" />
            <select
              value={selectedTeamFilter}
              onChange={(e) => setSelectedTeamFilter(e.target.value)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl club-input text-xs font-semibold cursor-pointer flex-1 sm:flex-initial"
            >
              <option value="all" className="bg-zinc-900 text-white">Tutte le Coppie</option>
              {teams.map(t => (
                <option key={t.id} value={t.id} className="bg-zinc-900 text-white">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* LISTA GIORNATE E INCONTRI */}
      <div className="space-y-3">
        {filteredRounds.length === 0 ? (
          <div className="p-8 text-center club-inset rounded-2xl space-y-2">
            <p className="text-xs club-text-muted m-0">
              Nessun incontro trovato con i filtri selezionati.
            </p>
            {selectedTeamFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedTeamFilter('all')}
                className="min-h-[40px] px-3 text-xs club-text-gold hover:underline font-bold cursor-pointer"
              >
                Mostra tutte le coppie
              </button>
            )}
          </div>
        ) : (
          filteredRounds.map(round => (
            <div key={round.roundNumber} className="rounded-2xl club-inset overflow-hidden">
              <div className="px-4 py-2.5 bg-black/25 border-b club-divider flex items-center justify-between text-xs font-bold">
                <span className="club-text-gold">{round.title}</span>
                <span className="font-mono-num club-text-subtle font-medium">
                  {round.matches.filter(m => m.status === 'completed').length} / {round.matches.length} conclusi
                </span>
              </div>

              <div className="p-3 divide-y club-divider space-y-3">
                {round.matches.map(match => {
                  const isCompleted = match.status === 'completed';
                  const isT1Winner = isCompleted && match.team1Score > match.team2Score;
                  const isT2Winner = isCompleted && match.team2Score > match.team1Score;
                  const fiburVp = (isCompleted && isFibur)
                    ? calculateFiburVictoryPoints(match.team1Score, match.team2Score)
                    : null;

                  return (
                    <div
                      key={match.id}
                      className="pt-3 first:pt-0 flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono-num font-bold club-text-gold">
                          Tavolo {match.tableNumber || 1}
                        </span>
                        {isCompleted ? (
                          <span className="text-emerald-300 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completato</span>
                          </span>
                        ) : (
                          <span className="club-text-subtle font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 club-text-gold" />
                            <span>Da giocare</span>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {/* Coppia 1 */}
                        <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                          isT1Winner ? 'club-card border-amber-400/65' : 'bg-black/20 club-divider'
                        }`}>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-white truncate">
                              {match.team1Name}
                            </div>
                            {match.team1Players && match.team1Players.length > 0 && (
                              <div className="text-[11px] club-text-subtle truncate mt-0.5">
                                {match.team1Players.join(' & ')}
                              </div>
                            )}
                          </div>

                          {isCompleted && (
                            <div className="text-right shrink-0 font-mono-num">
                              <span className="text-base font-bold text-white block leading-tight">
                                {match.team1Score.toLocaleString('it-IT')}
                              </span>
                              {fiburVp && (
                                <span className="text-[11px] font-bold club-text-gold">
                                  {fiburVp.team1Vp} VP
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Coppia 2 */}
                        <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                          isT2Winner ? 'club-card border-amber-400/65' : 'bg-black/20 club-divider'
                        }`}>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-white truncate">
                              {match.team2Name}
                            </div>
                            {match.team2Players && match.team2Players.length > 0 && (
                              <div className="text-[11px] club-text-subtle truncate mt-0.5">
                                {match.team2Players.join(' & ')}
                              </div>
                            )}
                          </div>

                          {isCompleted && (
                            <div className="text-right shrink-0 font-mono-num">
                              <span className="text-base font-bold text-white block leading-tight">
                                {match.team2Score.toLocaleString('it-IT')}
                              </span>
                              {fiburVp && (
                                <span className="text-[11px] font-bold club-text-gold">
                                  {fiburVp.team2Vp} VP
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Azioni Incontro */}
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEditMatch(match)}
                          className="min-h-[42px] px-3 rounded-xl club-btn-secondary club-text-muted hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          title="Inserisci o correggi punteggio finale"
                        >
                          <Edit2 className="w-3.5 h-3.5 club-text-gold" />
                          <span>Punteggio</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onPlayMatch(match)}
                          className="min-h-[42px] px-4 rounded-xl gold-gradient font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>{isCompleted ? 'Rigioca al Tavolo' : 'Gioca al Tavolo'}</span>
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
