import React, { useState, useMemo, useCallback } from 'react';
import {
  X,
  Trophy,
  Plus,
  Calendar,
  Users,
  ArrowLeft,
  PauseCircle,
  LayoutGrid
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useConfirm } from '../context/confirmContextStore';
import { sound } from '../utils/soundEffects';
import { useModalEscape } from '../hooks/useModalEscape';
import {
  generateRoundRobinSchedule,
  calculateTournamentStandings,
  computeTournamentProgress,
  getTournamentsHistory,
  deleteTournamentFromHistory
} from '../utils/tournament';
import TournamentWizard from './tournament/TournamentWizard';
import TournamentStandingsTab from './tournament/TournamentStandingsTab';
import TournamentScheduleTab from './tournament/TournamentScheduleTab';
import TournamentManageTab from './tournament/TournamentManageTab';
import TournamentHub from './tournament/TournamentHub';
import MatchScoreEditModal from './tournament/MatchScoreEditModal';
import PauseTournamentModal from './tournament/PauseTournamentModal';

export default function TournamentModal({
  isOpen,
  onClose,
  isPage = false,
  activeTournament,
  pausedTournaments = [],
  tournamentsHistory: externalHistory = null,
  onStartTournament,
  onPauseTournament,
  onUpdatePausedMetadata,
  onResumeTournament,
  onDeletePausedTournament,
  onUpdateTournament,
  onFinishTournament,
  onDeleteTournamentHistory = null,
  onPlayMatch,
  playersList = [],
  currentUser = null,
  friendsList = [],
  initialTab = 'standings',
  initialRoundFilter = 'all',
}) {
  const confirm = useConfirm();
  const baseTab = initialTab || 'standings';
  const [tabState, setTabState] = useState(() => ({ base: baseTab, value: baseTab }));
  const activeTab = tabState.base === baseTab ? tabState.value : baseTab;
  const setActiveTab = (nextTab) => setTabState({ base: baseTab, value: nextTab });

  const baseRoundFilter = initialRoundFilter || 'all';
  const [roundState, setRoundState] = useState(() => ({ base: baseRoundFilter, value: baseRoundFilter }));
  const selectedRoundFilter = roundState.base === baseRoundFilter ? roundState.value : baseRoundFilter;
  const setSelectedRoundFilter = (nextFilter) => setRoundState({ base: baseRoundFilter, value: nextFilter });

  // 'auto' | 'hub' | 'detail' | 'create'
  const [requestedView, setRequestedView] = useState('auto');
  const [localHistory, setLocalHistory] = useState(() => getTournamentsHistory());
  const tournamentsHistory = externalHistory ?? localHistory;
  const [viewingHistoricalTournament, setViewingHistoricalTournament] = useState(null);

  // Stato modale pausa / modifica nota
  const [pauseModalState, setPauseModalState] = useState({
    isOpen: false,
    tournament: null,
    mode: 'pause', // 'pause' | 'edit'
  });

  useModalEscape(!isPage && isOpen, onClose);

  const [tournamentName, setTournamentName] = useState('Torneo Burraco');
  const [targetScore, setTargetScore] = useState(2505);
  const [scoringSystem, setScoringSystem] = useState('fibur');
  const [numTeams, setNumTeams] = useState(4);
  const [teamsForm, setTeamsForm] = useState([
    { id: 'team_1', name: 'Coppia 1', player1: '', player2: '' },
    { id: 'team_2', name: 'Coppia 2', player1: '', player2: '' },
    { id: 'team_3', name: 'Coppia 3', player1: '', player2: '' },
    { id: 'team_4', name: 'Coppia 4', player1: '', player2: '' },
  ]);

  const [editingMatch, setEditingMatch] = useState(null);
  const [manualScore1, setManualScore1] = useState('');
  const [manualScore2, setManualScore2] = useState('');
  const [activePlayerField, setActivePlayerField] = useState({ teamIndex: 0, playerSlot: 1 });

  const hasPausedOrHistory = pausedTournaments.length > 0 || tournamentsHistory.length > 0;
  const effectiveView = viewingHistoricalTournament
    ? 'historical'
    : requestedView === 'create'
      ? 'create'
      : requestedView === 'hub'
        ? 'hub'
        : activeTournament
          ? 'detail'
          : hasPausedOrHistory
            ? 'hub'
            : 'create';

  const handleAssignPlayer = useCallback((playerName) => {
    if (!playerName) return;
    setTeamsForm(prev => {
      const next = prev.map(t => ({ ...t }));
      let targetIdx = activePlayerField.teamIndex;
      let targetSlot = activePlayerField.playerSlot;

      if (next[targetIdx] && next[targetIdx][`player${targetSlot}`] === playerName) {
        next[targetIdx][`player${targetSlot}`] = '';
        const p1 = targetSlot === 1 ? '' : next[targetIdx].player1;
        const p2 = targetSlot === 2 ? '' : next[targetIdx].player2;
        const combined = [p1, p2].filter(Boolean).join(' & ');
        if (!next[targetIdx].name || next[targetIdx].name.startsWith('Coppia ') || next[targetIdx].name.includes('&')) {
          next[targetIdx].name = combined || `Coppia ${targetIdx + 1}`;
        }
        return next;
      }

      for (let i = 0; i < next.length; i++) {
        if (next[i].player1 === playerName) {
          next[i].player1 = '';
          const p2 = next[i].player2;
          if (next[i].name.startsWith('Coppia ') || next[i].name.includes('&')) {
            next[i].name = p2 ? `${p2}` : `Coppia ${i + 1}`;
          }
        }
        if (next[i].player2 === playerName) {
          next[i].player2 = '';
          const p1 = next[i].player1;
          if (next[i].name.startsWith('Coppia ') || next[i].name.includes('&')) {
            next[i].name = p1 ? `${p1}` : `Coppia ${i + 1}`;
          }
        }
      }

      if (next[targetIdx] && next[targetIdx][`player${targetSlot}`] !== '') {
        let foundEmpty = false;
        for (let i = 0; i < next.length; i++) {
          if (!next[i].player1) {
            targetIdx = i;
            targetSlot = 1;
            foundEmpty = true;
            break;
          }
          if (!next[i].player2) {
            targetIdx = i;
            targetSlot = 2;
            foundEmpty = true;
            break;
          }
        }
        if (!foundEmpty) {
          targetIdx = activePlayerField.teamIndex;
          targetSlot = activePlayerField.playerSlot;
        }
      }

      if (next[targetIdx]) {
        next[targetIdx][`player${targetSlot}`] = playerName;
        const p1 = targetSlot === 1 ? playerName : next[targetIdx].player1;
        const p2 = targetSlot === 2 ? playerName : next[targetIdx].player2;
        const combined = [p1, p2].filter(Boolean).join(' & ');
        if (!next[targetIdx].name || next[targetIdx].name.startsWith('Coppia ') || next[targetIdx].name.includes('&')) {
          next[targetIdx].name = combined || `Coppia ${targetIdx + 1}`;
        }
      }

      if (targetSlot === 1) {
        setActivePlayerField({ teamIndex: targetIdx, playerSlot: 2 });
      } else if (targetIdx + 1 < next.length) {
        setActivePlayerField({ teamIndex: targetIdx + 1, playerSlot: 1 });
      }

      return next;
    });
  }, [activePlayerField]);

  const handleNumTeamsChange = useCallback((count) => {
    const n = Math.max(2, Math.min(16, count));
    setNumTeams(n);
    setTeamsForm(prev => {
      const next = [...prev];
      while (next.length < n) {
        const id = next.length + 1;
        next.push({ id: `team_${id}`, name: `Coppia ${id}`, player1: '', player2: '' });
      }
      return next.slice(0, n);
    });
    setActivePlayerField({ teamIndex: 0, playerSlot: 1 });
  }, []);

  const tournamentRounds = activeTournament?.rounds;
  const tournamentTeams = activeTournament?.teams;

  const allMatches = useMemo(() => {
    if (!tournamentRounds) return [];
    return tournamentRounds.flatMap(r => r.matches || []);
  }, [tournamentRounds]);

  const activeProgress = useMemo(() => {
    if (!activeTournament) return null;
    return computeTournamentProgress(activeTournament);
  }, [activeTournament]);

  const standings = useMemo(() => {
    if (!tournamentTeams) return [];
    return calculateTournamentStandings(
      tournamentTeams,
      allMatches,
      activeTournament?.scoringSystem || 'fibur'
    );
  }, [tournamentTeams, allMatches, activeTournament?.scoringSystem]);

  const historicalStandings = useMemo(() => {
    if (!viewingHistoricalTournament) return [];
    const histMatches = (viewingHistoricalTournament.rounds || []).flatMap(r => r.matches || []);
    return calculateTournamentStandings(
      viewingHistoricalTournament.teams || [],
      histMatches,
      viewingHistoricalTournament.scoringSystem || 'fibur'
    );
  }, [viewingHistoricalTournament]);

  if (!isOpen) return null;

  const handleCreateTournament = (e) => {
    e.preventDefault();

    const formattedTeams = teamsForm.map((t, idx) => {
      const p = [t.player1.trim(), t.player2.trim()].filter(Boolean);
      const defaultName = p.length > 0 ? p.join(' & ') : `Coppia ${idx + 1}`;
      return {
        id: `team_${idx + 1}_${Date.now().toString(36)}`,
        name: t.name.trim() || defaultName,
        players: p.length > 0 ? p : [t.name.trim() || `Coppia ${idx + 1}`],
      };
    });

    const rounds = generateRoundRobinSchedule(formattedTeams);

    const newTournament = {
      id: 'tournament_' + Date.now(),
      name: tournamentName.trim() || 'Torneo Burraco',
      createdAt: new Date().toISOString(),
      targetScore: Number(targetScore) || 2505,
      scoringSystem: scoringSystem || 'fibur',
      status: 'in_progress',
      teams: formattedTeams,
      rounds,
      completedAt: null,
    };

    sound.playCardDeal();
    onStartTournament(newTournament);
    setRequestedView('detail');
    setActiveTab('standings');
  };

  const handleSaveManualMatchScore = (e) => {
    e.preventDefault();
    if (!editingMatch || !activeTournament) return;

    const s1 = Number(manualScore1) || 0;
    const s2 = Number(manualScore2) || 0;
    const winnerId = s1 > s2 ? editingMatch.team1Id : s2 > s1 ? editingMatch.team2Id : 'tie';

    const updatedRounds = (activeTournament.rounds || []).map(r => ({
      ...r,
      matches: (r.matches || []).map(m => {
        if (m.id === editingMatch.id) {
          return {
            ...m,
            team1Score: s1,
            team2Score: s2,
            winnerId,
            status: 'completed',
            completedAt: new Date().toISOString(),
          };
        }
        return m;
      })
    }));

    const updatedTournament = {
      ...activeTournament,
      rounds: updatedRounds,
    };

    try {
      sound.playBurracoChime();
      if (typeof onUpdateTournament === 'function') {
        onUpdateTournament(updatedTournament);
      }
    } catch (err) {
      console.error('Errore durante salvataggio punteggio match torneo:', err);
    } finally {
      setEditingMatch(null);
    }
  };

  const handleUpdateTeamsInTournament = (teamId, updatedData) => {
    if (!activeTournament) return;
    const updatedTeams = (activeTournament.teams || []).map(t => {
      if (t.id === teamId) {
        return {
          ...t,
          name: updatedData.name,
          players: updatedData.players,
        };
      }
      return t;
    });

    const updatedRounds = (activeTournament.rounds || []).map(r => ({
      ...r,
      matches: (r.matches || []).map(m => {
        const matchUpdated = { ...m };
        if (m.team1Id === teamId) {
          matchUpdated.team1Name = updatedData.name;
          matchUpdated.team1Players = updatedData.players;
        }
        if (m.team2Id === teamId) {
          matchUpdated.team2Name = updatedData.name;
          matchUpdated.team2Players = updatedData.players;
        }
        return matchUpdated;
      })
    }));

    onUpdateTournament({
      ...activeTournament,
      teams: updatedTeams,
      rounds: updatedRounds,
    });
  };

  const handleFinishAndCelebrate = async (tournamentIdOverride = null) => {
    const ok = await confirm({
      title: 'Concludi Torneo e Premiazione',
      message: "Vuoi proclamare i campioni ufficiali e archiviare il torneo nell'Albo d'Oro?",
      confirmText: 'Concludi e Premia',
      variant: 'warning'
    });
    if (!ok) return;

    sound.playVictoryFanfare();
    try {
      confetti({ particleCount: 220, spread: 90, origin: { y: 0.6 } });
    } catch {}

    onFinishTournament(tournamentIdOverride);
    if (!externalHistory) {
      setLocalHistory(getTournamentsHistory());
    }
    setRequestedView('hub');
  };

  const handleDeleteHistoricalTournament = async (tournamentId) => {
    const ok = await confirm({
      title: 'Elimina Torneo Storico',
      message: "Vuoi rimuovere definitivamente questo torneo dall'Albo d'Oro?",
      confirmText: 'Elimina',
      variant: 'danger'
    });
    if (!ok) return;

    if (typeof onDeleteTournamentHistory === 'function') {
      onDeleteTournamentHistory(tournamentId);
    } else {
      const updated = deleteTournamentFromHistory(tournamentId);
      setLocalHistory(updated);
    }
    if (viewingHistoricalTournament?.id === tournamentId) {
      setViewingHistoricalTournament(null);
    }
  };

  const handleDeletePausedWithConfirm = async (tournamentId) => {
    const target = pausedTournaments.find(t => t.id === tournamentId);
    const ok = await confirm({
      title: 'Elimina Torneo in Pausa',
      message: `Vuoi eliminare definitivamente "${target?.name || 'questo torneo'}" e tutti i relativi incontri salvati?`,
      confirmText: 'Elimina definitivamente',
      variant: 'danger'
    });
    if (!ok) return;

    if (typeof onDeletePausedTournament === 'function') {
      onDeletePausedTournament(tournamentId);
    }
    sound.playTap();
  };

  const handleResumeAndOpen = (tournamentId) => {
    if (typeof onResumeTournament === 'function') {
      onResumeTournament(tournamentId);
    }
    sound.playTap();
    setRequestedView('detail');
    setActiveTab('standings');
  };

  const handleConfirmPauseModal = (pauseDetails) => {
    const target = pauseModalState.tournament;
    if (!target) return;

    if (pauseModalState.mode === 'edit') {
      if (typeof onUpdatePausedMetadata === 'function') {
        onUpdatePausedMetadata(target.id, pauseDetails);
      }
    } else {
      if (typeof onPauseTournament === 'function') {
        onPauseTournament(target.id, pauseDetails);
      }
      setRequestedView('hub');
    }

    sound.playTap();
    setPauseModalState({ isOpen: false, tournament: null, mode: 'pause' });
  };

  const handleEditMatch = (match) => {
    setEditingMatch(match);
    setManualScore1(match.team1Score !== null ? String(match.team1Score) : '');
    setManualScore2(match.team2Score !== null ? String(match.team2Score) : '');
  };

  const headerTitle = effectiveView === 'historical'
    ? `Albo d'Oro: ${viewingHistoricalTournament?.name}`
    : effectiveView === 'create'
      ? 'Nuovo Torneo del Club'
      : effectiveView === 'hub'
        ? 'Hub Tornei del Club'
        : activeTournament?.name || 'Torneo';

  const headerSubtitle = effectiveView === 'historical'
    ? 'Classifica finale archiviata'
    : effectiveView === 'create'
      ? 'Configura formula, coppie partecipanti e calendario'
      : effectiveView === 'hub'
        ? `${(activeTournament ? 1 : 0) + pausedTournaments.length} aperti · ${tournamentsHistory.length} nell'Albo d'Oro`
        : `Obiettivo ${activeTournament?.targetScore || 2505} pt · ${activeTournament?.scoringSystem === 'classic' ? 'Formula Classica (3-1-0)' : 'FIBUR Victory Points (20-0)'}`;

  const cardContent = (
    <div
      className={`relative w-full ${isPage ? 'max-w-4xl mx-auto' : 'max-w-4xl my-4 max-h-[92dvh]'} club-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col`}
      onClick={!isPage ? (e) => e.stopPropagation() : undefined}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 pb-3.5 border-b club-divider shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h2 className="font-display text-lg sm:text-xl font-bold text-white truncate">
                {headerTitle}
              </h2>
              {effectiveView === 'detail' && activeTournament && (
                <span className="text-xs font-semibold text-emerald-300">
                  · In corso
                </span>
              )}
            </div>
            <p className="text-xs club-text-muted mt-0.5 truncate">
              {headerSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
          {effectiveView === 'historical' && (
            <button
              type="button"
              onClick={() => setViewingHistoricalTournament(null)}
              className="min-h-[42px] px-3 rounded-xl club-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 club-text-gold" />
              <span>Torna all&apos;Hub</span>
            </button>
          )}

          {effectiveView === 'detail' && activeTournament && (
            <>
              <button
                type="button"
                onClick={() => setRequestedView('hub')}
                className="min-h-[42px] px-3 rounded-xl club-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="Gestisci tutti i tornei in corso, in pausa e conclusi"
              >
                <LayoutGrid className="w-4 h-4 club-text-gold" />
                <span>Hub{pausedTournaments.length > 0 ? ` (${pausedTournaments.length} in pausa)` : ''}</span>
              </button>

              {onPauseTournament && (
                <button
                  type="button"
                  onClick={() => setPauseModalState({ isOpen: true, tournament: activeTournament, mode: 'pause' })}
                  className="hidden sm:flex min-h-[42px] px-3 rounded-xl club-btn-secondary text-xs font-semibold items-center gap-1.5 cursor-pointer"
                  title="Metti in pausa questo torneo per riprenderlo in seguito"
                >
                  <PauseCircle className="w-4 h-4 club-text-gold" />
                  <span>Pausa</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setRequestedView('create')}
                className="hidden sm:flex min-h-[42px] px-3 rounded-xl club-btn-secondary text-xs font-semibold items-center gap-1.5 cursor-pointer active:scale-95"
                title="Crea un nuovo torneo (quello attuale resta salvato in pausa)"
              >
                <Plus className="w-4 h-4 club-text-gold" />
                <span>Nuovo</span>
              </button>
            </>
          )}

          {!isPage && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] rounded-xl club-inset club-text-muted hover:text-white flex items-center justify-center cursor-pointer"
              aria-label="Chiudi torneo"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* CORPO PRINCIPALE IN BASE ALLA VISTA */}
      {effectiveView === 'create' && (
        <TournamentWizard
          tournamentName={tournamentName}
          setTournamentName={setTournamentName}
          targetScore={targetScore}
          setTargetScore={setTargetScore}
          scoringSystem={scoringSystem}
          setScoringSystem={setScoringSystem}
          numTeams={numTeams}
          onNumTeamsChange={handleNumTeamsChange}
          playersList={playersList}
          currentUser={currentUser}
          friendsList={friendsList}
          teamsForm={teamsForm}
          setTeamsForm={setTeamsForm}
          activePlayerField={activePlayerField}
          setActivePlayerField={setActivePlayerField}
          onAssignPlayer={handleAssignPlayer}
          onCreateTournament={handleCreateTournament}
          activeTournament={activeTournament}
          hasPausedOrHistory={hasPausedOrHistory}
          onCancelCreating={() => setRequestedView(activeTournament ? 'detail' : 'hub')}
        />
      )}

      {effectiveView === 'historical' && viewingHistoricalTournament && (
        <div className="flex-1 flex flex-col min-h-0 my-3">
          <TournamentStandingsTab
            tournament={viewingHistoricalTournament}
            standings={historicalStandings}
            onGoToSchedule={null}
          />
        </div>
      )}

      {effectiveView === 'hub' && (
        <div className="flex-1 overflow-y-auto pr-0.5">
          <TournamentHub
            activeTournament={activeTournament}
            pausedTournaments={pausedTournaments}
            tournamentsHistory={tournamentsHistory}
            onOpenActiveTournament={() => setRequestedView('detail')}
            onStartNewTournament={() => setRequestedView('create')}
            onRequestPauseTournament={(t) => setPauseModalState({ isOpen: true, tournament: t, mode: 'pause' })}
            onEditPausedMetadata={(t) => setPauseModalState({ isOpen: true, tournament: t, mode: 'edit' })}
            onResumeTournament={handleResumeAndOpen}
            onDeletePausedTournament={handleDeletePausedWithConfirm}
            onFinishTournament={handleFinishAndCelebrate}
            onViewHistoricalStandings={(t) => setViewingHistoricalTournament(t)}
            onDeleteHistoricalTournament={handleDeleteHistoricalTournament}
          />
        </div>
      )}

      {effectiveView === 'detail' && activeTournament && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* STRIP AVANZAMENTO COMPATTA */}
          {activeProgress && (
            <div className="mt-3 px-3.5 py-2.5 rounded-xl club-inset flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="font-mono-num text-white font-semibold">
                Giornata {activeProgress.currentRoundNumber} di {activeProgress.totalRounds}
                <span className="club-text-subtle"> · </span>
                <span className="club-text-gold">
                  {activeProgress.completedMatches}/{activeProgress.totalMatches} incontri ({activeProgress.percentComplete}%)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="club-text-muted font-mono-num">
                  {activeProgress.remainingMatches > 0
                    ? `${activeProgress.remainingMatches} ${activeProgress.remainingMatches === 1 ? 'tavolo rimasto' : 'tavoli rimasti'}`
                    : 'Tutti conclusi'}
                </span>
                {onPauseTournament && (
                  <button
                    type="button"
                    onClick={() => setPauseModalState({ isOpen: true, tournament: activeTournament, mode: 'pause' })}
                    className="sm:hidden club-text-gold font-bold underline cursor-pointer"
                  >
                    Pausa
                  </button>
                )}
              </div>
            </div>
          )}

          {/* BARRA TAB */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl club-tab-bar my-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('standings')}
              className={`min-h-[42px] px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'standings'
                  ? 'gold-gradient'
                  : 'club-text-muted hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <span>Classifica</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`min-h-[42px] px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'schedule'
                  ? 'gold-gradient'
                  : 'club-text-muted hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Incontri</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`min-h-[42px] px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'manage'
                  ? 'gold-gradient'
                  : 'club-text-muted hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Gestione</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-0.5">
            {activeTab === 'standings' && (
              <TournamentStandingsTab
                tournament={activeTournament}
                standings={standings}
                onGoToSchedule={() => setActiveTab('schedule')}
              />
            )}

            {activeTab === 'schedule' && (
              <TournamentScheduleTab
                tournament={activeTournament}
                rounds={activeTournament?.rounds || []}
                selectedRoundFilter={selectedRoundFilter}
                setSelectedRoundFilter={setSelectedRoundFilter}
                onPlayMatch={(match) => {
                  onPlayMatch(match, activeTournament);
                  onClose();
                }}
                onEditMatch={handleEditMatch}
              />
            )}

            {activeTab === 'manage' && (
              <TournamentManageTab
                activeTournament={activeTournament}
                teams={activeTournament?.teams || []}
                onUpdateTeams={handleUpdateTeamsInTournament}
                onPauseTournament={() => setPauseModalState({ isOpen: true, tournament: activeTournament, mode: 'pause' })}
                onFinishAndCelebrate={() => handleFinishAndCelebrate(activeTournament.id)}
                onStartNewTournament={() => setRequestedView('create')}
                tournamentsHistory={tournamentsHistory}
                onDeleteHistoricalTournament={handleDeleteHistoricalTournament}
                onViewHistoricalStandings={(t) => setViewingHistoricalTournament(t)}
                currentUser={currentUser}
                friendsList={friendsList}
                playersList={playersList}
              />
            )}
          </div>
        </div>
      )}

      <MatchScoreEditModal
        editingMatch={editingMatch}
        scoringSystem={activeTournament?.scoringSystem || 'fibur'}
        onClose={() => setEditingMatch(null)}
        manualScore1={manualScore1}
        setManualScore1={setManualScore1}
        manualScore2={manualScore2}
        setManualScore2={setManualScore2}
        onSave={handleSaveManualMatchScore}
      />

      <PauseTournamentModal
        isOpen={pauseModalState.isOpen}
        tournament={pauseModalState.tournament}
        mode={pauseModalState.mode}
        onClose={() => setPauseModalState({ isOpen: false, tournament: null, mode: 'pause' })}
        onConfirm={handleConfirmPauseModal}
      />
    </div>
  );

  if (isPage) {
    return cardContent;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Torneo di Burraco"
    >
      {cardContent}
    </div>
  );
}
