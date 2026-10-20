import React, { useState, useMemo, useCallback } from 'react';
import { X, Trophy, Plus, Calendar, Users, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useConfirm } from '../context/ConfirmContext';
import { sound } from '../utils/soundEffects';
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
  activeTournament,
  onStartTournament,
  onUpdateTournament,
  onFinishTournament,
  onPlayMatch,
  playersList = [],
}) {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState('standings'); // 'standings' | 'schedule' | 'manage'
  const [isCreating, setIsCreating] = useState(!activeTournament);
  const [selectedRoundFilter, setSelectedRoundFilter] = useState('all');
  const [tournamentsHistory, setTournamentsHistory] = useState(() => getTournamentsHistory());
  const [viewingHistoricalTournament, setViewingHistoricalTournament] = useState(null);

  // Stato form creazione
  const [tournamentName, setTournamentName] = useState('Torneo Burraco');
  const [targetScore, setTargetScore] = useState(2505);
  const [scoringSystem, setScoringSystem] = useState('fibur'); // 'fibur' | 'classic'
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

  // Traccia quale input giocatore è attualmente attivo per assegnare rapidamente con un tocco
  const [activePlayerField, setActivePlayerField] = useState({ teamIndex: 0, playerSlot: 1 });

  // Assegna un partecipante recente allo slot attivo o al primo slot libero
  const handleAssignPlayer = useCallback((playerName) => {
    setTeamsForm(prev => {
      const next = [...prev];
      let targetIdx = activePlayerField.teamIndex;
      let targetSlot = activePlayerField.playerSlot;

      if (next[targetIdx] && next[targetIdx][`player${targetSlot}`] === playerName) {
        return next;
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
        next[targetIdx] = {
          ...next[targetIdx],
          [`player${targetSlot}`]: playerName,
        };
        const p1 = targetSlot === 1 ? playerName : next[targetIdx].player1;
        const p2 = targetSlot === 2 ? playerName : next[targetIdx].player2;
        const combined = [p1, p2].filter(Boolean).join(' & ');
        if (!next[targetIdx].name || next[targetIdx].name.startsWith('Coppia ')) {
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

  // Sincronizza squadre quando cambia numTeams nel form
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

  // Calcola tutti i match appiattiti
  const allMatches = useMemo(() => {
    if (!tournamentRounds) return [];
    return tournamentRounds.flatMap(r => r.matches || []);
  }, [tournamentRounds]);

  // Calcola classifica live del torneo attivo
  const standings = useMemo(() => {
    if (!tournamentTeams) return [];
    return calculateTournamentStandings(
      tournamentTeams, 
      allMatches, 
      activeTournament?.scoringSystem || 'fibur'
    );
  }, [tournamentTeams, allMatches, activeTournament?.scoringSystem]);

  // Calcola classifica di un eventuale torneo storico in visualizzazione
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

  // Avvio creazione torneo
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
      status: 'in_progress', // 'in_progress' | 'completed'
      teams: formattedTeams,
      rounds,
      completedAt: null,
    };

    sound.playCardDeal();
    onStartTournament(newTournament);
    setIsCreating(false);
    setActiveTab('standings');
  };

  // Salva punteggio rapido match giocato esternamente
  const handleSaveManualMatchScore = (e) => {
    e.preventDefault();
    if (!editingMatch || !activeTournament) return;

    const s1 = Number(manualScore1) || 0;
    const s2 = Number(manualScore2) || 0;
    const winnerId = s1 > s2 ? editingMatch.team1Id : s2 > s1 ? editingMatch.team2Id : 'tie';

    const updatedRounds = activeTournament.rounds.map(r => ({
      ...r,
      matches: r.matches.map(m => {
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

    sound.playBurracoChime();
    onUpdateTournament(updatedTournament);
    setEditingMatch(null);
  };

  // Modifica squadre al volo a torneo in corso
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
        let matchUpdated = { ...m };
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

    const updatedTournament = {
      ...activeTournament,
      teams: updatedTeams,
      rounds: updatedRounds,
    };
    onUpdateTournament(updatedTournament);
  };

  // Proclamazione vincitore e conclusione torneo
  const handleFinishAndCelebrate = async () => {
    const ok = await confirm({
      title: 'Concludi Torneo & Premiazione',
      message: 'Vuoi davvero proclamare i campioni ufficiali e archiviare il torneo nell\'Albo d\'Oro?',
      confirmText: 'Sì, concludi e premia 🏆',
      variant: 'warning'
    });
    if (!ok) return;

    sound.playVictoryFanfare();
    try {
      confetti({ particleCount: 220, spread: 90, origin: { y: 0.6 } });
    } catch {}

    onFinishTournament();
    setTournamentsHistory(getTournamentsHistory());
    setActiveTab('standings');
  };

  // Elimina torneo storico
  const handleDeleteHistoricalTournament = async (tournamentId) => {
    const ok = await confirm({
      title: 'Elimina Torneo Storico',
      message: 'Vuoi davvero rimuovere questo torneo dall\'Albo d\'Oro? L\'operazione non è reversibile.',
      confirmText: 'Elimina definitivamente',
      variant: 'danger'
    });
    if (!ok) return;

    const updated = deleteTournamentFromHistory(tournamentId);
    setTournamentsHistory(updated);
    if (viewingHistoricalTournament?.id === tournamentId) {
      setViewingHistoricalTournament(null);
    }
  };

  const handleEditMatch = (match) => {
    setEditingMatch(match);
    setManualScore1(match.team1Score !== null ? String(match.team1Score) : '');
    setManualScore2(match.team2Score !== null ? String(match.team2Score) : '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl felt-card rounded-2xl sm:rounded-3xl border border-amber-500/40 p-4 sm:p-6 my-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        {/* HEADER MODALE */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white m-0">
                  {viewingHistoricalTournament
                    ? `Albo d'Oro: ${viewingHistoricalTournament.name}`
                    : isCreating
                    ? 'Nuovo Torneo di Burraco'
                    : activeTournament?.name}
                </h2>
                {activeTournament && !isCreating && !viewingHistoricalTournament && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    activeTournament.status === 'completed'
                      ? 'bg-amber-400 text-emerald-950'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {activeTournament.status === 'completed' ? '🏆 Concluso' : '● In Corso'}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/70 m-0">
                {viewingHistoricalTournament
                  ? 'Consulta la classifica finale archiviata'
                  : isCreating 
                  ? 'Configura formula, coppie partecipanti e calendario'
                  : `Obiettivo: ${activeTournament?.targetScore || 2505} pt • Formula: ${activeTournament?.scoringSystem === 'classic' ? 'Classica (3-1-0)' : 'FIBUR Victory Points (20-0)'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewingHistoricalTournament ? (
              <button
                type="button"
                onClick={() => setViewingHistoricalTournament(null)}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>Torna al Torneo</span>
              </button>
            ) : (
              !isCreating && activeTournament && (
                <button
                  type="button"
                  onClick={() => setIsCreating(true)}
                  className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nuovo Torneo</span>
                </button>
              )
            )}
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WIZARD CREAZIONE TORNEO */}
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
            teamsForm={teamsForm}
            setTeamsForm={setTeamsForm}
            activePlayerField={activePlayerField}
            setActivePlayerField={setActivePlayerField}
            onAssignPlayer={handleAssignPlayer}
            onCreateTournament={handleCreateTournament}
            activeTournament={activeTournament}
            onCancelCreating={() => setIsCreating(false)}
          />
        ) : viewingHistoricalTournament ? (
          /* VISTA CLASSIFICA STORICA */
          <div className="flex-1 flex flex-col min-h-0 my-3">
            <TournamentStandingsTab
              tournament={viewingHistoricalTournament}
              standings={historicalStandings}
              onGoToSchedule={null}
            />
          </div>
        ) : (
          /* VISTA TORNEO ATTIVO */
          <div className="flex-1 flex flex-col min-h-0">
            
            {/* BARRA TAB (Classifica, Calendario, Gestione & Albo d'Oro) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10 my-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('standings')}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'standings'
                    ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 shrink-0" />
                <span>Classifica</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'schedule'
                    ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Incontri & Tavoli</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'manage'
                    ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Squadre & Albo d'Oro</span>
              </button>
            </div>

            {/* CONTENUTO TAB ATTIVO */}
            <div className="flex-1 overflow-y-auto pr-1">
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
                  onStartNewTournament={() => setIsCreating(true)}
                  tournamentsHistory={tournamentsHistory}
                  onDeleteHistoricalTournament={handleDeleteHistoricalTournament}
                  onViewHistoricalStandings={(t) => setViewingHistoricalTournament(t)}
                />
              )}
            </div>
          </div>
        )}

        {/* MODALE DI INSERIMENTO MANUALE RAPIDO PUNTEGGIO SCONTRO */}
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
    </div>
  );
}
