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
  ArrowRight,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Calculator,
  RotateCcw,
  Users
} from 'lucide-react';
import {
  computeTournamentProgress,
  calculateTournamentStandings,
  calculateFiburVictoryPoints,
  FIBUR_VICTORY_POINTS_TABLE
} from '../../utils/tournament';
import { sound } from '../../utils/soundEffects';

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
  // 'all' (Panoramica Dashboard) | 'active' | 'paused' | 'history' | 'rules'
  const [hubTab, setHubTab] = useState('all');

  // Calcolatore scarto punti per la sezione Regolamento FIBUR
  const [testScore1, setTestScore1] = useState('2050');
  const [testScore2, setTestScore2] = useState('1500');

  const activeProgress = useMemo(
    () => (activeTournament ? computeTournamentProgress(activeTournament) : null),
    [activeTournament]
  );

  const activeLeader = useMemo(
    () => (activeTournament ? getLeaderSummary(activeTournament) : null),
    [activeTournament]
  );

  const openCount = (activeTournament ? 1 : 0) + pausedTournaments.length;
  const totalTournamentsCount = openCount + tournamentsHistory.length;
  const hasNoTournaments = !activeTournament && pausedTournaments.length === 0 && tournamentsHistory.length === 0;

  const testVpResult = useMemo(() => {
    const s1 = Number(testScore1) || 0;
    const s2 = Number(testScore2) || 0;
    return calculateFiburVictoryPoints(s1, s2);
  }, [testScore1, testScore2]);

  const handleLaunchPreset = (preset) => {
    try {
      sound.playTap();
    } catch {}
    if (typeof onStartNewTournament === 'function') {
      onStartNewTournament(preset);
    }
  };

  return (
    <div className="space-y-4 my-2">
      {/* 1. HERO DASHBOARD CLUB TORNEI */}
      <section className="club-card p-4 sm:p-6 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] club-text-gold flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>Circolo del Burraco · Dashboard Tornei</span>
              <span className="club-text-subtle">·</span>
              <span className="club-text-muted tracking-widest">♠ ♥ ♦ ♣</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
              {activeTournament ? 'Campionato in Corso' : hasNoTournaments ? 'Benvenuto nel Centro Tornei' : 'Centro Direzione Tornei'}
            </h2>
            <p className="text-xs sm:text-sm club-text-muted max-w-2xl leading-relaxed">
              {hasNoTournaments
                ? 'Nessun torneo attivo al momento. Avvia il tuo primo campionato federale o sociale con 1 tocco dai template qui sotto, oppure configuralo su misura.'
                : 'Gestisci campionati federali FIBUR e formule sociali a gironi. Metti in pausa qualsiasi torneo con promemoria e data di ripresa, gioca partite libere e sincronizza i risultati su tutti i tavoli.'}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            {activeTournament && (
              <button
                type="button"
                onClick={onOpenActiveTournament}
                className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl gold-gradient font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-sm"
              >
                <span>Apri Torneo Live</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => handleLaunchPreset(null)}
              className={`flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                activeTournament ? 'club-btn-secondary' : 'gold-gradient'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuovo Torneo</span>
            </button>
          </div>
        </div>

        {/* STRIP METRICHE / KPI DASHBOARD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 pt-4 border-t club-divider">
          <div className="p-3 rounded-xl club-inset">
            <span className="text-[11px] font-semibold club-text-subtle block">
              Tornei Totali
            </span>
            <span className="font-mono-num text-xl sm:text-2xl font-bold text-white block mt-0.5">
              {totalTournamentsCount}
            </span>
          </div>

          <div className="p-3 rounded-xl club-inset">
            <span className="text-[11px] font-semibold text-emerald-300 block">
              In Corso
            </span>
            <span className="font-mono-num text-xl sm:text-2xl font-bold text-emerald-400 block mt-0.5">
              {activeTournament ? '1 Live' : '0'}
            </span>
          </div>

          <div className="p-3 rounded-xl club-inset">
            <span className="text-[11px] font-semibold club-text-gold block">
              In Pausa (Cloud)
            </span>
            <span className="font-mono-num text-xl sm:text-2xl font-bold text-amber-300 block mt-0.5">
              {pausedTournaments.length}
            </span>
          </div>

          <div className="p-3 rounded-xl club-inset">
            <span className="text-[11px] font-semibold club-text-subtle block">
              Albo d&apos;Oro
            </span>
            <span className="font-mono-num text-xl sm:text-2xl font-bold text-white block mt-0.5">
              {tournamentsHistory.length}
            </span>
          </div>
        </div>
      </section>

      {/* 2. BARRA DI NAVIGAZIONE TAB DASHBOARD */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setHubTab('all')}
          className={`min-h-[40px] px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            hubTab === 'all'
              ? 'gold-gradient border-amber-300'
              : 'club-btn-secondary club-text-muted hover:text-white'
          }`}
        >
          Panoramica
        </button>

        <button
          type="button"
          onClick={() => setHubTab('active')}
          className={`min-h-[40px] px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            hubTab === 'active'
              ? 'gold-gradient border-amber-300'
              : 'club-btn-secondary club-text-muted hover:text-white'
          }`}
        >
          In Corso ({activeTournament ? 1 : 0})
        </button>

        <button
          type="button"
          onClick={() => setHubTab('paused')}
          className={`min-h-[40px] px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            hubTab === 'paused'
              ? 'gold-gradient border-amber-300'
              : 'club-btn-secondary club-text-muted hover:text-white'
          }`}
        >
          In Pausa ({pausedTournaments.length})
        </button>

        <button
          type="button"
          onClick={() => setHubTab('history')}
          className={`min-h-[40px] px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            hubTab === 'history'
              ? 'gold-gradient border-amber-300'
              : 'club-btn-secondary club-text-muted hover:text-white'
          }`}
        >
          Albo d&apos;Oro ({tournamentsHistory.length})
        </button>

        <button
          type="button"
          onClick={() => setHubTab('rules')}
          className={`min-h-[40px] px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            hubTab === 'rules'
              ? 'gold-gradient border-amber-300'
              : 'club-btn-secondary club-text-muted hover:text-white'
          }`}
        >
          Regolamento FIBUR
        </button>
      </div>

      {/* 3. TEMPLATE RAPIDI DI AVVIO (Mostrati in Panoramica o quando non ci sono tornei attivi) */}
      {(hubTab === 'all' || !activeTournament) && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider club-text-gold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Avvia con 1 Tocco · Template Rapidi</span>
            </h3>
            <span className="text-xs club-text-subtle font-medium">
              Calendario Round-Robin automatico
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Template 1: Quadrangolare FIBUR */}
            <div className="p-4 rounded-2xl club-card hover:border-amber-400/80 transition-all flex flex-col justify-between gap-3 group">
              <div className="space-y-1.5">
                <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm sm:text-base group-hover:text-amber-300 transition-colors">
                  Quadrangolare FIBUR
                </h4>
                <p className="text-xs club-text-muted leading-relaxed">
                  4 coppie · 3 giornate · 6 tavoli. Formula ufficiale Victory Points FIBUR a 2505 pt.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleLaunchPreset({
                  name: 'Quadrangolare del Circolo',
                  numTeams: 4,
                  scoringSystem: 'fibur',
                  targetScore: 2505,
                })}
                className="w-full min-h-[40px] px-3 rounded-xl gold-gradient font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Avvia Quadrangolare</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Template 2: Torneo Sociale 6 Coppie */}
            <div className="p-4 rounded-2xl club-card hover:border-amber-400/80 transition-all flex flex-col justify-between gap-3 group">
              <div className="space-y-1.5">
                <div className="w-9 h-9 rounded-xl club-inset club-text-gold flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm sm:text-base group-hover:text-amber-300 transition-colors">
                  Torneo Sociale 6 Coppie
                </h4>
                <p className="text-xs club-text-muted leading-relaxed">
                  6 coppie · 5 giornate · 15 tavoli. Il classico campionato sociale del circolo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleLaunchPreset({
                  name: 'Torneo Sociale Burraco',
                  numTeams: 6,
                  scoringSystem: 'fibur',
                  targetScore: 2505,
                })}
                className="w-full min-h-[40px] px-3 rounded-xl club-btn-secondary font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Avvia 6 Coppie</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Template 3: Torneo Lampo Classico */}
            <div className="p-4 rounded-2xl club-card hover:border-amber-400/80 transition-all flex flex-col justify-between gap-3 group">
              <div className="space-y-1.5">
                <div className="w-9 h-9 rounded-xl club-inset club-text-gold flex items-center justify-center shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm sm:text-base group-hover:text-amber-300 transition-colors">
                  Torneo Lampo 1505 pt
                </h4>
                <p className="text-xs club-text-muted leading-relaxed">
                  4 coppie · Formula Classica (3-1-0). Perfetto per una singola serata tra amici.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleLaunchPreset({
                  name: 'Torneo Lampo del Giovedì',
                  numTeams: 4,
                  scoringSystem: 'classic',
                  targetScore: 1505,
                })}
                className="w-full min-h-[40px] px-3 rounded-xl club-btn-secondary font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Avvia Lampo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Template 4: Personalizzato */}
            <div className="p-4 rounded-2xl club-card border-dashed hover:border-amber-400/80 transition-all flex flex-col justify-between gap-3 group">
              <div className="space-y-1.5">
                <div className="w-9 h-9 rounded-xl club-inset club-text-gold flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm sm:text-base group-hover:text-amber-300 transition-colors">
                  Crea su Misura
                </h4>
                <p className="text-xs club-text-muted leading-relaxed">
                  Da 2 a 16 coppie, sorteggio automatico, assegnazione rapida amici e regole su misura.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleLaunchPreset(null)}
                className="w-full min-h-[40px] px-3 rounded-xl club-btn-secondary font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Configura</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4. SEZIONE: TORNEO IN CORSO */}
      {(hubTab === 'all' || hubTab === 'active') && activeTournament && activeProgress && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Torneo Attivo in Corso</span>
            </h3>
            <span className="text-xs club-text-subtle font-mono-num">
              {activeProgress.completedRounds}/{activeProgress.totalRounds} giornate concluse
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl club-card border-amber-400/65 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
              <div className="min-w-0 space-y-1">
                <h4 className="font-display text-lg sm:text-xl font-bold text-white truncate">
                  {activeTournament.name}
                </h4>
                <div className="text-xs club-text-muted flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="font-semibold text-white">{activeTournament.teams?.length || 0} coppie</span>
                  <span aria-hidden="true" className="club-text-subtle">·</span>
                  <span className="club-text-gold font-semibold">
                    {activeTournament.scoringSystem === 'classic' ? 'Classico (3-1-0)' : 'FIBUR VP (20-0)'}
                  </span>
                  <span aria-hidden="true" className="club-text-subtle">·</span>
                  <span className="font-mono-num">Traguardo {activeTournament.targetScore || 2505} pt</span>
                  {activeLeader && (
                    <>
                      <span aria-hidden="true" className="club-text-subtle">·</span>
                      <span className="text-amber-300 font-semibold">In testa: {activeLeader}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-xs club-text-subtle block">Giornata Corrente</span>
                <span className="font-mono-num font-bold text-base text-white">
                  Giornata {activeProgress.currentRoundNumber} di {activeProgress.totalRounds}
                </span>
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

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t club-divider">
              <button
                type="button"
                onClick={onOpenActiveTournament}
                className="min-h-[44px] px-4 py-2 rounded-xl gold-gradient font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Apri Torneo & Calendario</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onRequestPauseTournament(activeTournament)}
                className="min-h-[44px] px-3.5 py-2 rounded-xl club-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="Metti in pausa con promemoria e data per continuare un altro giorno"
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
                <span>Concludi e Premia</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 5. SEZIONE: TORNEI IN PAUSA */}
      {(hubTab === 'all' || hubTab === 'paused') && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider club-text-gold flex items-center gap-1.5">
              <PauseCircle className="w-3.5 h-3.5" />
              <span>Tornei in Pausa ({pausedTournaments.length})</span>
            </h3>
            {pausedTournaments.length > 0 && (
              <span className="text-xs club-text-subtle font-medium">
                Salvati su Cloud e pronti alla ripresa
              </span>
            )}
          </div>

          {pausedTournaments.length === 0 ? (
            hubTab === 'paused' && (
              <div className="p-6 rounded-2xl club-inset text-center space-y-2">
                <p className="text-sm font-semibold text-white m-0">Nessun torneo in pausa</p>
                <p className="text-xs club-text-muted max-w-md mx-auto m-0">
                  Quando metti in pausa un torneo dal menu o avviandone un altro, verrà salvato al sicuro qui per essere ripreso il giorno dopo o su un altro dispositivo.
                </p>
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
                        <span>Riprendi Subito</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditPausedMetadata(t)}
                        className="min-h-[44px] px-3 rounded-xl club-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        title="Modifica nota o data di ripresa"
                      >
                        <Edit3 className="w-3.5 h-3.5 club-text-gold" />
                        <span>Promemoria</span>
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

      {/* 6. SEZIONE: ALBO D'ORO (HALL OF FAME) */}
      {(hubTab === 'all' || hubTab === 'history') && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider club-text-gold flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Albo d&apos;Oro del Circolo ({tournamentsHistory.length})</span>
            </h3>
            <span className="text-xs club-text-subtle font-medium">
              Edizioni ufficiali premiate
            </span>
          </div>

          {tournamentsHistory.length === 0 ? (
            <div className="p-5 rounded-2xl club-inset text-center space-y-1.5">
              <p className="text-sm font-semibold text-white m-0">Nessun torneo nell&apos;Albo d&apos;Oro</p>
              <p className="text-xs club-text-muted max-w-md mx-auto m-0">
                Al termine di un torneo, premiando la coppia vincitrice, la classifica finale verrà consacrata qui con i dettagli dei campioni.
              </p>
            </div>
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
                    <div className="min-w-0 space-y-1">
                      <div className="font-bold text-white text-sm truncate flex items-center gap-2">
                        <span>{t.name}</span>
                        <span className="text-[11px] font-mono-num club-text-gold font-semibold">
                          ({t.scoringSystem === 'classic' ? 'Classico' : 'FIBUR'})
                        </span>
                      </div>
                      <div className="text-xs club-text-subtle flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono-num">{completedDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>{t.teams?.length || 0} coppie partecipanti</span>
                        {winner && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-300 font-bold">🥇 Campioni: {winner}</span>
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
                        <span>Classifica Finale</span>
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

      {/* 7. GUIDA & REGOLAMENTO FIBUR UFFICIALE */}
      {(hubTab === 'all' || hubTab === 'rules') && (
        <section className="club-card p-4 sm:p-5 rounded-2xl space-y-4 border-amber-400/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b club-divider">
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 club-text-gold" />
                <span>Regolamento Tornei & Tabella Federale FIBUR</span>
              </h3>
              <p className="text-xs club-text-muted">
                Come vengono calcolati i Victory Points (VP) negli incontri a gironi federali
              </p>
            </div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold club-text-gold bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/25 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Regolamento Tecnico Nazionale</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl club-inset space-y-1">
              <span className="font-bold club-text-primary block">1. Formula Round-Robin</span>
              <p className="club-text-muted leading-relaxed m-0">
                Tutte le coppie si affrontano a rotazione diretta. In caso di squadre dispari, il sistema assegna automaticamente il turno di riposo equo per ogni giornata.
              </p>
            </div>

            <div className="p-3 rounded-xl club-inset space-y-1">
              <span className="font-bold club-text-primary block">2. Victory Points (20 - 0)</span>
              <p className="club-text-muted leading-relaxed m-0">
                Al termine della partita, la differenza tra i punti delle due squadre determina i Victory Points assegnati al tavolo. La somma dei VP è sempre 20.
              </p>
            </div>

            <div className="p-3 rounded-xl club-inset space-y-1">
              <span className="font-bold club-text-primary block">3. Criteri Classifica</span>
              <p className="club-text-muted leading-relaxed m-0">
                1° Totale Victory Points · 2° Differenza punti Burraco (PF - PS) · 3° Totale Punti Fatti · 4° Numero di vittorie.
              </p>
            </div>
          </div>

          {/* Calcolatore interattivo di prova scarto */}
          <div className="p-3.5 rounded-xl club-inset space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold club-text-gold uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                <span>Simulatore Conversione Victory Points</span>
              </span>
              <span className="text-[11px] font-mono-num club-text-subtle">
                Scarto: {Math.abs(testVpResult.diff).toLocaleString('it-IT')} pt
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
              <div>
                <label className="text-[11px] club-text-muted block mb-1">Punti Coppia 1</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={testScore1}
                  onChange={(e) => setTestScore1(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-xl club-input text-xs font-mono-num font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] club-text-muted block mb-1">Punti Coppia 2</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={testScore2}
                  onChange={(e) => setTestScore2(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-1.5 rounded-xl club-input text-xs font-mono-num font-bold"
                />
              </div>

              <div className="p-2.5 rounded-xl club-card border-amber-400/40 text-center">
                <span className="text-[10px] uppercase font-bold club-text-subtle block">Risultato FIBUR</span>
                <span className="font-mono-num text-lg font-bold club-text-gold">
                  {testVpResult.team1Vp} - {testVpResult.team2Vp}
                </span>
                <span className="text-[10px] club-text-primary block mt-0.5">
                  {testVpResult.diff === 0
                    ? 'Pareggio perfetto'
                    : testVpResult.diff > 0
                      ? 'Vittoria Coppia 1'
                      : 'Vittoria Coppia 2'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabella Ufficiale degli Scaglioni */}
          <div className="rounded-xl overflow-hidden border club-divider">
            <div className="px-3.5 py-2 club-table-head border-b club-divider flex items-center justify-between text-xs">
              <span className="font-bold club-text-primary">Tabella Scaglioni Scarto FIBUR</span>
              <span className="text-[11px] club-text-subtle">Fonte: Regolamento Tecnico Nazionale FIBUR</span>
            </div>
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono-num">
                <thead>
                  <tr className="club-row-bg text-[11px] club-text-muted border-b club-divider">
                    <th className="py-2 px-3">Differenza Punti</th>
                    <th className="py-2 px-3 text-center">VP Vincitore</th>
                    <th className="py-2 px-3 text-center">VP Perdente</th>
                    <th className="py-2 px-3 text-right">Rapporto</th>
                  </tr>
                </thead>
                <tbody className="divide-y club-divider">
                  {FIBUR_VICTORY_POINTS_TABLE.map((b, idx) => {
                    const prevMax = idx === 0 ? 0 : FIBUR_VICTORY_POINTS_TABLE[idx - 1].maxDiff + 1;
                    const label = b.maxDiff === Infinity
                      ? `Oltre ${prevMax - 1} pt`
                      : `${prevMax} - ${b.maxDiff} pt`;

                    return (
                      <tr key={b.maxDiff} className="club-hover-soft transition-colors">
                        <td className="py-1.5 px-3 font-sans club-text-primary">{label}</td>
                        <td className="py-1.5 px-3 text-center font-bold club-text-gold">{b.winnerVp}</td>
                        <td className="py-1.5 px-3 text-center club-text-muted">{b.loserVp}</td>
                        <td className="py-1.5 px-3 text-right font-bold club-text-primary">{b.winnerVp} - {b.loserVp}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
