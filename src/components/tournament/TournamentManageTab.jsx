import React, { useState, useMemo } from 'react';
import { Trophy, Plus, Edit2, Check, Trash2, Eye, Award, Calendar, Users, ArrowLeftRight } from 'lucide-react';
import PlayerAutocompleteInput from '../PlayerAutocompleteInput';
import { sound } from '../../utils/soundEffects';

export default function TournamentManageTab({
  activeTournament,
  teams = [],
  onUpdateTeams,
  onFinishAndCelebrate,
  onStartNewTournament,
  tournamentsHistory = [],
  onDeleteHistoricalTournament,
  onViewHistoricalStandings,
  currentUser = null,
  friendsList = [],
  playersList = [],
}) {
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editPlayer1, setEditPlayer1] = useState('');
  const [editPlayer2, setEditPlayer2] = useState('');

  // Giocatori assegnati nelle altre squadre per evitare duplicati
  const otherAssignedPlayers = useMemo(() => {
    const list = [];
    (teams || []).forEach(t => {
      if (t.id === editingTeamId) return;
      if (t.players?.[0]) list.push(t.players[0].trim());
      if (t.players?.[1]) list.push(t.players[1].trim());
    });
    return list;
  }, [teams, editingTeamId]);

  const handleStartEditTeam = (team) => {
    setEditingTeamId(team.id);
    setEditTeamName(team.name || '');
    setEditPlayer1(team.players?.[0] || '');
    setEditPlayer2(team.players?.[1] || '');
  };

  const handlePlayer1Change = (val) => {
    setEditPlayer1(val);
    const p1 = val.trim();
    const p2 = editPlayer2.trim();
    const combined = [p1, p2].filter(Boolean).join(' & ');
    if (!editTeamName || editTeamName.startsWith('Coppia ') || editTeamName.includes('&')) {
      setEditTeamName(combined || 'Coppia');
    }
  };

  const handlePlayer2Change = (val) => {
    setEditPlayer2(val);
    const p1 = editPlayer1.trim();
    const p2 = val.trim();
    const combined = [p1, p2].filter(Boolean).join(' & ');
    if (!editTeamName || editTeamName.startsWith('Coppia ') || editTeamName.includes('&')) {
      setEditTeamName(combined || 'Coppia');
    }
  };

  const handleSwapEditPlayers = () => {
    const p1 = editPlayer2;
    const p2 = editPlayer1;
    setEditPlayer1(p1);
    setEditPlayer2(p2);
    const combined = [p1.trim(), p2.trim()].filter(Boolean).join(' & ');
    if (!editTeamName || editTeamName.startsWith('Coppia ') || editTeamName.includes('&')) {
      setEditTeamName(combined || 'Coppia');
    }
    sound.playTap();
  };

  const handleSaveEditTeam = (teamId) => {
    if (!onUpdateTeams) return;
    const p = [editPlayer1.trim(), editPlayer2.trim()].filter(Boolean);
    const updatedName = editTeamName.trim() || p.join(' & ') || 'Coppia';

    try {
      onUpdateTeams(teamId, {
        name: updatedName,
        players: p,
      });
      sound.playTap();
    } catch (err) {
      console.error('Errore modifica squadra torneo:', err);
    } finally {
      setEditingTeamId(null);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 1. SCHEDA SQUADRE ISCRITTE CON MODIFICA AL VOLO */}
      <div className="p-4 rounded-2xl felt-card border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider m-0 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Coppie Partecipanti ({teams.length})</span>
          </h3>
          <span className="text-[11px] text-white/70">
            Tocca la matita per modificare nomi o giocatori
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {teams.map((team, idx) => {
            const isEditing = editingTeamId === team.id;

            return (
              <div 
                key={team.id} 
                className={`p-3 rounded-xl border transition-all ${
                  isEditing 
                    ? 'bg-amber-400/15 border-amber-400 ring-2 ring-amber-400/30' 
                    : 'bg-black/30 border-white/10'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-amber-300">Coppia #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleSaveEditTeam(team.id)}
                        className="px-2.5 py-1 rounded-lg gold-gradient text-emerald-950 font-black text-xs flex items-center gap-1 cursor-pointer shadow-xs active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Salva</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Nome Coppia"
                      value={editTeamName}
                      onChange={(e) => setEditTeamName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/20 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                    />

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
                      <PlayerAutocompleteInput
                        value={editPlayer1}
                        onChange={handlePlayer1Change}
                        placeholder="Giocatore 1"
                        currentUser={currentUser}
                        friendsList={friendsList}
                        alreadySelected={otherAssignedPlayers}
                        className="w-full px-2.5 py-1 rounded-lg bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                      />

                      <button
                        type="button"
                        onClick={handleSwapEditPlayers}
                        className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-white/70 hover:text-amber-300 transition-colors cursor-pointer border border-white/10"
                        title="Inverti Giocatore 1 e 2"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                      </button>

                      <PlayerAutocompleteInput
                        value={editPlayer2}
                        onChange={handlePlayer2Change}
                        placeholder="Giocatore 2"
                        currentUser={currentUser}
                        friendsList={friendsList}
                        alreadySelected={otherAssignedPlayers}
                        className="w-full px-2.5 py-1 rounded-lg bg-black/40 border border-white/15 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-white text-xs sm:text-sm block truncate">
                        #{idx + 1} {team.name}
                      </span>
                      <span className="text-[11px] text-white/70 block truncate">
                        {(team.players && team.players.length > 0) ? team.players.join(' & ') : 'Nessun giocatore inserito'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartEditTeam(team)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer shrink-0"
                      title="Modifica squadra"
                    >
                      <Edit2 className="w-3 h-3 text-amber-300" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. AZIONI CONCLUSIONE & PREMIAZIONE TORNEO */}
      {activeTournament && (
        <div className="p-4 rounded-2xl felt-card border border-amber-500/40 space-y-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider m-0">
              Conclusione & Premiazione Ufficiale
            </h3>
          </div>
          <p className="text-xs text-white/75 m-0">
            Dichiara concluso il torneo per incoronare i campioni, aggiornare l'Albo d'Oro e archiviare i risultati finali.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onFinishAndCelebrate}
              className="px-4 py-2.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs sm:text-sm shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-emerald-950" />
              <span>Concludi Torneo & Premiazione 🎊</span>
            </button>

            <button
              type="button"
              onClick={onStartNewTournament}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Avvia Nuovo Torneo</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. ALBO D'ORO: ARCHIVIO TORNEI PASSATI */}
      <div className="p-4 rounded-2xl felt-card border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider m-0 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Albo d'Oro & Tornei Passati ({tournamentsHistory.length})</span>
          </h3>
        </div>

        {tournamentsHistory.length === 0 ? (
          <p className="text-xs text-white/60 m-0 py-2">
            Nessun torneo archiviato al momento. I tornei conclusi verranno salvati automaticamente qui.
          </p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {tournamentsHistory.map((t) => {
              const completedDate = t.completedAt ? new Date(t.completedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Concluso';
              return (
                <div 
                  key={t.id} 
                  className="p-3 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs sm:text-sm truncate">{t.name}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {t.scoringSystem === 'classic' ? 'Classico 3-1-0' : 'FIBUR VP'}
                      </span>
                    </div>
                    <div className="text-[11px] text-white/70 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-400" /> {completedDate}
                      </span>
                      <span>•</span>
                      <span>{t.teams?.length || 0} coppie</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onViewHistoricalStandings && (
                      <button
                        type="button"
                        onClick={() => onViewHistoricalStandings(t)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                        title="Visualizza classifica finale completa"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Classifica</span>
                      </button>
                    )}

                    {onDeleteHistoricalTournament && (
                      <button
                        type="button"
                        onClick={() => onDeleteHistoricalTournament(t.id)}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs cursor-pointer transition-all"
                        title="Elimina torneo dall'archivio"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
