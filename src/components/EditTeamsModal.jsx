import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, ArrowLeftRight, Check, AlertCircle, Sparkles, User, Wand2, Plus } from 'lucide-react';
import PlayerAutocompleteInput from './PlayerAutocompleteInput';
import { useAlert } from '../context/ConfirmContext';

export default function EditTeamsModal({
  isOpen,
  onClose,
  activeGame,
  playersList = [],
  tablePlayers = [],
  currentUser = null,
  friendsList = [],
  onSave
}) {
  const isTrio = activeGame?.mode === 'trio';
  const isPairs = !isTrio && (activeGame?.mode === 'pairs' || ((activeGame?.team1?.players?.length || 0) > 1));

  const [t1Name, setT1Name] = useState('');
  const [t1P1, setT1P1] = useState('');
  const [t1P2, setT1P2] = useState('');

  const [t2Name, setT2Name] = useState('');
  const [t2P1, setT2P1] = useState('');
  const [t2P2, setT2P2] = useState('');

  const [t3Name, setT3Name] = useState('');
  const [t3P1, setT3P1] = useState('');

  // Campo attualmente selezionato per l'inserimento rapido con un tocco
  const [activeTargetField, setActiveTargetField] = useState('t1P1');
  const customAlert = useAlert();

  // Sincronizza lo stato ogni volta che il modale si apre o activeGame cambia
  useEffect(() => {
    if (activeGame && isOpen) {
      setT1Name(activeGame.team1?.name || (isTrio ? 'Giocatore 1' : 'Coppia 1'));
      setT1P1(activeGame.team1?.players?.[0] || '');
      setT1P2(activeGame.team1?.players?.[1] || '');

      setT2Name(activeGame.team2?.name || (isTrio ? 'Giocatore 2' : 'Coppia 2'));
      setT2P1(activeGame.team2?.players?.[0] || '');
      setT2P2(activeGame.team2?.players?.[1] || '');

      if (isTrio) {
        setT3Name(activeGame.team3?.name || 'Giocatore 3');
        setT3P1(activeGame.team3?.players?.[0] || '');
      }

      // Seleziona il primo campo vuoto, oppure 't1P1'
      if (!activeGame.team1?.players?.[0]) setActiveTargetField('t1P1');
      else if (isPairs && !activeGame.team1?.players?.[1]) setActiveTargetField('t1P2');
      else if (!activeGame.team2?.players?.[0]) setActiveTargetField('t2P1');
      else if (isPairs && !activeGame.team2?.players?.[1]) setActiveTargetField('t2P2');
      else setActiveTargetField('t1P1');
    }
  }, [activeGame, isOpen, isTrio, isPairs]);

  // 1. Giocatori Online al Tavolo (Massima priorità!)
  const onlineTablePlayers = useMemo(() => {
    const list = [];
    const seenEmails = new Set();
    const seenNames = new Set();

    // Utente corrente (Tu)
    if (currentUser) {
      const myName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Tu';
      list.push({
        uid: currentUser.uid,
        displayName: myName,
        email: currentUser.email || '',
        photoURL: currentUser.photoURL,
        isMe: true
      });
      if (currentUser.email) seenEmails.add(currentUser.email.toLowerCase());
      seenNames.add(myName.toLowerCase());
    }

    // Partecipanti al tavolo (da playerUids / playerEmails di Firestore)
    if (Array.isArray(tablePlayers)) {
      tablePlayers.forEach(p => {
        const pEmail = (p.email || '').toLowerCase();
        const pName = p.displayName || (p.email ? p.email.split('@')[0] : 'Giocatore');
        if (pEmail && seenEmails.has(pEmail)) return;
        if (seenNames.has(pName.toLowerCase())) return;
        const isMe = currentUser && (p.uid === currentUser.uid || (pEmail && pEmail === currentUser.email?.toLowerCase()));
        list.push({
          uid: p.uid,
          displayName: pName,
          email: pEmail,
          photoURL: p.photoURL,
          isMe
        });
        if (pEmail) seenEmails.add(pEmail);
        seenNames.add(pName.toLowerCase());
      });
    }

    // Host o proprietario della partita
    if (activeGame?.ownerName || activeGame?.ownerEmail) {
      const oName = activeGame.ownerName || activeGame.ownerEmail?.split('@')[0];
      const oEmail = (activeGame.ownerEmail || '').toLowerCase();
      if ((!oEmail || !seenEmails.has(oEmail)) && !seenNames.has(oName.toLowerCase())) {
        list.push({
          uid: activeGame.ownerUid,
          displayName: oName,
          email: oEmail,
          photoURL: null,
          isMe: currentUser && oEmail === currentUser.email?.toLowerCase()
        });
      }
    }

    return list;
  }, [tablePlayers, currentUser, activeGame]);

  // 2. Amici Burraco Club (esclusi quelli già conteggiati online)
  const otherFriends = useMemo(() => {
    const onlineNames = new Set(onlineTablePlayers.map(p => p.displayName.toLowerCase()));
    return (friendsList || []).filter(f => {
      const name = (f.displayName || f.email?.split('@')[0] || '').toLowerCase();
      return name && !onlineNames.has(name);
    });
  }, [friendsList, onlineTablePlayers]);

  // 3. Altri partecipanti salvati nella rubrica locale
  const otherStoredPlayers = useMemo(() => {
    const takenNames = new Set([
      ...onlineTablePlayers.map(p => p.displayName.toLowerCase()),
      ...otherFriends.map(f => (f.displayName || f.email?.split('@')[0] || '').toLowerCase())
    ]);
    return (playersList || []).filter(name => name && !takenNames.has(name.toLowerCase()));
  }, [playersList, onlineTablePlayers, otherFriends]);

  // Tutti i nomi noti per autocomplete datalist
  const allKnownPlayerNames = useMemo(() => {
    const set = new Set();
    onlineTablePlayers.forEach(p => set.add(p.displayName));
    otherFriends.forEach(f => set.add(f.displayName || f.email));
    (playersList || []).forEach(name => set.add(name));
    return Array.from(set).filter(Boolean);
  }, [onlineTablePlayers, otherFriends, playersList]);

  // Mappa di dove si trova ciascun giocatore attualmente nelle squadre
  const assignedMap = useMemo(() => {
    const map = {};
    if (t1P1.trim()) map[t1P1.trim().toLowerCase()] = 'Sq. 1';
    if (t1P2.trim()) map[t1P2.trim().toLowerCase()] = 'Sq. 1';
    if (t2P1.trim()) map[t2P1.trim().toLowerCase()] = 'Sq. 2';
    if (t2P2.trim()) map[t2P2.trim().toLowerCase()] = 'Sq. 2';
    if (t3P1.trim()) map[t3P1.trim().toLowerCase()] = 'Sq. 3';
    return map;
  }, [t1P1, t1P2, t2P1, t2P2, t3P1]);

  if (!isOpen || !activeGame) return null;

  // Inverte le due formazioni complete (Squadra 1 <-> Squadra 2)
  const handleSwapTeams = () => {
    setT1Name(t2Name);
    setT2Name(t1Name);
    setT1P1(t2P1);
    setT2P1(t1P1);
    setT1P2(t2P2);
    setT2P2(t1P2);
  };

  // Scambia i compagni (Giocatore 2 di Squadra 1 con Giocatore 2 di Squadra 2)
  const handleSwapPartners = () => {
    const temp = t1P2;
    setT1P2(t2P2);
    setT2P2(temp);
  };

  // Ruota i 3 giocatori (1 -> 2 -> 3 -> 1)
  const handleRotateTrio = () => {
    const n1 = t1Name, p1 = t1P1;
    setT1Name(t3Name); setT1P1(t3P1);
    setT3Name(t2Name); setT3P1(t2P1);
    setT2Name(n1); setT2P1(p1);
  };

  // Auto-genera il nome squadra basato sui giocatori presenti
  const handleAutoNameTeam = (teamIndex) => {
    if (teamIndex === 1) {
      const p = [t1P1.trim(), isPairs ? t1P2.trim() : null].filter(Boolean);
      if (p.length > 0) setT1Name(p.join(' & '));
    } else if (teamIndex === 2) {
      const p = [t2P1.trim(), isPairs ? t2P2.trim() : null].filter(Boolean);
      if (p.length > 0) setT2Name(p.join(' & '));
    } else if (teamIndex === 3) {
      if (t3P1.trim()) setT3Name(t3P1.trim());
    }
  };

  // Assegna il nome selezionato al campo attivo e avanza al campo successivo
  const handleAssignPlayer = (playerName) => {
    if (!playerName) return;

    if (activeTargetField === 't1P1') {
      setT1P1(playerName);
      setActiveTargetField(isPairs ? 't1P2' : 't2P1');
    } else if (activeTargetField === 't1P2') {
      setT1P2(playerName);
      setActiveTargetField('t2P1');
    } else if (activeTargetField === 't2P1') {
      setT2P1(playerName);
      setActiveTargetField(isPairs ? 't2P2' : (isTrio ? 't3P1' : 't1P1'));
    } else if (activeTargetField === 't2P2') {
      setT2P2(playerName);
      setActiveTargetField(isTrio ? 't3P1' : 't1P1');
    } else if (activeTargetField === 't3P1') {
      setT3P1(playerName);
      setActiveTargetField('t1P1');
    } else {
      // Fallback
      if (!t1P1.trim()) { setT1P1(playerName); setActiveTargetField('t1P2'); }
      else if (isPairs && !t1P2.trim()) { setT1P2(playerName); setActiveTargetField('t2P1'); }
      else if (!t2P1.trim()) { setT2P1(playerName); setActiveTargetField(isPairs ? 't2P2' : 't1P1'); }
      else if (isPairs && !t2P2.trim()) { setT2P2(playerName); setActiveTargetField('t1P1'); }
      else if (isTrio && !t3P1.trim()) { setT3P1(playerName); setActiveTargetField('t1P1'); }
      else { setT1P1(playerName); setActiveTargetField('t1P2'); }
    }
  };

  const getTargetFieldLabel = () => {
    switch (activeTargetField) {
      case 't1P1': return 'Squadra 1 • Giocatore 1';
      case 't1P2': return 'Squadra 1 • Giocatore 2 (Compagno)';
      case 't2P1': return 'Squadra 2 • Giocatore 1';
      case 't2P2': return 'Squadra 2 • Giocatore 2 (Compagno)';
      case 't3P1': return 'Giocatore 3';
      default: return 'Seleziona una postazione';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const p1 = [t1P1.trim(), isPairs ? t1P2.trim() : null].filter(Boolean);
    const p2 = [t2P1.trim(), isPairs ? t2P2.trim() : null].filter(Boolean);
    const p3 = isTrio ? [t3P1.trim()].filter(Boolean) : [];

    if (p1.length === 0 || p2.length === 0 || (isTrio && p3.length === 0)) {
      customAlert({
        title: 'Postazione Incompleta',
        message: 'Inserisci almeno un giocatore per ciascuna postazione.',
        variant: 'warning'
      });
      return;
    }

    const updatedTeam1 = {
      ...activeGame.team1,
      name: t1Name.trim() || (isPairs ? `${p1.join(' & ')}` : p1[0]),
      players: p1,
    };

    const updatedTeam2 = {
      ...activeGame.team2,
      name: t2Name.trim() || (isPairs ? `${p2.join(' & ')}` : p2[0]),
      players: p2,
    };

    const updatedTeam3 = isTrio ? {
      ...(activeGame.team3 || {}),
      name: t3Name.trim() || p3[0],
      players: p3,
    } : undefined;

    onSave(updatedTeam1, updatedTeam2, updatedTeam3);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <datalist id="burraco-known-players">
        {allKnownPlayerNames.map(name => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div 
        className="relative w-full max-w-2xl felt-card rounded-2xl border border-amber-500/40 p-3 sm:p-5 my-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)'
        }}
      >
        
        {/* Header Modale */}
        <div className="flex items-center justify-between pb-2.5 border-b border-emerald-700/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white m-0">Modifica Squadre & Giocatori</h2>
              <p className="text-[11px] text-emerald-300/80 m-0">Assegna velocemente i partecipanti online o salvati</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indicatore campo attivo per inserimento */}
        <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-between text-xs text-amber-200 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span className="font-semibold text-[11px] text-emerald-300/90 shrink-0">Inserimento rapido in:</span>
            <span className="font-black text-amber-300 text-[11px] truncate">{getTargetFieldLabel()}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-medium hidden sm:inline">
            Tocca un partecipante in basso per assegnarlo
          </span>
        </div>

        {/* Form Modifica con scroll dedicato */}
        <form onSubmit={handleSubmit} className="mt-3 flex-1 overflow-y-auto pr-1 space-y-3.5">
          
          <div className={`grid grid-cols-1 ${isTrio ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
            
            {/* SCHEDA SQUADRA 1 (♦ TEMA ORO) */}
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-amber-500/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-800/60">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <span className="text-sm">♦</span> {isTrio ? 'Giocatore 1' : 'Squadra 1 (Tema Oro)'}
                </span>
                <button
                  type="button"
                  onClick={() => handleAutoNameTeam(1)}
                  className="text-[10px] text-amber-300/80 hover:text-amber-200 flex items-center gap-1 cursor-pointer font-medium"
                  title="Imposta il nome squadra con i nomi dei giocatori"
                >
                  <Wand2 className="w-3 h-3 text-amber-400" />
                  <span>Auto</span>
                </button>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-emerald-300/80 block mb-0.5">
                  {isTrio ? 'Nome Visualizzato' : 'Nome Squadra'}
                </label>
                <input
                  type="text"
                  value={t1Name}
                  onChange={(e) => setT1Name(e.target.value)}
                  placeholder="Es. Coppia 1"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5 pt-0.5">
                <div>
                  <label className="text-[10px] font-semibold text-emerald-300/80 flex items-center justify-between mb-0.5">
                    <span>{isPairs ? 'Giocatore 1' : 'Giocatore Singolo'}</span>
                    {activeTargetField === 't1P1' && (
                      <span className="text-[9px] text-amber-400 font-bold">● Inserimento qui</span>
                    )}
                  </label>
                  <PlayerAutocompleteInput
                    value={t1P1}
                    onChange={setT1P1}
                    onFocus={() => setActiveTargetField('t1P1')}
                    onClick={() => setActiveTargetField('t1P1')}
                    currentUser={currentUser}
                    friendsList={friendsList}
                    availablePlayers={playersList}
                    alreadySelected={[t1P2, t2P1, t2P2, t3P1]}
                    placeholder="Nome giocatore..."
                    className={`w-full px-2.5 py-1.5 rounded-lg text-white font-medium text-xs sm:text-sm focus:outline-none transition-all ${
                      activeTargetField === 't1P1'
                        ? 'bg-emerald-950 border-2 border-amber-400 ring-2 ring-amber-400/40'
                        : 'bg-emerald-900/60 border border-emerald-700/60 focus:border-amber-400'
                    }`}
                  />
                </div>

                {isPairs && (
                  <div>
                    <label className="text-[10px] font-semibold text-emerald-300/80 flex items-center justify-between mb-0.5">
                      <span>Giocatore 2 (Compagno)</span>
                      {activeTargetField === 't1P2' && (
                        <span className="text-[9px] text-amber-400 font-bold">● Inserimento qui</span>
                      )}
                    </label>
                    <PlayerAutocompleteInput
                      value={t1P2}
                      onChange={setT1P2}
                      onFocus={() => setActiveTargetField('t1P2')}
                      onClick={() => setActiveTargetField('t1P2')}
                      currentUser={currentUser}
                      friendsList={friendsList}
                      availablePlayers={playersList}
                      alreadySelected={[t1P1, t2P1, t2P2, t3P1]}
                      placeholder="Nome compagno..."
                      className={`w-full px-2.5 py-1.5 rounded-lg text-white font-medium text-xs sm:text-sm focus:outline-none transition-all ${
                        activeTargetField === 't1P2'
                          ? 'bg-emerald-950 border-2 border-amber-400 ring-2 ring-amber-400/40'
                          : 'bg-emerald-900/60 border border-emerald-700/60 focus:border-amber-400'
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SCHEDA SQUADRA 2 (♠ TEMA BLU) */}
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-blue-500/40 shadow-sm space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-800/60">
                <span className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-1">
                  <span className="text-sm">♠</span> {isTrio ? 'Giocatore 2' : 'Squadra 2 (Tema Blu)'}
                </span>
                <button
                  type="button"
                  onClick={() => handleAutoNameTeam(2)}
                  className="text-[10px] text-blue-300/80 hover:text-blue-200 flex items-center gap-1 cursor-pointer font-medium"
                  title="Imposta il nome squadra con i nomi dei giocatori"
                >
                  <Wand2 className="w-3 h-3 text-blue-400" />
                  <span>Auto</span>
                </button>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-emerald-300/80 block mb-0.5">
                  {isTrio ? 'Nome Visualizzato' : 'Nome Squadra'}
                </label>
                <input
                  type="text"
                  value={t2Name}
                  onChange={(e) => setT2Name(e.target.value)}
                  placeholder="Es. Coppia 2"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-xs sm:text-sm focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="space-y-1.5 pt-0.5">
                <div>
                  <label className="text-[10px] font-semibold text-emerald-300/80 flex items-center justify-between mb-0.5">
                    <span>{isPairs ? 'Giocatore 1' : 'Giocatore Singolo'}</span>
                    {activeTargetField === 't2P1' && (
                      <span className="text-[9px] text-blue-400 font-bold">● Inserimento qui</span>
                    )}
                  </label>
                  <PlayerAutocompleteInput
                    value={t2P1}
                    onChange={setT2P1}
                    onFocus={() => setActiveTargetField('t2P1')}
                    onClick={() => setActiveTargetField('t2P1')}
                    currentUser={currentUser}
                    friendsList={friendsList}
                    availablePlayers={playersList}
                    alreadySelected={[t1P1, t1P2, t2P2, t3P1]}
                    placeholder="Nome giocatore..."
                    className={`w-full px-2.5 py-1.5 rounded-lg text-white font-medium text-xs sm:text-sm focus:outline-none transition-all ${
                      activeTargetField === 't2P1'
                        ? 'bg-emerald-950 border-2 border-blue-400 ring-2 ring-blue-400/40'
                        : 'bg-emerald-900/60 border border-emerald-700/60 focus:border-blue-400'
                    }`}
                  />
                </div>

                {isPairs && (
                  <div>
                    <label className="text-[10px] font-semibold text-emerald-300/80 flex items-center justify-between mb-0.5">
                      <span>Giocatore 2 (Compagno)</span>
                      {activeTargetField === 't2P2' && (
                        <span className="text-[9px] text-blue-400 font-bold">● Inserimento qui</span>
                      )}
                    </label>
                    <PlayerAutocompleteInput
                      value={t2P2}
                      onChange={setT2P2}
                      onFocus={() => setActiveTargetField('t2P2')}
                      onClick={() => setActiveTargetField('t2P2')}
                      currentUser={currentUser}
                      friendsList={friendsList}
                      availablePlayers={playersList}
                      alreadySelected={[t1P1, t1P2, t2P1, t3P1]}
                      placeholder="Nome compagno..."
                      className={`w-full px-2.5 py-1.5 rounded-lg text-white font-medium text-xs sm:text-sm focus:outline-none transition-all ${
                        activeTargetField === 't2P2'
                          ? 'bg-emerald-950 border-2 border-blue-400 ring-2 ring-blue-400/40'
                          : 'bg-emerald-900/60 border border-emerald-700/60 focus:border-blue-400'
                      }`}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SCHEDA SQUADRA 3 (♥ TEMA RUBINO - SOLO SE A 3) */}
            {isTrio && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-rose-500/40 shadow-sm space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-emerald-800/60">
                  <span className="text-xs font-black text-rose-300 uppercase tracking-wider flex items-center gap-1">
                    <span className="text-sm">♥</span> Giocatore 3 (Tema Rubino)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAutoNameTeam(3)}
                    className="text-[10px] text-rose-300/80 hover:text-rose-200 flex items-center gap-1 cursor-pointer font-medium"
                    title="Imposta il nome con il nome del giocatore"
                  >
                    <Wand2 className="w-3 h-3 text-rose-400" />
                    <span>Auto</span>
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-emerald-300/80 block mb-0.5">
                    Nome Visualizzato
                  </label>
                  <input
                    type="text"
                    value={t3Name}
                    onChange={(e) => setT3Name(e.target.value)}
                    placeholder="Es. Giocatore 3"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white font-medium text-xs sm:text-sm focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div className="space-y-1.5 pt-0.5">
                  <div>
                    <label className="text-[10px] font-semibold text-emerald-300/80 flex items-center justify-between mb-0.5">
                      <span>Giocatore Singolo</span>
                      {activeTargetField === 't3P1' && (
                        <span className="text-[9px] text-rose-400 font-bold">● Inserimento qui</span>
                      )}
                    </label>
                    <PlayerAutocompleteInput
                      value={t3P1}
                      onChange={setT3P1}
                      onFocus={() => setActiveTargetField('t3P1')}
                      onClick={() => setActiveTargetField('t3P1')}
                      currentUser={currentUser}
                      friendsList={friendsList}
                      availablePlayers={playersList}
                      alreadySelected={[t1P1, t1P2, t2P1, t2P2]}
                      placeholder="Nome giocatore..."
                      className={`w-full px-2.5 py-1.5 rounded-lg text-white font-medium text-xs sm:text-sm focus:outline-none transition-all ${
                        activeTargetField === 't3P1'
                          ? 'bg-emerald-950 border-2 border-rose-400 ring-2 ring-rose-400/40'
                          : 'bg-emerald-900/60 border border-emerald-700/60 focus:border-rose-400'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Tasti Rapidi di Scambio e Rotazione */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {isTrio ? (
              <button
                type="button"
                onClick={handleRotateTrio}
                className="px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm active:scale-95"
                title="Ruota i 3 giocatori"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                <span>Ruota Giocatori (1 ➔ 2 ➔ 3 ➔ 1)</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSwapTeams}
                  className="px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm active:scale-95"
                  title="Scambia le due squadre per intero"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>Inverti Squadre (♦ ⇄ ♠)</span>
                </button>

                {isPairs && (
                  <button
                    type="button"
                    onClick={handleSwapPartners}
                    className="px-3 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm active:scale-95"
                    title="Scambia i secondi giocatori delle due squadre"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-teal-400" />
                    <span>Scambia Compagni 2</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* SEZIONI PARTECIPANTI: Online al Tavolo, Amici e Rubrica */}
          <div className="space-y-2 pt-1">
            
            {/* 1. Partecipanti Online al Tavolo (Evidenziati e prioritari!) */}
            {onlineTablePlayers.length > 0 && (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950 via-emerald-900/60 to-emerald-950 border border-emerald-600/50 text-xs space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-emerald-300 font-bold text-[11px]">
                  <span className="flex items-center gap-1.5 text-white">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Al Tavolo Online ({onlineTablePlayers.length} presenti):</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-normal">Tocca per inserire</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {onlineTablePlayers.map(p => {
                    const assignedTo = assignedMap[p.displayName.toLowerCase()];
                    return (
                      <button
                        key={p.uid || p.displayName}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleAssignPlayer(p.displayName)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                          assignedTo
                            ? 'bg-emerald-800/80 text-emerald-100 border border-emerald-500/50'
                            : 'gold-gradient text-emerald-950 hover:brightness-110'
                        }`}
                      >
                        {p.photoURL ? (
                          <img src={p.photoURL} alt="" className="w-4 h-4 rounded-full border border-amber-400 object-cover" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-amber-300 text-emerald-950 font-black text-[9px] flex items-center justify-center">
                            {p.displayName.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <span>{p.displayName}</span>
                        {p.isMe && <span className="text-[9px] opacity-80">(Tu)</span>}
                        {assignedTo ? (
                          <span className="text-[9px] px-1 rounded bg-emerald-950/70 text-amber-300 font-normal border border-emerald-700/50">
                            {assignedTo}
                          </span>
                        ) : (
                          <Plus className="w-3 h-3 text-emerald-950" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Amici Burraco Club */}
            {otherFriends.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[11px]">
                  <span>⭐ I tuoi Amici Burraco Club:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {otherFriends.map(f => {
                    const name = f.displayName || f.email;
                    const assignedTo = assignedMap[name.toLowerCase()];
                    return (
                      <button
                        key={f.uid || name}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleAssignPlayer(name)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                          assignedTo
                            ? 'bg-amber-900/60 text-amber-200 border border-amber-500/40'
                            : 'bg-emerald-900/70 hover:bg-emerald-800 text-amber-200 border border-amber-400/40'
                        }`}
                      >
                        {f.photoURL ? (
                          <img src={f.photoURL} alt="" className="w-4 h-4 rounded-full border border-amber-400 object-cover" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-amber-400 text-emerald-950 font-black text-[9px] flex items-center justify-center">
                            {name.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <span>{name}</span>
                        {assignedTo ? (
                          <span className="text-[9px] px-1 rounded bg-black/40 text-amber-300">
                            {assignedTo}
                          </span>
                        ) : (
                          <Plus className="w-3 h-3 text-amber-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Altri Giocatori Salvati / Storico */}
            {otherStoredPlayers.length > 0 && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400/90 font-semibold text-[11px]">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Altri giocatori salvati:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {otherStoredPlayers.map(name => {
                    const assignedTo = assignedMap[name.toLowerCase()];
                    return (
                      <button
                        key={name}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleAssignPlayer(name)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer active:scale-95 ${
                          assignedTo
                            ? 'bg-emerald-800/60 text-emerald-100 border border-emerald-600/50'
                            : 'bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50'
                        }`}
                      >
                        <span>+ {name}</span>
                        {assignedTo && (
                          <span className="ml-1 text-[9px] text-amber-300">({assignedTo})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Badge informativo di sicurezza */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[11px]">
              I punti e lo storico delle <strong>{activeGame.rounds?.length || 0} mani</strong> già registrate rimarranno invariati.
            </span>
          </div>

          {/* Tasti Azione Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-700/50 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
              <span>Salva Modifiche</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
