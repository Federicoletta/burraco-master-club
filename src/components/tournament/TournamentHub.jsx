import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Plus,
  PauseCircle,
  Play,
  Award,
  Calendar,
  Trash2,
  Eye,
  StickyNote,
  Edit3,
  ArrowRight
} from 'lucide-react';
import {
  computeTournamentProgress,
  calculateTournamentStandings
} from '../../utils/tournament';

function formatShortDate(dateStr) {
  if (!dateStr) return null;
  try {
    const parsed = dateStr.length === 10 ? new Date(`${dateStr}T12:00:00`) : new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return dateStr;
    return parsed.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getLeaderSummary(tournament) {
  if (!tournament?.teams?.length) return null;
  const allMatches = (tournament.rounds || []).flatMap(r => r.matches || []);
  const played = allMatches.some(m => m && m.status === 'completed');
  if (!played) return null;
  const standings = calculateTournamentStandings(
    tournament.teams,
    allMatches,
    tournament.scoringSystem || 'fibur'
  );
  if (!standings.length) return null;
  const top = standings[0];
  const unit = tournament.scoringSystem === 'classic' ? 'PT' : 'VP';
  return `${top.name} (${top.tournamentPoints} ${unit})`;
}

export default function TournamentHub({
  activeTournament,
  pausedTournaments = [],
  tournamentsHistory = [],
  onOpenActiveTournament,
  onStartNewTournament,
  onRequestPauseTournament,
  onEditPausedMetadata,
  onResumeTournament,
  onDeletePausedTournament,
  onFinishTournament,
  onViewHistoricalStandings,
  onDeleteHistoricalTournament,
}) {
  const [hubFilter, setHubFilter] = useState('all'); // 'all' | 'open' | 'history'

  const activeProgress = useMemo(
    () => (activeTournament ? computeTournamentProgress(activeTournament) : null),
    [activeTournament]
  );

  const activeLeader = useMemo(
    () => (activeTournament ? getLeaderSummary(activeTournament) : null),
    [activeTournament]
  );

  const openCount = (activeTournament ? 1 : 0) + pausedTournaments.length;
  const showOpenSections = hubFilter === 'all' || hubFilter === 'open';
  const showHistorySection = hubFilter === 'all' || hubFilter === 'history';
  const isCompletelyEmpty = !activeTournament && pausedTournaments.length === 0 && tournamentsHistory.length === 0;

  return (
    <div className="space-y-4 my-3">
      {/* BARRA FILTRI + NUOVO TORNEO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-xl club-tab-bar sm:w-auto">
          <button
            type="button"
            onClick={() => setHubFilter('all')}
            className={`min-h-[40px] px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              hubFilter === 'all' ? 'gold-gradient' : 'club-text-muted hover:text-white'
            }`}
          >
            Tutti ({openCount + tournamentsHistory.length})
          </button>
          <button
            type="button"
            onClick={() => setHubFilter('open')}
            className={`min-h-[40px] px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              hubFilter === 'open' ? 'gold-gradient' : 'club-text-muted hover:text-white'
            }`}
          >
            Aperti ({openCount})
          </button>
          <button
            type="button"
            onClick={() => setHubFilter('history')}
            className={`min-h-[40px] px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              hubFilter === 'history' ? 'gold-gradient' : 'club-text-muted hover:text-white'
            }`}
          >
            Albo d&apos;Oro ({tournamentsHistory.length})
          </button>
        </div>

        <button
          type="button"
          onClick={onStartNewTournament}
          className="min-h-[44px] px-4 rounded-xl gold-gradient font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuovo Torneo</span>
        </button>
      </div>

      {/* STATO VUOTO INIZIALE */}
      {isCompletelyEmpty && (
        <div className="p-6 sm:p-8 rounded-2xl club-inset text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-display text-lg font-bold text-white">
              Organizza il tuo primo Torneo
            </h3>
            <p className="text-xs sm:text-sm club-text-muted leading-relaxed">
              Crea un calendario tutti-contro-tutti con punteggio FIBUR o Classico. Potrai mettere in pausa e riprendere qualsiasi torneo anche nei giorni successivi.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartNewTournament}
            className="min-h-[46px] px-6 rounded-xl gold-gradient font-bold text-sm inline-flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Crea Nuovo Torneo</span>
          </button>
        </div>
      )}

      {/* SEZIONE: IN CORSO */}
      {showOpenSections && activeTournament && activeProgress && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Torneo In Corso
            </h3>
            <span className="text-xs club-text-subtle font-mono-num">
              {activeProgress.completedRounds}/{activeProgress.totalRounds} giornate concluse
            </span>
          </div>

          <div className="p-4 rounded-2xl club-card border-amber-400/55 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-display text-lg font-bold text-white truncate">
                  {activeTournament.name}
                </h4>
                <div className="text-xs club-text-muted flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                  <span>{activeTournament.teams?.length || 0} coppie</span>
                  <span aria-hidden="true">·</span>
                  <span className="club-text-gold font-semibold">
                    {activeTournament.scoringSystem === 'classic' ? 'Classico (3-1-0)' : 'FIBUR VP (20-0)'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num">Obiettivo {activeTournament.targetScore || 2505} pt</span>
                  {activeLeader && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-white font-semibold">In testa: {activeLeader}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Avanzamento incontri */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white font-mono-num">
                  {activeProgress.completedMatches}/{activeProgress.totalMatches} incontri completati ({activeProgress.percentComplete}%)
                </span>
                <span className="club-text-gold font-semibold font-mono-num">
                  {activeProgress.remainingMatches > 0
                    ? `${activeProgress.remainingMatches} ${activeProgress.remainingMatches === 1 ? 'tavolo rimasto' : 'tavoli rimasti'}`
                    : 'Tutti gli incontri conclusi'}
                </span>
              </div>
              <div className="w-full club-inset rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-300"
                  style={{ width: `${activeProgress.percentComplete}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onOpenActiveTournament}
                className="min-h-[44px] px-4 py-2 rounded-xl gold-gradient font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Apri Torneo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onRequestPauseTournament(activeTournament)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl club-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <PauseCircle className="w-4 h-4 club-text-gold" />
                <span>Metti in Pausa</span>
              </button>

              <button
                type="button"
                onClick={() => onFinishTournament(activeTournament.id)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl club-btn-secondary club-text-muted hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer sm:ml-auto"
              >
                <Trophy className="w-3.5 h-3.5 club-text-gold" />
                <span>Concludi</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* SEZIONE: TORNEI IN PAUSA */}
      {showOpenSections && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider club-text-gold flex items-center gap-1.5">
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Tornei in Pausa ({pausedTournaments.length})</span>
            </h3>
            {pausedTournaments.length > 0 && (
              <span className="text-xs club-text-subtle">
                Sincronizzati su Cloud
              </span>
            )}
          </div>

          {pausedTournaments.length === 0 ? (
            !isCompletelyEmpty && (
              <div className="p-4 rounded-2xl club-inset text-xs club-text-subtle">
                Nessun torneo in pausa al momento. Puoi mettere in pausa un torneo per riprenderlo nei giorni successivi o avviarne uno parallelo.
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pausedTournaments.map((t) => {
                const prog = computeTournamentProgress(t);
                const leader = getLeaderSummary(t);
                const pausedDateStr = formatShortDate(t.pausedAt || t.updatedAt || t.createdAt);
                const scheduledResumeStr = formatShortDate(t.resumeDate);

                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-2xl club-inset border club-divider flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-display text-base sm:text-lg font-bold text-white truncate">
                            {t.name}
                          </h4>
                          <div className="text-xs club-text-muted flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            <span>{t.teams?.length || 0} coppie</span>
                            <span aria-hidden="true">·</span>
                            <span className="club-text-gold font-semibold">
                              {t.scoringSystem === 'classic' ? 'Classico 3-1-0' : 'FIBUR VP'}
                            </span>
                            {pausedDateStr && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>In pausa dal {pausedDateStr}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Avanzamento */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono-num">
                          <span className="text-white font-semibold">
                            {prog.completedMatches}/{prog.totalMatches} incontri ({prog.percentComplete}%)
                          </span>
                          <span className="club-text-subtle">
                            {prog.remainingMatches > 0
                              ? `${prog.remainingMatches} ${prog.remainingMatches === 1 ? 'tavolo' : 'tavoli'} · G.${prog.currentRoundNumber}`
                              : 'Pronto da premiare'}
                          </span>
                        </div>
                        <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all"
                            style={{ width: `${prog.percentComplete}%` }}
                          />
                        </div>
                      </div>

                      {leader && (
                        <div className="text-xs club-text-muted">
                          In testa: <strong className="text-white">{leader}</strong>
                        </div>
                      )}

                      {/* Data prevista / Nota promemoria */}
                      {(scheduledResumeStr || t.resumeNote) && (
                        <div className="p-2.5 rounded-xl bg-black/25 border club-divider space-y-1 text-xs">
                          {scheduledResumeStr && (
                            <div className="flex items-center gap-1.5 club-text-gold font-semibold">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              <span>Ripresa prevista: {scheduledResumeStr}</span>
                            </div>
                          )}
                          {t.resumeNote && (
                            <div className="flex items-start gap-1.5 club-text-muted leading-snug">
                              <StickyNote className="w-3.5 h-3.5 club-text-subtle shrink-0 mt-0.5" />
                              <span>{t.resumeNote}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t club-divider">
                      <button
                        type="button"
                        onClick={() => onResumeTournament(t.id)}
                        className="flex-1 min-h-[44px] px-3.5 rounded-xl gold-gradient font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Riprendi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditPausedMetadata(t)}
                        className="min-h-[44px] px-3 rounded-xl club-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        title="Modifica nota o data di ripresa"
                      >
                        <Edit3 className="w-3.5 h-3.5 club-text-gold" />
                        <span>Nota</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeletePausedTournament(t.id)}
                        className="min-w-[44px] min-h-[44px] rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/35 flex items-center justify-center cursor-pointer shrink-0"
                        aria-label={`Elimina ${t.name}`}
                        title="Elimina torneo in pausa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SEZIONE: ALBO D'ORO (CONCLUSI) */}
      {showHistorySection && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider club-text-gold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Albo d&apos;Oro ({tournamentsHistory.length})</span>
            </h3>
          </div>

          {tournamentsHistory.length === 0 ? (
            !isCompletelyEmpty && (
              <div className="p-4 rounded-2xl club-inset text-xs club-text-subtle">
                Nessun torneo concluso in archivio. Quando termini e premi un torneo apparirà qui.
              </div>
            )
          ) : (
            <div className="space-y-2">
              {tournamentsHistory.map((t) => {
                const completedDate = formatShortDate(t.completedAt || t.createdAt) || 'Concluso';
                const winner = getLeaderSummary(t);

                return (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl club-inset border club-divider flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="font-bold text-white text-sm truncate">{t.name}</div>
                      <div className="text-xs club-text-subtle flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>{completedDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>{t.teams?.length || 0} coppie</span>
                        <span aria-hidden="true">·</span>
                        <span className="club-text-gold font-semibold">
                          {t.scoringSystem === 'classic' ? 'Classico 3-1-0' : 'FIBUR VP'}
                        </span>
                        {winner && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-300 font-semibold">Campioni: {winner}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onViewHistoricalStandings(t)}
                        className="min-h-[42px] px-3.5 rounded-xl club-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 club-text-gold" />
                        <span>Classifica</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteHistoricalTournament(t.id)}
                        className="min-w-[42px] min-h-[42px] rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/35 flex items-center justify-center cursor-pointer"
                        aria-label={`Elimina ${t.name}`}
                        title="Elimina dall'archivio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
