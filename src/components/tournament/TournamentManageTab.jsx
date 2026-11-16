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
}) {
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editPlayer1, setEditPlayer1] = useState('');
  const [editPlayer2, setEditPlayer2] = useState('');

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
      {/* COPPIE PARTECIPANTI */}
      <div className="p-4 rounded-2xl club-inset space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold club-text-gold uppercase tracking-wider m-0 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>Coppie Partecipanti ({teams.length})</span>
          </h3>
          <span className="text-xs club-text-subtle">
            Modifica nomi o giocatori in corsa
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
                    ? 'club-card border-amber-400/75 ring-1 ring-amber-400/30'
                    : 'bg-black/20 club-divider'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold club-text-gold">Coppia #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleSaveEditTeam(team.id)}
                        className="min-h-[36px] px-3 rounded-xl gold-gradient font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Salva</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Nome Coppia"
                      value={editTeamName}
                      onChange={(e) => setEditTeamName(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl club-input text-xs font-bold"
                    />

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
                      <PlayerAutocompleteInput
                        value={editPlayer1}
                        onChange={handlePlayer1Change}
                        placeholder="Giocatore 1"
                        currentUser={currentUser}
                        friendsList={friendsList}
                        alreadySelected={otherAssignedPlayers}
                        className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl club-input text-xs"
                      />

                      <button
                        type="button"
                        onClick={handleSwapEditPlayers}
                        className="min-w-[36px] min-h-[36px] rounded-xl club-btn-secondary flex items-center justify-center club-text-muted hover:text-amber-300 cursor-pointer"
                        title="Inverti Giocatore 1 e 2"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      </button>

                      <PlayerAutocompleteInput
                        value={editPlayer2}
                        onChange={handlePlayer2Change}
                        placeholder="Giocatore 2"
                        currentUser={currentUser}
                        friendsList={friendsList}
                        alreadySelected={otherAssignedPlayers}
                        className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl club-input text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-white text-sm block truncate">
                        #{idx + 1} {team.name}
                      </span>
                      <span className="text-xs club-text-subtle block truncate">
                        {(team.players && team.players.length > 0) ? team.players.join(' & ') : 'Nessun giocatore inserito'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartEditTeam(team)}
                      className="min-w-[40px] min-h-[40px] rounded-xl club-btn-secondary flex items-center justify-center cursor-pointer shrink-0"
                      aria-label={`Modifica ${team.name}`}
                      title="Modifica coppia"
                    >
                      <Edit2 className="w-4 h-4 club-text-gold" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CONCLUSIONE & PREMIAZIONE */}
      {activeTournament && (
        <div className="p-4 rounded-2xl club-card border-amber-400/50 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 club-text-gold" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider m-0">
              Conclusione e Premiazione
            </h3>
          </div>
          <p className="text-xs club-text-muted m-0">
            Proclama i campioni e salva i risultati ufficiali nell&apos;Albo d&apos;Oro.
          </p>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onFinishAndCelebrate}
              className="min-h-[44px] px-4 py-2 rounded-xl gold-gradient font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span>Concludi e Premia</span>
            </button>

            <button
              type="button"
              onClick={onStartNewTournament}
              className="min-h-[44px] px-4 py-2 rounded-xl club-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 club-text-gold" />
              <span>Avvia Nuovo Torneo</span>
            </button>
          </div>
        </div>
      )}

      {/* ALBO D'ORO */}
      <div className="p-4 rounded-2xl club-inset space-y-3">
        <h3 className="text-xs font-bold club-text-gold uppercase tracking-wider m-0 flex items-center gap-1.5">
          <Award className="w-4 h-4" />
          <span>Albo d&apos;Oro ({tournamentsHistory.length})</span>
        </h3>

        {tournamentsHistory.length === 0 ? (
          <p className="text-xs club-text-subtle m-0 py-1">
            Nessun torneo archiviato al momento. I tornei conclusi saranno salvati qui.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
            {tournamentsHistory.map((t) => {
              const completedDate = t.completedAt
                ? new Date(t.completedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Concluso';
              return (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-black/20 border club-divider flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-white text-sm truncate">{t.name}</div>
                    <div className="text-[11px] club-text-subtle flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 club-text-gold" /> {completedDate}
                      </span>
                      <span>·</span>
                      <span>{t.teams?.length || 0} coppie</span>
                      <span>·</span>
                      <span className="club-text-gold font-semibold">
                        {t.scoringSystem === 'classic' ? 'Classico 3-1-0' : 'FIBUR VP'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onViewHistoricalStandings && (
                      <button
                        type="button"
                        onClick={() => onViewHistoricalStandings(t)}
                        className="min-h-[40px] px-3 rounded-xl club-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 club-text-gold" />
                        <span>Classifica</span>
                      </button>
                    )}

                    {onDeleteHistoricalTournament && (
                      <button
                        type="button"
                        onClick={() => onDeleteHistoricalTournament(t.id)}
                        className="min-w-[40px] min-h-[40px] rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/35 flex items-center justify-center cursor-pointer"
                        aria-label={`Elimina ${t.name}`}
                        title="Elimina torneo dall'archivio"
                      >
                        <Trash2 className="w-4 h-4" />
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
