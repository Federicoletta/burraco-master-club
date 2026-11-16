import React, { useState, useMemo, useCallback } from 'react';
import { X, Trophy, Plus, Calendar, Users, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useConfirm } from '../context/confirmContextStore';
import { sound } from '../utils/soundEffects';
import { useModalEscape } from '../hooks/useModalEscape';
import {
  generateRoundRobinSchedule,
  calculateTournamentStandings,
  getTournamentsHistory,
  deleteTournamentFromHistory
} from '../utils/tournament';
import TournamentWizard from './tournament/TournamentWizard';
import TournamentStandingsTab from './tournament/TournamentStandingsTab';
import TournamentScheduleTab from './tournament/TournamentScheduleTab';
import TournamentManageTab from './tournament/TournamentManageTab';
import MatchScoreEditModal from './tournament/MatchScoreEditModal';

export default function TournamentModal({
  isOpen,
  onClose,
  isPage = false,
  activeTournament,
  tournamentsHistory: externalHistory = null,
  onStartTournament,
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

  const [forceCreating, setForceCreating] = useState(false);
  const isCreating = forceCreating || !activeTournament;
  const [localHistory, setLocalHistory] = useState(() => getTournamentsHistory());
  const tournamentsHistory = externalHistory ?? localHistory;
  const [viewingHistoricalTournament, setViewingHistoricalTournament] = useState(null);

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
    setForceCreating(false);
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

  const handleFinishAndCelebrate = async () => {
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

    onFinishTournament();
    if (!externalHistory) {
      setLocalHistory(getTournamentsHistory());
    }
    setActiveTab('standings');
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

  const handleEditMatch = (match) => {
    setEditingMatch(match);
    setManualScore1(match.team1Score !== null ? String(match.team1Score) : '');
    setManualScore2(match.team2Score !== null ? String(match.team2Score) : '');
  };

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
                {viewingHistoricalTournament
                  ? `Albo d'Oro: ${viewingHistoricalTournament.name}`
                  : isCreating
                    ? 'Nuovo Torneo del Club'
                    : activeTournament?.name}
              </h2>
              {activeTournament && !isCreating && !viewingHistoricalTournament && (
                <span className={`text-xs font-semibold ${
                  activeTournament.status === 'completed' ? 'club-text-gold' : 'text-emerald-300'
                }`}>
                  · {activeTournament.status === 'completed' ? 'Concluso' : 'In corso'}
                </span>
              )}
            </div>
            <p className="text-xs club-text-muted mt-0.5 truncate">
              {viewingHistoricalTournament
                ? 'Classifica finale archiviata'
                : isCreating
                  ? 'Configura formula, coppie partecipanti e calendario'
                  : `Obiettivo ${activeTournament?.targetScore || 2505} pt · ${activeTournament?.scoringSystem === 'classic' ? 'Formula Classica (3-1-0)' : 'FIBUR Victory Points (20-0)'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {viewingHistoricalTournament ? (
            <button
              type="button"
              onClick={() => setViewingHistoricalTournament(null)}
              className="min-h-[42px] px-3 rounded-xl club-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 club-text-gold" />
              <span>Torna al Torneo</span>
            </button>
          ) : (
            !isCreating && activeTournament && (
              <button
                type="button"
                onClick={() => setForceCreating(true)}
                className="hidden sm:flex min-h-[42px] px-3.5 rounded-xl club-btn-secondary text-xs font-semibold items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 club-text-gold" />
                <span>Nuovo Torneo</span>
              </button>
            )
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

      {isCreating ? (
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
          onCancelCreating={() => setForceCreating(false)}
        />
      ) : viewingHistoricalTournament ? (
        <div className="flex-1 flex flex-col min-h-0 my-3">
          <TournamentStandingsTab
            tournament={viewingHistoricalTournament}
            standings={historicalStandings}
            onGoToSchedule={null}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
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
                onFinishAndCelebrate={handleFinishAndCelebrate}
                onStartNewTournament={() => setForceCreating(true)}
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
