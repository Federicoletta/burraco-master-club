import { useConfirm } from '../context/ConfirmContext';
import React, { useState, useMemo } from 'react';
import { 
  X, 
  Trophy, 
  Calendar, 
  Users, 
  PlayCircle, 
  CheckCircle2, 
  Plus, 
  Edit2, 
  Sparkles, 
  Clock,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/soundEffects';
import { 
  generateRoundRobinSchedule, 
  calculateTournamentStandings 
} from '../utils/tournament';
import { DEFAULT_TARGET_SCORES } from '../constants/burraco';

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
  const handleAssignPlayer = (playerName) => {
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
          // Se sono tutti pieni, sovrascrivi quello attivo
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
  };

  // Sincronizza squadre quando cambia numTeams nel form
  const handleNumTeamsChange = (count) => {
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
  };

  // Calcola tutti i match appiattiti
  const allMatches = useMemo(() => {
    if (!activeTournament?.rounds) return [];
    return activeTournament.rounds.flatMap(r => r.matches || []);
  }, [activeTournament?.rounds]);

  // Calcola classifica live
  const standings = useMemo(() => {
    if (!activeTournament?.teams) return [];
    return calculateTournamentStandings(activeTournament.teams, allMatches);
  }, [activeTournament?.teams, allMatches]);

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
          <form onSubmit={handleCreateTournament} className="overflow-y-auto pr-1 my-3 space-y-4 flex-1">
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
                  className="w-full px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
                  Traguardo Punti Partite
                </label>
                <select
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {DEFAULT_TARGET_SCORES.map(s => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SELETTORE NUMERO COPPIE */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Numero di Coppie Partecipanti: <strong className="text-amber-400 text-sm">{numTeams}</strong>
                </label>
                <span className="text-[11px] text-emerald-400/80">Minimo 2, consigliato 4 o 6</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[2, 3, 4, 5, 6, 8, 10].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleNumTeamsChange(n)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      numTeams === n
                        ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-md font-black'
                        : 'bg-emerald-950/70 border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/60'
                    }`}
                  >
                    {n} Coppie
                  </button>
                ))}
              </div>
            </div>

            {/* PARTECIPANTI RECENTI / RUBRICA PER INSERIMENTO RAPIDO */}
            {playersList && playersList.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-600/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Partecipanti Recenti</span>
                  </span>
                  <span className="text-[11px] text-emerald-400/80">
                    Tocca un nome per inserirlo al volo
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {playersList.map(name => {
                    // Controlla se questo partecipante è già assegnato in una delle coppie
                    const isAssigned = teamsForm.some(
                      t => t.player1.trim() === name.trim() || t.player2.trim() === name.trim()
                    );
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleAssignPlayer(name)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                          isAssigned
                            ? 'bg-emerald-900/40 text-emerald-400/60 border-emerald-800/40 opacity-70'
                            : 'bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 hover:text-white border-emerald-600/60 hover:border-amber-400 shadow-sm'
                        }`}
                        title={isAssigned ? `${name} (già inserito)` : `Inserisci ${name}`}
                      >
                        <span className="text-amber-400 text-xs font-black">+</span>
                        <span>{name}</span>
                        {isAssigned && <span className="text-[10px] text-emerald-400">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CONFIGURAZIONE FORMAZIONI COPPIE */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Composizione delle Coppie
                </label>
                <span className="text-[11px] text-emerald-400/80">
                  Compila i giocatori o usa i bottoni rapidi sopra
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[38vh] overflow-y-auto pr-1">
                {teamsForm.map((team, idx) => {
                  const isP1Active = activePlayerField.teamIndex === idx && activePlayerField.playerSlot === 1;
                  const isP2Active = activePlayerField.teamIndex === idx && activePlayerField.playerSlot === 2;

                  return (
                    <div key={team.id} className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-2">
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
                          className="text-right text-xs bg-transparent border-b border-emerald-700/60 text-white placeholder-emerald-500/50 font-bold focus:outline-none focus:border-amber-400 w-36"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Giocatore 1"
                          value={team.player1}
                          onFocus={() => setActivePlayerField({ teamIndex: idx, playerSlot: 1 })}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTeamsForm(prev => prev.map((item, i) => i === idx ? { ...item, player1: val } : item));
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-white text-xs placeholder-emerald-500/50 focus:outline-none transition-all ${
                            isP1Active
                              ? 'bg-emerald-900 border-2 border-amber-400 ring-2 ring-amber-400/20'
                              : 'bg-emerald-900/60 border border-emerald-700/50'
                          }`}
                          list="tournament-players-datalist"
                        />
                        <input
                          type="text"
                          placeholder="Giocatore 2"
                          value={team.player2}
                          onFocus={() => setActivePlayerField({ teamIndex: idx, playerSlot: 2 })}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTeamsForm(prev => prev.map((item, i) => i === idx ? { ...item, player2: val } : item));
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-white text-xs placeholder-emerald-500/50 focus:outline-none transition-all ${
                            isP2Active
                              ? 'bg-emerald-900 border-2 border-amber-400 ring-2 ring-amber-400/20'
                              : 'bg-emerald-900/60 border border-emerald-700/50'
                          }`}
                          list="tournament-players-datalist"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <datalist id="tournament-players-datalist">
                {playersList.map(p => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>

            {/* PULSANTI AZIONE CREAZIONE */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-emerald-700/50">
              {activeTournament && (
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold cursor-pointer"
                >
                  Annulla e Torna al Torneo Attivo
                </button>
              )}
              <button
                type="submit"
                className="ml-auto px-6 py-2.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs sm:text-sm shadow-md hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-950" />
                <span>Genera Torneo & Calendario</span>
              </button>
            </div>
          </form>
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
              
              {/* TAB 1: CLASSIFICA TORNEO */}
              {activeTab === 'standings' && (
                <div className="space-y-4">
                  
                  {/* PODIO DELLE PRIME 3 SQUADRE (se ci sono almeno 3 squadre) */}
                  {standings.length >= 3 && (
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center items-end">
                      
                      {/* 2° Posto (Argento) */}
                      <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-500/40 shadow-md">
                        <span className="text-xl sm:text-2xl block mb-0.5">🥈</span>
                        <span className="text-xs font-black text-slate-200 block truncate">
                          {standings[1]?.name}
                        </span>
                        <span className="text-[10px] text-emerald-300/70 block truncate mb-1">
                          {(standings[1]?.players || []).join(' & ')}
                        </span>
                        <span className="text-lg sm:text-xl font-black text-amber-300 block">
                          {standings[1]?.tournamentPoints} <span className="text-[10px] text-slate-300 font-normal">pt</span>
                        </span>
                        <span className="text-[9px] text-slate-400 block font-bold">2° POSTO</span>
                      </div>

                      {/* 1° Posto (Oro - più alto e in evidenza) */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/20 via-emerald-950/90 to-emerald-950/90 border-2 border-amber-400 shadow-xl ring-2 ring-amber-400/30">
                        <span className="text-2xl sm:text-3xl block mb-0.5">👑</span>
                        <span className="text-xs sm:text-sm font-black text-white block truncate">
                          {standings[0]?.name}
                        </span>
                        <span className="text-[10px] text-amber-200/80 block truncate mb-1">
                          {(standings[0]?.players || []).join(' & ')}
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-amber-400 block">
                          {standings[0]?.tournamentPoints} <span className="text-xs text-amber-200 font-bold">pt</span>
                        </span>
                        <span className="text-[10px] text-amber-300 block font-black uppercase tracking-wider">
                          1° IN CLASSIFICA
                        </span>
                      </div>

                      {/* 3° Posto (Bronzo) */}
                      <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-700/40 shadow-md">
                        <span className="text-xl sm:text-2xl block mb-0.5">🥉</span>
                        <span className="text-xs font-black text-amber-300/90 block truncate">
                          {standings[2]?.name}
                        </span>
                        <span className="text-[10px] text-emerald-300/70 block truncate mb-1">
                          {(standings[2]?.players || []).join(' & ')}
                        </span>
                        <span className="text-lg sm:text-xl font-black text-amber-300 block">
                          {standings[2]?.tournamentPoints} <span className="text-[10px] text-slate-300 font-normal">pt</span>
                        </span>
                        <span className="text-[9px] text-amber-500/80 block font-bold">3° POSTO</span>
                      </div>

                    </div>
                  )}

                  {/* TABELLA CLASSIFICA COMPLETA */}
                  <div className="rounded-2xl border border-emerald-700/50 overflow-hidden shadow-lg bg-emerald-950/80">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-emerald-900/80 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-300 border-b border-emerald-700/60">
                            <th className="py-2.5 px-3 text-center w-10">Pos</th>
                            <th className="py-2.5 px-3">Squadra & Giocatori</th>
                            <th className="py-2.5 px-3 text-center font-black text-amber-300">PT</th>
                            <th className="py-2.5 px-2 text-center">G</th>
                            <th className="py-2.5 px-2 text-center text-emerald-300">V</th>
                            <th className="py-2.5 px-2 text-center text-slate-400">N</th>
                            <th className="py-2.5 px-2 text-center text-rose-300">P</th>
                            <th className="py-2.5 px-2 text-right hidden sm:table-cell">PF</th>
                            <th className="py-2.5 px-2 text-right hidden sm:table-cell">PS</th>
                            <th className="py-2.5 px-3 text-right font-bold">Diff</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-800/40">
                          {standings.map((team, idx) => (
                            <tr 
                              key={team.id}
                              className={`transition-colors ${
                                idx === 0 
                                  ? 'bg-amber-400/10 font-bold' 
                                  : idx % 2 === 0 ? 'bg-emerald-950/40' : 'bg-transparent'
                              } hover:bg-emerald-800/30`}
                            >
                              <td className="py-2.5 px-3 text-center">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                                  idx === 0 
                                    ? 'bg-amber-400 text-emerald-950 shadow-xs' 
                                    : idx === 1 ? 'bg-slate-300 text-slate-950' 
                                    : idx === 2 ? 'bg-amber-700 text-white' 
                                    : 'text-emerald-300 bg-emerald-900/60'
                                }`}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-white text-xs sm:text-sm">
                                  {team.name}
                                </div>
                                <div className="text-[11px] text-emerald-300/80">
                                  {(team.players || []).join(' & ')}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="text-base sm:text-lg font-black text-amber-300">
                                  {team.tournamentPoints}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 text-center font-semibold text-emerald-100">{team.played}</td>
                              <td className="py-2.5 px-2 text-center font-bold text-emerald-400">{team.won}</td>
                              <td className="py-2.5 px-2 text-center font-medium text-slate-400">{team.drawn}</td>
                              <td className="py-2.5 px-2 text-center font-medium text-rose-400">{team.lost}</td>
                              <td className="py-2.5 px-2 text-right hidden sm:table-cell text-emerald-200">{team.pointsFor}</td>
                              <td className="py-2.5 px-2 text-right hidden sm:table-cell text-rose-300/80">{team.pointsAgainst}</td>
                              <td className="py-2.5 px-3 text-right">
                                <span className={`font-mono font-bold ${
                                  team.pointDifference > 0 
                                    ? 'text-emerald-400' 
                                    : team.pointDifference < 0 ? 'text-rose-400' : 'text-slate-400'
                                }`}>
                                  {team.pointDifference > 0 ? `+${team.pointDifference}` : team.pointDifference}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-[11px] text-emerald-300/80 flex items-center justify-between">
                    <span>Legenda: <strong>PT</strong> Punti Torneo (V=3, N=1, P=0) • <strong>Diff</strong> Differenza punti Burraco</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('schedule')}
                      className="text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Vedi Incontri</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: CALENDARIO INCONTRI & TAVOLI */}
              {activeTab === 'schedule' && (
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
                      Tutte le Giornate ({activeTournament.rounds?.length || 0})
                    </button>
                    {(activeTournament.rounds || []).map(r => (
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
                    {(activeTournament.rounds || [])
                      .filter(r => selectedRoundFilter === 'all' || r.roundNumber === selectedRoundFilter)
                      .map(round => (
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
                                      onClick={() => {
                                        onPlayMatch(match, activeTournament);
                                        onClose();
                                      }}
                                      className="px-3 py-1.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 cursor-pointer"
                                      title="Carica questo incontro sul foglio segnapunti dell'app"
                                    >
                                      <PlayCircle className="w-3.5 h-3.5 text-emerald-950" />
                                      <span>{isCompleted ? 'Rigioca' : 'Gioca al Tavolo ♠'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingMatch(match);
                                        setManualScore1(match.team1Score !== null ? String(match.team1Score) : '');
                                        setManualScore2(match.team2Score !== null ? String(match.team2Score) : '');
                                      }}
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
              )}

              {/* TAB 3: GESTIONE & CHIUSURA */}
              {activeTab === 'manage' && (
                <div className="space-y-4">
                  
                  {/* SCHEDA SQUADRE ISCRITTE */}
                  <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-700/40 space-y-3">
                    <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider m-0">
                      Coppie Iscritte al Torneo ({activeTournament.teams?.length || 0})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(activeTournament.teams || []).map((team, idx) => (
                        <div key={team.id} className="p-2.5 rounded-xl bg-emerald-900/40 border border-emerald-700/40 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white block">#{idx + 1} {team.name}</span>
                            <span className="text-[11px] text-emerald-300/80">{(team.players || []).join(' & ')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AZIONI CONCLUSIONE O NUOVO TORNEO */}
                  <div className="p-4 rounded-2xl bg-emerald-950/70 border border-amber-500/40 space-y-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider m-0">
                      Conclusione e Premiazione
                    </h3>
                    <p className="text-xs text-emerald-300/80 m-0">
                      Quando tutti gli incontri sono terminati, puoi dichiarare il torneo concluso. Verrà incoronata la coppia campione e il torneo verrà archiviato.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleFinishAndCelebrate}
                        className="px-4 py-2.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs sm:text-sm shadow-md hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-2"
                      >
                        <Trophy className="w-4 h-4 text-emerald-950" />
                        <span>Concludi Torneo & Premiazione 🎊</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCreating(true)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-amber-400" />
                        <span>Crea un Altro Torneo</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

        {/* MODALE DI INSERIMENTO MANUALE RAPIDO PUNTEGGIO SCONTRO */}
        {editingMatch && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
            <div className="w-full max-w-sm felt-card rounded-2xl border-2 border-amber-400 p-4 shadow-2xl text-center space-y-3">
              <h3 className="text-sm font-bold text-white m-0">
                Punteggio Rapido: {editingMatch.team1Name} vs {editingMatch.team2Name}
              </h3>
              <p className="text-[11px] text-emerald-300/80 m-0">
                Inserisci direttamente i punti realizzati dalle due coppie
              </p>
              <form onSubmit={handleSaveManualMatchScore} className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div>
                    <label className="text-[11px] font-bold text-amber-300 truncate block mb-1">
                      {editingMatch.team1Name}
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      required
                      placeholder="0"
                      value={manualScore1}
                      onChange={(e) => setManualScore1(e.target.value)}
                      className="w-full text-center text-xl font-black py-2 rounded-xl bg-emerald-900/80 border border-amber-400/50 text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-blue-300 truncate block mb-1">
                      {editingMatch.team2Name}
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      required
                      placeholder="0"
                      value={manualScore2}
                      onChange={(e) => setManualScore2(e.target.value)}
                      className="w-full text-center text-xl font-black py-2 rounded-xl bg-emerald-900/80 border border-blue-400/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-800/60">
                  <button
                    type="button"
                    onClick={() => setEditingMatch(null)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg gold-gradient text-emerald-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 cursor-pointer"
                  >
                    Salva Risultato
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
