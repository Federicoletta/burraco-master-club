import React, { useMemo } from 'react';
import { Users, Award, Dices, Wand2, Trash2, ArrowLeftRight, Check, Sparkles } from 'lucide-react';
import { DEFAULT_TARGET_SCORES } from '../../constants/burraco';
import PlayerAutocompleteInput from '../PlayerAutocompleteInput';
import { sound } from '../../utils/soundEffects';

export default function TournamentWizard({
  tournamentName,
  setTournamentName,
  targetScore,
  setTargetScore,
  scoringSystem = 'fibur',
  setScoringSystem,
  numTeams,
  onNumTeamsChange,
  currentUser = null,
  friendsList = [],
  teamsForm = [],
  setTeamsForm,
  activePlayerField,
  setActivePlayerField,
  onAssignPlayer,
  onCreateTournament,
  activeTournament,
  onCancelCreating
}) {
  const allAssignedPlayers = useMemo(() => {
    const list = [];
    (teamsForm || []).forEach(t => {
      if (t.player1 && t.player1.trim()) list.push(t.player1.trim());
      if (t.player2 && t.player2.trim()) list.push(t.player2.trim());
    });
    return list;
  }, [teamsForm]);

  const handlePlayerChange = (teamIdx, slot, newName) => {
    setTeamsForm(prev => {
      return prev.map((item, i) => {
        if (i !== teamIdx) return item;
        const updated = { ...item, [`player${slot}`]: newName };
        const p1 = slot === 1 ? newName.trim() : (item.player1 || '').trim();
        const p2 = slot === 2 ? newName.trim() : (item.player2 || '').trim();
        const combined = [p1, p2].filter(Boolean).join(' & ');

        const oldP1 = (item.player1 || '').trim();
        const oldP2 = (item.player2 || '').trim();
        const oldCombined = [oldP1, oldP2].filter(Boolean).join(' & ');

        const isDefault = !item.name ||
          item.name.startsWith('Coppia ') ||
          (oldCombined && item.name === oldCombined) ||
          item.name === oldP1 ||
          item.name === oldP2;

        if (isDefault) {
          updated.name = combined || `Coppia ${i + 1}`;
        }
        return updated;
      });
    });
  };

  const handleSwapPlayers = (teamIdx) => {
    setTeamsForm(prev => {
      return prev.map((item, i) => {
        if (i !== teamIdx) return item;
        const p1 = item.player1 || '';
        const p2 = item.player2 || '';
        const updated = { ...item, player1: p2, player2: p1 };
        const combined = [p2.trim(), p1.trim()].filter(Boolean).join(' & ');
        if (!item.name || item.name.startsWith('Coppia ') || item.name.includes('&')) {
          updated.name = combined || `Coppia ${i + 1}`;
        }
        return updated;
      });
    });
    sound.playTap();
  };

  const handleShufflePairs = () => {
    let pool = [...allAssignedPlayers];

    if (pool.length < numTeams * 2) {
      const candidates = [];
      if (currentUser) {
        const myName = (currentUser.displayName || currentUser.email?.split('@')[0] || 'Tu').trim();
        if (!pool.includes(myName)) candidates.push(myName);
      }
      (friendsList || []).forEach(f => {
        const name = (f.displayName || f.email || '').trim();
        if (name && !pool.includes(name) && !candidates.includes(name)) {
          candidates.push(name);
        }
      });

      const needed = (numTeams * 2) - pool.length;
      pool = [...pool, ...candidates.slice(0, needed)];
    }

    if (pool.length < 2) return;

    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setTeamsForm(prev => {
      let poolIdx = 0;
      return prev.map((t, i) => {
        const p1 = shuffled[poolIdx++] || '';
        const p2 = shuffled[poolIdx++] || '';
        const combined = [p1, p2].filter(Boolean).join(' & ');
        return {
          ...t,
          player1: p1,
          player2: p2,
          name: combined || `Coppia ${i + 1}`
        };
      });
    });

    sound.playCardFlip();
  };

  const handleAutoNameAll = () => {
    setTeamsForm(prev => {
      return prev.map((t, i) => {
        const p1 = (t.player1 || '').trim();
        const p2 = (t.player2 || '').trim();
        const combined = [p1, p2].filter(Boolean).join(' & ');
        return {
          ...t,
          name: combined || `Coppia ${i + 1}`
        };
      });
    });
    sound.playTap();
  };

  const handleClearAllPlayers = () => {
    setTeamsForm(prev => {
      return prev.map((t, i) => ({
        ...t,
        player1: '',
        player2: '',
        name: `Coppia ${i + 1}`
      }));
    });
    sound.playTap();
  };

  return (
    <form onSubmit={onCreateTournament} className="overflow-y-auto pr-0.5 my-3 space-y-4 flex-1">
      {/* NOME TORNEO & TRAGUARDO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold club-text-gold uppercase tracking-wider mb-1.5">
            Nome Torneo
          </label>
          <input
            type="text"
            required
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            placeholder="Es: Torneo d'Autunno"
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl club-input text-sm font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold club-text-gold uppercase tracking-wider mb-1.5">
            Traguardo Partite
          </label>
          <select
            value={targetScore}
            onChange={(e) => setTargetScore(Number(e.target.value))}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-xl club-input text-sm font-semibold cursor-pointer"
          >
            {DEFAULT_TARGET_SCORES.map(s => (
              <option key={s.value} value={s.value} className="bg-zinc-900 text-white">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SISTEMA PUNTEGGIO */}
      <div className="p-3.5 rounded-2xl club-inset space-y-2.5">
        <div className="text-xs font-bold club-text-gold uppercase tracking-wider flex items-center gap-1.5">
          <Award className="w-4 h-4" />
          <span>Sistema di Punteggio</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setScoringSystem && setScoringSystem('fibur')}
            className={`min-h-[64px] p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              scoringSystem === 'fibur'
                ? 'club-card border-amber-400/75 ring-1 ring-amber-400/30'
                : 'border-white/10 hover:border-white/25'
            }`}
          >
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-xs sm:text-sm font-bold text-white">FIBUR Victory Points (20-0)</span>
              <span className="text-[11px] font-bold club-text-gold shrink-0">Ufficiale</span>
            </div>
            <p className="text-xs club-text-subtle m-0">
              Converte lo scarto punti in VP federali da 10-10 a 20-0.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setScoringSystem && setScoringSystem('classic')}
            className={`min-h-[64px] p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              scoringSystem === 'classic'
                ? 'club-card border-amber-400/75 ring-1 ring-amber-400/30'
                : 'border-white/10 hover:border-white/25'
            }`}
          >
            <div className="text-xs sm:text-sm font-bold text-white mb-1">
              Classico (3-1-0)
            </div>
            <p className="text-xs club-text-subtle m-0">
              3 punti per vittoria, 1 per pareggio, 0 per sconfitta.
            </p>
          </button>
        </div>
      </div>

      {/* NUMERO COPPIE */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Coppie Partecipanti: <strong className="font-mono-num club-text-gold text-sm">{numTeams}</strong>
          </span>
          <span className="text-xs club-text-subtle">Consigliato 4 o 6</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onNumTeamsChange(n)}
              className={`min-h-[40px] px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                numTeams === n
                  ? 'gold-gradient border-amber-300'
                  : 'club-btn-secondary club-text-muted hover:text-white'
              }`}
            >
              {n} Coppie
            </button>
          ))}
        </div>
      </div>

      {/* AMICI CON UN TOCCO */}
      {(currentUser || (friendsList && friendsList.length > 0)) && (
        <div className="p-3.5 rounded-2xl club-inset space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold club-text-gold flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>Assegna Amici con un Tocco</span>
            </span>
            <span className="text-[11px] font-semibold club-text-muted">
              Slot: Coppia #{activePlayerField.teamIndex + 1} (G{activePlayerField.playerSlot})
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {currentUser && (() => {
              const myName = (currentUser.displayName || currentUser.email?.split('@')[0] || 'Tu').trim();
              const assignedTeamIdx = teamsForm.findIndex(
                t => (t.player1 || '').trim().toLowerCase() === myName.toLowerCase() ||
                     (t.player2 || '').trim().toLowerCase() === myName.toLowerCase()
              );
              const isAssigned = assignedTeamIdx !== -1;

              return (
                <button
                  key="me-chip"
                  type="button"
                  onClick={() => onAssignPlayer(myName)}
                  className={`min-h-[38px] px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isAssigned
                      ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/60'
                      : 'club-btn-secondary text-white'
                  }`}
                >
                  <span>{myName} (Tu)</span>
                  {isAssigned && (
                    <span className="font-mono-num text-[11px] text-emerald-300 flex items-center gap-0.5">
                      <Check className="w-3 h-3" />#{assignedTeamIdx + 1}
                    </span>
                  )}
                </button>
              );
            })()}

            {(friendsList || []).map(f => {
              const friendName = (f.displayName || f.email || 'Amico').trim();
              const assignedTeamIdx = teamsForm.findIndex(
                t => (t.player1 || '').trim().toLowerCase() === friendName.toLowerCase() ||
                     (t.player2 || '').trim().toLowerCase() === friendName.toLowerCase()
              );
              const isAssigned = assignedTeamIdx !== -1;

              return (
                <button
                  key={f.uid || f.email || friendName}
                  type="button"
                  onClick={() => onAssignPlayer(friendName)}
                  className={`min-h-[38px] px-3 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isAssigned
                      ? 'bg-amber-400/20 text-amber-200 border-amber-400/60'
                      : 'club-btn-secondary club-text-muted hover:text-white'
                  }`}
                >
                  <span>{friendName}</span>
                  {isAssigned && (
                    <span className="font-mono-num text-[11px] club-text-gold flex items-center gap-0.5">
                      <Check className="w-3 h-3" />#{assignedTeamIdx + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* COMPOSIZIONE COPPIE */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold club-text-gold uppercase tracking-wider">
            Formazioni ({teamsForm.length})
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleShufflePairs}
              className="min-h-[38px] px-3 rounded-xl club-btn-secondary club-text-gold text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Sorteggia</span>
            </button>

            <button
              type="button"
              onClick={handleAutoNameAll}
              className="min-h-[38px] px-3 rounded-xl club-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5 club-text-gold" />
              <span>Auto-nomina</span>
            </button>

            <button
              type="button"
              onClick={handleClearAllPlayers}
              className="min-h-[38px] px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Svuota</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[42vh] overflow-y-auto pr-0.5">
          {teamsForm.map((team, idx) => {
            const isP1Active = activePlayerField.teamIndex === idx && activePlayerField.playerSlot === 1;
            const isP2Active = activePlayerField.teamIndex === idx && activePlayerField.playerSlot === 2;

            return (
              <div key={team.id} className="p-3 rounded-2xl club-inset space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold club-text-gold shrink-0">
                    Coppia #{idx + 1}
                  </span>
                  <input
                    type="text"
                    placeholder={`Nome Coppia ${idx + 1}`}
                    value={team.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTeamsForm(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                    }}
                    className="px-2.5 py-1.5 rounded-lg club-input text-xs font-bold w-full text-right"
                  />
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
                  <PlayerAutocompleteInput
                    value={team.player1 || ''}
                    onChange={(val) => handlePlayerChange(idx, 1, val)}
                    placeholder="Giocatore 1"
                    currentUser={currentUser}
                    friendsList={friendsList}
                    alreadySelected={allAssignedPlayers}
                    onFocus={() => setActivePlayerField({ teamIndex: idx, playerSlot: 1 })}
                    className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-all ${
                      isP1Active
                        ? 'club-card border-amber-400 ring-1 ring-amber-400/40'
                        : 'club-input'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => handleSwapPlayers(idx)}
                    className="min-w-[36px] min-h-[36px] rounded-xl club-btn-secondary flex items-center justify-center club-text-muted hover:text-amber-300 cursor-pointer"
                    aria-label="Inverti giocatori"
                    title="Inverti Giocatore 1 e 2"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>

                  <PlayerAutocompleteInput
                    value={team.player2 || ''}
                    onChange={(val) => handlePlayerChange(idx, 2, val)}
                    placeholder="Giocatore 2"
                    currentUser={currentUser}
                    friendsList={friendsList}
                    alreadySelected={allAssignedPlayers}
                    onFocus={() => setActivePlayerField({ teamIndex: idx, playerSlot: 2 })}
                    className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-all ${
                      isP2Active
                        ? 'club-card border-amber-400 ring-1 ring-amber-400/40'
                        : 'club-input'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AVVIO TORNEO */}
      <div className="pt-3 border-t club-divider flex flex-wrap items-center justify-between gap-3">
        {activeTournament && (
          <button
            type="button"
            onClick={onCancelCreating}
            className="min-h-[44px] px-4 rounded-xl club-btn-secondary text-xs font-semibold cursor-pointer"
          >
            Torna al Torneo Attivo
          </button>
        )}
        <button
          type="submit"
          className="ml-auto min-h-[46px] px-6 rounded-xl gold-gradient font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Genera Calendario e Avvia</span>
        </button>
      </div>
    </form>
  );
}
