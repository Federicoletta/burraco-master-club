import React, { useMemo } from 'react';
import { Users, Sparkles, Award, Dices, Wand2, Trash2, ArrowLeftRight, Check, User } from 'lucide-react';
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
  playersList = [],
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
  // Elenco normalizzato di tutti i giocatori attualmente inseriti per evitare duplicati
  const allAssignedPlayers = useMemo(() => {
    const list = [];
    (teamsForm || []).forEach(t => {
      if (t.player1 && t.player1.trim()) list.push(t.player1.trim());
      if (t.player2 && t.player2.trim()) list.push(t.player2.trim());
    });
    return list;
  }, [teamsForm]);

  // Gestione modifica giocatore con auto-aggiornamento intelligente del nome della coppia
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

        // Se il nome era generico (Coppia X, vuoto o derivato dai vecchi nomi), lo sincronizziamo
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

  // Inverti Giocatore 1 e Giocatore 2 all'interno della stessa coppia
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

  // 🎲 Sorteggia Coppie a Caso (Randomizer)
  const handleShufflePairs = () => {
    // Raccogli tutti i giocatori attualmente inseriti
    let pool = [...allAssignedPlayers];

    // Se sono meno dei necessari per riempire le coppie, attingi dagli amici e dai partecipanti recenti
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
      (playersList || []).forEach(name => {
        const trimmed = (name || '').trim();
        if (trimmed && !pool.includes(trimmed) && !candidates.includes(trimmed)) {
          candidates.push(trimmed);
        }
      });

      // Aggiungi candidati fino a riempire gli slot
      const needed = (numTeams * 2) - pool.length;
      pool = [...pool, ...candidates.slice(0, needed)];
    }

    if (pool.length < 2) {
      return;
    }

    // Fisher-Yates shuffle
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

  // ✨ Auto-nomina tutte le coppie secondo i nomi dei componenti
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

  // 🧹 Pulisci tutte le formazioni
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

  // Filtra partecipanti locali escludendo chi è già tra gli amici o è l'utente corrente
  const uniqueLocalPlayers = useMemo(() => {
    const myName = (currentUser?.displayName || currentUser?.email?.split('@')[0] || '').toLowerCase();
    const friendNames = new Set((friendsList || []).map(f => (f.displayName || f.email || '').toLowerCase()));
    return (playersList || []).filter(name => {
      const low = (name || '').toLowerCase();
      return low && low !== myName && !friendNames.has(low);
    });
  }, [playersList, currentUser, friendsList]);

  return (
    <form onSubmit={onCreateTournament} className="overflow-y-auto pr-1 my-3 space-y-4 flex-1">
      
      {/* 1. NOME TORNEO & TRAGUARDO PARTITE */}
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
            className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider mb-1">
            Traguardo Punti Partite
          </label>
          <select
            value={targetScore}
            onChange={(e) => setTargetScore(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl bg-black/30 border border-white/15 text-white text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {DEFAULT_TARGET_SCORES.map(s => (
              <option key={s.value} value={s.value} className="bg-zinc-900 text-white">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. FORMULA E SISTEMA PUNTEGGIO (FIBUR VICTORY POINTS VS CLASSICO) */}
      <div className="p-3 rounded-2xl felt-card border border-amber-500/30 space-y-2">
        <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Sistema di Punteggio & Formula di Calcolo</span>
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Opzione 1: FIBUR Ufficiale Victory Points */}
          <button
            type="button"
            onClick={() => setScoringSystem && setScoringSystem('fibur')}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              scoringSystem === 'fibur'
                ? 'bg-amber-400/20 border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                : 'bg-black/25 border-white/10 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <span>🥇 FIBUR Victory Points (20-0)</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-amber-400 text-emerald-950 uppercase">
                Ufficiale
              </span>
            </div>
            <p className="text-[11px] text-white/70 m-0">
              Conversione dello scarto punti in VP da 10-10 a 20-0 secondo la scala federale nazionale FIBUR.
            </p>
          </button>

          {/* Opzione 2: Classico (3-1-0) */}
          <button
            type="button"
            onClick={() => setScoringSystem && setScoringSystem('classic')}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
              scoringSystem === 'classic'
                ? 'bg-amber-400/20 border-amber-400 ring-2 ring-amber-400/30 shadow-md'
                : 'bg-black/25 border-white/10 hover:border-white/30'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-xs font-black text-white">
                ⚽ Classico (3 pt Vittoria, 1 pt Pareggio)
              </span>
            </div>
            <p className="text-[11px] text-white/70 m-0">
              3 punti a chi vince l'incontro, 1 punto per pareggio, 0 per sconfitta.
            </p>
          </button>
        </div>
      </div>

      {/* 3. SELETTORE NUMERO COPPIE */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-white uppercase tracking-wider">
            Numero di Coppie Partecipanti: <strong className="text-amber-400 text-sm">{numTeams}</strong>
          </label>
          <span className="text-[11px] text-white/70">Minimo 2, consigliato 4 o 6</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onNumTeamsChange(n)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                numTeams === n
                  ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-md font-black'
                  : 'bg-black/30 border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              {n} Coppie
            </button>
          ))}
        </div>
      </div>

      {/* 4. RUBRICA AMICI ACCETTATI & PARTECIPANTI (Inserimento Rapido con un Tocco) */}
      <div className="p-3 rounded-xl felt-card border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Inserimento Rapido con un Tocco</span>
          </span>
          <span className="text-[11px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
            Slot attivo: Coppia #{activePlayerField.teamIndex + 1} (G{activePlayerField.playerSlot})
          </span>
        </div>

        {/* Amici Burraco Club (Google) con Amicizia Accettata & Account Personale */}
        {(currentUser || (friendsList && friendsList.length > 0)) && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-amber-200 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Amici Burraco Club (Amicizie Accettate):</span>
              </span>
              <span className="text-[10px] text-white/60">
                {(friendsList || []).length} amici disponibili
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {/* Chip Utente Personale "Tu" */}
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      isAssigned
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 ring-1 ring-emerald-400/30'
                        : 'bg-emerald-950/80 hover:bg-emerald-900 text-white border-emerald-400/60 shadow-sm'
                    }`}
                    title={isAssigned ? `Assegnato a Coppia #${assignedTeamIdx + 1} (Tocca per rimuovere)` : `Inserisci ${myName}`}
                  >
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="" className="w-4 h-4 rounded-full border border-emerald-400 object-cover" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-emerald-400 text-emerald-950 font-black text-[9px] flex items-center justify-center">
                        {(currentUser.displayName || 'T').slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span>{myName} (Tu)</span>
                    {isAssigned ? (
                      <span className="text-[10px] font-black text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>#{assignedTeamIdx + 1}</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 text-xs font-black">+</span>
                    )}
                  </button>
                );
              })()}

              {/* Chips Amici con Amicizia Accettata */}
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                      isAssigned
                        ? 'bg-amber-400/20 text-amber-200 border-amber-400 ring-1 ring-amber-400/30'
                        : 'bg-black/40 hover:bg-white/10 text-white border-white/20 hover:border-amber-400 shadow-sm'
                    }`}
                    title={isAssigned ? `Assegnato a Coppia #${assignedTeamIdx + 1} (Tocca per rimuovere)` : `Inserisci ${friendName}`}
                  >
                    {f.photoURL ? (
                      <img src={f.photoURL} alt="" className="w-4 h-4 rounded-full border border-amber-400 object-cover" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-amber-400 text-emerald-950 font-black text-[9px] flex items-center justify-center">
                        {friendName.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span>{friendName}</span>
                    {isAssigned ? (
                      <span className="text-[10px] font-black text-amber-400 flex items-center gap-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>#{assignedTeamIdx + 1}</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 text-xs font-black">+</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Partecipanti Recenti (Ospiti / Storico) */}
        {uniqueLocalPlayers && uniqueLocalPlayers.length > 0 && (
          <div className="space-y-1.5 pt-1.5 border-t border-white/10">
            <span className="text-[11px] text-white/70 block">
              Partecipanti Recenti (Ospiti / Locali):
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {uniqueLocalPlayers.map(name => {
                const assignedTeamIdx = teamsForm.findIndex(
                  t => (t.player1 || '').trim().toLowerCase() === name.trim().toLowerCase() ||
                       (t.player2 || '').trim().toLowerCase() === name.trim().toLowerCase()
                );
                const isAssigned = assignedTeamIdx !== -1;

                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onAssignPlayer(name)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                      isAssigned
                        ? 'bg-white/5 text-white/50 border-white/10 opacity-70'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/15 hover:border-amber-400'
                    }`}
                    title={isAssigned ? `${name} (assegnato a Coppia #${assignedTeamIdx + 1})` : `Inserisci ${name}`}
                  >
                    <User className="w-3 h-3 text-white/60" />
                    <span>{name}</span>
                    {isAssigned ? (
                      <span className="text-[10px] text-amber-400 font-bold">✓ #{assignedTeamIdx + 1}</span>
                    ) : (
                      <span className="text-amber-400 text-xs font-black">+</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. CONFIGURAZIONE FORMAZIONI COPPIE */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
            Composizione delle Coppie ({teamsForm.length})
          </label>

          {/* Barra Strumenti Intelligenti */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShufflePairs}
              className="px-2.5 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-xs"
              title="Mischia a caso i partecipanti creando coppie a sorpresa"
            >
              <Dices className="w-3.5 h-3.5 text-amber-400" />
              <span>🎲 Sorteggia Coppie</span>
            </button>

            <button
              type="button"
              onClick={handleAutoNameAll}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
              title="Rinomina tutte le coppie come 'Nome1 & Nome2'"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Auto-nomina</span>
            </button>

            <button
              type="button"
              onClick={handleClearAllPlayers}
              className="px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-400/30 text-red-300 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95"
              title="Svuota tutti gli slot per reinserire da zero"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
              <span>Svuota</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[42vh] overflow-y-auto pr-1">
          {teamsForm.map((team, idx) => {
            const isP1Active = activePlayerField.teamIndex === idx && activePlayerField.playerSlot === 1;
            const isP2Active = activePlayerField.teamIndex === idx && activePlayerField.playerSlot === 2;

            return (
              <div key={team.id} className="p-3 rounded-xl felt-card border border-white/10 space-y-2.5 shadow-sm">
                
                {/* Nome Coppia */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-amber-300 flex items-center gap-1 shrink-0">
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
                    className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/15 text-xs text-white font-bold w-full text-right focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* Giocatori con Autocompletamento e Tasto Scambio Ruoli */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
                  {/* Giocatore 1 */}
                  <div className="relative">
                    <PlayerAutocompleteInput
                      value={team.player1 || ''}
                      onChange={(val) => handlePlayerChange(idx, 1, val)}
                      placeholder="Giocatore 1"
                      currentUser={currentUser}
                      friendsList={friendsList}
                      availablePlayers={playersList}
                      alreadySelected={allAssignedPlayers}
                      onFocus={() => setActivePlayerField({ teamIndex: idx, playerSlot: 1 })}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white focus:outline-none transition-all ${
                        isP1Active
                          ? 'bg-amber-400/20 border-2 border-amber-400 ring-2 ring-amber-400/30'
                          : 'bg-black/30 border border-white/15'
                      }`}
                    />
                    {isP1Active && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2 pointer-events-none">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                      </span>
                    )}
                  </div>

                  {/* Pulsante Inverti Posizione */}
                  <button
                    type="button"
                    onClick={() => handleSwapPlayers(idx)}
                    className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-white/70 hover:text-amber-300 transition-colors cursor-pointer border border-white/10"
                    title="Inverti Giocatore 1 e 2"
                  >
                    <ArrowLeftRight className="w-3 h-3" />
                  </button>

                  {/* Giocatore 2 */}
                  <div className="relative">
                    <PlayerAutocompleteInput
                      value={team.player2 || ''}
                      onChange={(val) => handlePlayerChange(idx, 2, val)}
                      placeholder="Giocatore 2"
                      currentUser={currentUser}
                      friendsList={friendsList}
                      availablePlayers={playersList}
                      alreadySelected={allAssignedPlayers}
                      onFocus={() => setActivePlayerField({ teamIndex: idx, playerSlot: 2 })}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white focus:outline-none transition-all ${
                        isP2Active
                          ? 'bg-amber-400/20 border-2 border-amber-400 ring-2 ring-amber-400/30'
                          : 'bg-black/30 border border-white/15'
                      }`}
                    />
                    {isP2Active && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2 pointer-events-none">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* AZIONI AVVIO TORNEO */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
        {activeTournament && (
          <button
            type="button"
            onClick={onCancelCreating}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Annulla e Torna al Torneo Attivo
          </button>
        )}
        <button
          type="submit"
          className="ml-auto px-6 py-2.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs sm:text-sm shadow-xl hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-emerald-950" />
          <span>Genera Calendario & Avvia Torneo 🏆</span>
        </button>
      </div>

    </form>
  );
}
