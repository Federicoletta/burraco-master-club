import React, { useState, useMemo, useCallback } from 'react';
import { X, Trophy, Plus, Calendar, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useConfirm } from '../context/ConfirmContext';
import { sound } from '../utils/soundEffects';
import { generateRoundRobinSchedule, calculateTournamentStandings } from '../utils/tournament';
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

  // Stato form creazione
  const [tournamentName, setTournamentName] = useState('Torneo Burraco');
  const [targetScore, setTargetScore] = useState(2505);
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

      // Se lo slot correntemente selezionato è già pieno con questo giocatore, non fare nulla
      if (next[targetIdx] && next[targetIdx][`player${targetSlot}`] === playerName) {
        return next;
      }

      // Se lo slot target ha già un nome, prova a trovare il primo slot vuoto
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
        // Auto-genera il nome della coppia se ancora generico o vuoto
        const p1 = targetSlot === 1 ? playerName : next[targetIdx].player1;
        const p2 = targetSlot === 2 ? playerName : next[targetIdx].player2;
        const combined = [p1, p2].filter(Boolean).join(' & ');
        if (!next[targetIdx].name || next[targetIdx].name.startsWith('Coppia ')) {
          next[targetIdx].name = combined || `Coppia ${targetIdx + 1}`;
        }
      }

      // Avanza automaticamente al prossimo slot giocatore
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

  // Calcola classifica live
  const standings = useMemo(() => {
    if (!tournamentTeams) return [];
    return calculateTournamentStandings(tournamentTeams, allMatches);
  }, [tournamentTeams, allMatches]);

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

  // Proclamazione vincitore e conclusione torneo
  const handleFinishAndCelebrate = async () => {
    const ok = await confirm({
      title: 'Concludi Torneo',
      message: 'Vuoi davvero dichiarare concluso il torneo e proclamare i vincitori?',
      confirmText: 'Sì, concludi',
      variant: 'warning'
    });
    if (!ok) return;

    sound.playVictoryFanfare();
    try {
      confetti({ particleCount: 180, spread: 80, origin: { y: 0.6 } });
    } catch {}

    onFinishTournament();
    setActiveTab('standings');
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
        <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-xl font-black text-white m-0">
                  {isCreating ? 'Nuovo Torneo di Burraco' : activeTournament?.name}
                </h2>
                {activeTournament && !isCreating && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    activeTournament.status === 'completed'
                      ? 'bg-amber-400 text-emerald-950'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {activeTournament.status === 'completed' ? '🏆 Concluso' : '● In Corso'}
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-300/80 m-0">
                {isCreating 
                  ? 'Configura coppie partecipanti, formule e calendario'
                  : `Obiettivo partite: ${activeTournament?.targetScore || 2505} pt • 3 pt Vittoria, 1 pt Pareggio`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && activeTournament && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="hidden sm:flex px-2.5 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-600/40 text-xs font-bold items-center gap-1 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Nuovo Torneo</span>
              </button>
            )}
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
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
        ) : (
          /* VISTA TORNEO ATTIVO */
          <div className="flex-1 flex flex-col min-h-0">
            
            {/* BARRA TAB (Classifica, Calendario, Gestione) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-emerald-950/80 border border-emerald-800/60 my-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('standings')}
                className={`py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'standings'
                    ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                    : 'text-emerald-300 hover:text-white'
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
                    : 'text-emerald-300 hover:text-white'
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
                    : 'text-emerald-300 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Gestione & Chiusura</span>
              </button>
            </div>

            {/* CONTENUTO TAB */}
            <div className="flex-1 overflow-y-auto pr-1">
              {activeTab === 'standings' && (
                <TournamentStandingsTab
                  standings={standings}
                  onGoToSchedule={() => setActiveTab('schedule')}
                />
              )}

              {activeTab === 'schedule' && (
                <TournamentScheduleTab
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
                  teams={activeTournament?.teams || []}
                  onFinishAndCelebrate={handleFinishAndCelebrate}
                  onStartNewTournament={() => setIsCreating(true)}
                />
              )}
            </div>
          </div>
        )}

        {/* MODALE DI INSERIMENTO MANUALE RAPIDO PUNTEGGIO SCONTRO */}
        <MatchScoreEditModal
          editingMatch={editingMatch}
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
