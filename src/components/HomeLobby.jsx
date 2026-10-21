import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Play, 
  RotateCcw, 
  KeyRound, 
  Trophy, 
  Sparkles, 
  Star, 
  Shuffle, 
  Plus, 
  Check, 
  SlidersHorizontal,
  FolderArchive,
  BookOpen
} from 'lucide-react';
import { sound } from '../utils/soundEffects';
import { savePlayerName } from '../utils/storage';
import { findGameByPinOrId } from '../services/firebase';
import { useAlert } from '../context/ConfirmContext';

export default function HomeLobby({
  currentUser,
  friendsList = [],
  storedPlayers = [],
  gamesHistory = [],
  onStartGame,
  onResumeGame,
  onOpenNewGameModal,
  onOpenCloudModal,
  onOpenHistory,
  onOpenRules,
  onLogin
}) {
  const customAlert = useAlert();

  // Stato giocatori selezionati per il tavolo (massimo 4)
  const [selectedPlayers, setSelectedPlayers] = useState(() => {
    // Se l'utente è loggato, preseleziona il suo profilo come primo giocatore
    if (currentUser) {
      return [{
        id: currentUser.uid,
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Tu',
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        isCurrentUser: true,
        isFriend: false
      }];
    }
    return [];
  });

  // Stato per l'aggiunta di un nuovo giocatore al volo
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Stato per il PIN tavolo rapido
  const [pinInput, setPinInput] = useState('');
  const [isSearchingPin, setIsSearchingPin] = useState(false);

  // 1. Costruisci la lista unificata dei giocatori disponibili (Amici registrati + Ospiti + Nomi salvati)
  const availableRoster = useMemo(() => {
    const list = [];
    const seenNames = new Set();

    // Se l'utente è autenticato, aggiungilo in cima
    if (currentUser) {
      const myName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Tu';
      list.push({
        id: currentUser.uid,
        name: myName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        isCurrentUser: true,
        isFriend: false,
        isCloseFriend: false,
      });
      seenNames.add(myName.toLowerCase());
      if (currentUser.email) seenNames.add(currentUser.email.toLowerCase());
    }

    // Aggiungi gli amici dal Social Club
    (friendsList || []).forEach(f => {
      const name = f.displayName || f.email?.split('@')[0] || 'Amico';
      const keyName = name.toLowerCase();
      const keyEmail = (f.email || '').toLowerCase();
      if (!seenNames.has(keyName) && (!keyEmail || !seenNames.has(keyEmail))) {
        seenNames.add(keyName);
        if (keyEmail) seenNames.add(keyEmail);
        list.push({
          id: f.uid || f.id || `friend_${name}`,
          name,
          email: f.email,
          photoURL: f.photoURL,
          isCurrentUser: false,
          isFriend: true,
          isCloseFriend: Boolean(f.isCloseFriend),
          winRate: f.careerStats?.winRate
        });
      }
    });

    // Aggiungi i giocatori salvati in locale
    (storedPlayers || []).forEach((name, idx) => {
      const cleanName = String(name).trim();
      if (cleanName && !seenNames.has(cleanName.toLowerCase())) {
        seenNames.add(cleanName.toLowerCase());
        list.push({
          id: `stored_${idx}_${cleanName}`,
          name: cleanName,
          isCurrentUser: false,
          isFriend: false,
          isCloseFriend: false,
        });
      }
    });

    return list;
  }, [currentUser, friendsList, storedPlayers]);

  // Gestione selezione / deselezione giocatore
  const handleTogglePlayer = (player) => {
    try {
      sound.playTap();
    } catch {}

    setSelectedPlayers(prev => {
      const existsIndex = prev.findIndex(p => 
        (p.id && player.id && p.id === player.id) || 
        p.name.toLowerCase() === player.name.toLowerCase()
      );

      if (existsIndex >= 0) {
        // Rimuovi
        return prev.filter((_, idx) => idx !== existsIndex);
      } else {
        // Aggiungi (massimo 4 giocatori al tavolo)
        if (prev.length >= 4) {
          if (customAlert) {
            customAlert({
              title: 'Tavolo al Completo',
              message: 'Un tavolo di Burraco può ospitare al massimo 4 giocatori (2 contro 2). Deseleziona un giocatore per aggiungerne un altro.',
              variant: 'info'
            });
          }
          return prev;
        }
        return [...prev, player];
      }
    });
  };

  // Scambia gli accoppiamenti delle coppie (es. scambia slot 2 e 3)
  const handleSwapPartners = () => {
    if (selectedPlayers.length !== 4) return;
    try {
      sound.playTap();
    } catch {}
    setSelectedPlayers(prev => [prev[0], prev[2], prev[1], prev[3]]);
  };

  // Aggiunta rapida di un nuovo nome giocatore
  const handleAddNewPlayer = (e) => {
    e.preventDefault();
    const clean = newPlayerName.trim();
    if (!clean) return;

    const userKey = currentUser ? currentUser.uid : 'guest';
    savePlayerName(clean, userKey);

    const newObj = {
      id: `custom_${Date.now()}_${clean}`,
      name: clean,
      isCurrentUser: false,
      isFriend: false,
    };

    if (selectedPlayers.length < 4) {
      setSelectedPlayers(prev => [...prev, newObj]);
    }

    setNewPlayerName('');
    setIsAddingPlayer(false);
    try {
      sound.playTap();
    } catch {}
  };

  // Avvio rapido della partita con i giocatori selezionati
  const handleQuickStartGame = () => {
    const count = selectedPlayers.length;
    if (count < 2) return;

    try {
      sound.playCardDeal();
    } catch {}

    let mode = 'pairs';
    let team1 = { name: 'Coppia 1', players: [] };
    let team2 = { name: 'Coppia 2', players: [] };
    let team3 = null;

    if (count === 2) {
      mode = 'singles';
      team1 = { name: selectedPlayers[0].name, players: [selectedPlayers[0].name] };
      team2 = { name: selectedPlayers[1].name, players: [selectedPlayers[1].name] };
    } else if (count === 3) {
      mode = 'trio';
      team1 = { name: selectedPlayers[0].name, players: [selectedPlayers[0].name] };
      team2 = { name: selectedPlayers[1].name, players: [selectedPlayers[1].name] };
      team3 = { name: selectedPlayers[2].name, players: [selectedPlayers[2].name] };
    } else {
      // 4 giocatori: Coppia 1 (P1 + P2) vs Coppia 2 (P3 + P4)
      mode = 'pairs';
      const t1p1 = selectedPlayers[0].name;
      const t1p2 = selectedPlayers[1].name;
      const t2p1 = selectedPlayers[2].name;
      const t2p2 = selectedPlayers[3].name;

      team1 = { 
        name: `${t1p1} & ${t1p2}`, 
        players: [t1p1, t1p2] 
      };
      team2 = { 
        name: `${t2p1} & ${t2p2}`, 
        players: [t2p1, t2p2] 
      };
    }

    const newGame = {
      id: 'game_' + Date.now(),
      createdAt: new Date().toISOString(),
      mode,
      allowSemipulito: true,
      targetScore: 2005,
      team1,
      team2,
      ...(team3 ? { team3 } : {}),
      rounds: [],
      winner: null,
      isFinished: false,
    };

    onStartGame(newGame);
  };

  // Ricerca e accesso tramite PIN
  const handleJoinByPin = async (e) => {
    e.preventDefault();
    const cleanPin = pinInput.trim();
    if (!cleanPin || cleanPin.length < 4) return;

    setIsSearchingPin(true);
    try {
      const found = await findGameByPinOrId(cleanPin);
      if (found && found.id) {
        try {
          sound.playTap();
        } catch {}
        // Connetti direttamente al tavolo trovato
        onResumeGame(found);
      } else {
        if (customAlert) {
          customAlert({
            title: 'Tavolo non trovato',
            message: `Nessuna partita attiva trovata con il codice PIN "${cleanPin}". Verifica il codice a 6 cifre mostrato sul telefono dell'organizzatore del tavolo.`,
            variant: 'warning'
          });
        }
      }
    } catch (err) {
      console.warn('Errore ricerca PIN:', err);
      if (customAlert) {
        customAlert({
          title: 'Errore di connessione',
          message: 'Impossibile verificare il PIN in questo momento. Assicurati di essere connesso a Internet.',
          variant: 'danger'
        });
      }
    } finally {
      setIsSearchingPin(false);
    }
  };

  // Ultima partita giocata per rivincita rapida
  const lastGame = gamesHistory && gamesHistory.length > 0 ? gamesHistory[0] : null;

  const handleQuickRematchLastGame = () => {
    if (!lastGame) return;
    try {
      sound.playCardDeal();
    } catch {}

    const rematch = {
      id: 'game_' + Date.now(),
      createdAt: new Date().toISOString(),
      mode: lastGame.mode || 'pairs',
      allowSemipulito: lastGame.allowSemipulito ?? true,
      targetScore: lastGame.targetScore || 2005,
      team1: {
        name: lastGame.team1?.name || 'Coppia 1',
        players: lastGame.team1?.players || []
      },
      team2: {
        name: lastGame.team2?.name || 'Coppia 2',
        players: lastGame.team2?.players || []
      },
      ...(lastGame.mode === 'trio' && lastGame.team3 ? {
        team3: {
          name: lastGame.team3?.name || 'Giocatore 3',
          players: lastGame.team3?.players || []
        }
      } : {}),
      rounds: [],
      winner: null,
      isFinished: false,
    };

    onStartGame(rematch);
  };

  const selectedCount = selectedPlayers.length;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      
      {/* 1. SEZIONE TAVOLO & INVITO RAPIDO AMICI */}
      <div className="felt-card p-4 sm:p-6 rounded-3xl border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        {/* Glow decorativo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 blur-3xl pointer-events-none rounded-full" />
        
        {/* Intestazione */}
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5 pb-3 border-b border-emerald-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 sm:p-2.5 rounded-2xl gold-gradient text-emerald-950 font-black shadow-md flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-1.5 truncate">
                <span>Componi il Tavolo</span>
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              </h2>
              <p className="text-xs text-emerald-300/80 truncate">
                Tocca i giocatori presenti al tavolo per creare le squadre al volo
              </p>
            </div>
          </div>

          {/* Badge conteggio selezione */}
          <div className={`px-2.5 py-1 rounded-xl text-xs font-black border transition-all shrink-0 ${
            selectedCount === 4
              ? 'bg-amber-400/20 text-amber-300 border-amber-400/50'
              : selectedCount >= 2
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-emerald-950/80 text-emerald-400/60 border-emerald-800/60'
          }`}>
            {selectedCount}/4 {selectedCount === 4 ? 'Tavolo Pieno' : 'Giocatori'}
          </div>
        </div>

        {/* ANTEPRIMA DELLE SQUADRE IN TEMPO REALE */}
        <div className="mb-5 p-3.5 sm:p-4 rounded-2xl bg-emerald-950/70 border border-emerald-700/50 backdrop-blur-sm shadow-inner">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
              {selectedCount === 4 ? 'Modalità: Coppie (2 vs 2)' : selectedCount === 3 ? 'Modalità: A Tre (Trio a rotazione)' : selectedCount === 2 ? 'Modalità: Singolo (1 vs 1)' : 'Seleziona almeno 2 giocatori'}
            </span>
            {selectedCount === 4 && (
              <button
                type="button"
                onClick={handleSwapPartners}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded-lg border border-amber-400/30 transition-all cursor-pointer active:scale-95"
                title="Inverti i compagni delle due coppie"
              >
                <Shuffle className="w-3 h-3 text-amber-400" />
                <span>Inverti Coppie</span>
              </button>
            )}
          </div>

          {/* Griglia slot giocatori */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* SQUADRA 1 */}
            <div className="p-2.5 rounded-xl bg-emerald-900/60 border border-emerald-500/40 flex flex-col justify-between min-h-[64px]">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                {selectedCount >= 4 ? 'Coppia 1' : 'Giocatore 1'}
              </span>
              <div className="flex flex-wrap gap-1.5 items-center mt-1">
                {selectedPlayers[0] ? (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-800 text-white font-bold text-xs border border-emerald-400/40 truncate max-w-full">
                    {selectedPlayers[0].name}
                  </span>
                ) : (
                  <span className="text-xs italic text-emerald-400/50">Tocca un giocatore...</span>
                )}
                {selectedCount >= 4 && selectedPlayers[1] && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-800 text-white font-bold text-xs border border-emerald-400/40 truncate max-w-full">
                    {selectedPlayers[1].name}
                  </span>
                )}
              </div>
            </div>

            {/* SQUADRA 2 */}
            <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 flex flex-col justify-between min-h-[64px]">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                {selectedCount >= 4 ? 'Coppia 2' : selectedCount === 3 ? 'Giocatore 2' : 'Giocatore 2'}
              </span>
              <div className="flex flex-wrap gap-1.5 items-center mt-1">
                {selectedCount >= 4 ? (
                  <>
                    {selectedPlayers[2] ? (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-900 text-amber-100 font-bold text-xs border border-amber-400/40 truncate max-w-full">
                        {selectedPlayers[2].name}
                      </span>
                    ) : (
                      <span className="text-xs italic text-amber-400/50">In attesa...</span>
                    )}
                    {selectedPlayers[3] && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-900 text-amber-100 font-bold text-xs border border-amber-400/40 truncate max-w-full">
                        {selectedPlayers[3].name}
                      </span>
                    )}
                  </>
                ) : selectedPlayers[1] ? (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-900 text-amber-100 font-bold text-xs border border-amber-400/40 truncate max-w-full">
                    {selectedPlayers[1].name}
                  </span>
                ) : (
                  <span className="text-xs italic text-amber-400/50">Tocca un avversario...</span>
                )}
              </div>
            </div>
          </div>

          {/* Terzo giocatore se Trio */}
          {selectedCount === 3 && selectedPlayers[2] && (
            <div className="mt-2 p-2 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-purple-300">Giocatore 3 (Trio)</span>
              <span className="px-2 py-0.5 rounded-lg bg-purple-900 text-purple-100 font-bold text-xs border border-purple-400/40">
                {selectedPlayers[2].name}
              </span>
            </div>
          )}
        </div>

        {/* LISTA GIOCATORI DISPONIBILI (ROSTER) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>Giocatori Abituali & Amici</span>
            </span>
            <button
              type="button"
              onClick={() => setIsAddingPlayer(prev => !prev)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuovo Nome</span>
            </button>
          </div>

          {/* Form aggiunta nuovo giocatore al volo */}
          {isAddingPlayer && (
            <form onSubmit={handleAddNewPlayer} className="flex gap-2 animate-in fade-in zoom-in-95 duration-150">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Nome giocatore (es. nonna Maria)..."
                maxLength={30}
                autoFocus
                className="flex-1 px-3 py-2 rounded-xl bg-emerald-950 border border-emerald-500/50 text-white placeholder-emerald-400/50 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/60"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl gold-gradient text-emerald-950 font-black text-xs shadow-md active:scale-95 cursor-pointer"
              >
                Aggiungi
              </button>
            </form>
          )}

          {/* Griglia tessere giocatori */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {availableRoster.map(player => {
              const isSelected = selectedPlayers.some(p => 
                (p.id && player.id && p.id === player.id) || 
                p.name.toLowerCase() === player.name.toLowerCase()
              );
              const selectedIdx = selectedPlayers.findIndex(p => 
                (p.id && player.id && p.id === player.id) || 
                p.name.toLowerCase() === player.name.toLowerCase()
              );

              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => handleTogglePlayer(player)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative flex items-center gap-2.5 active:scale-95 ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-800 to-emerald-900 border-amber-400 shadow-lg ring-1 ring-amber-400/60'
                      : 'bg-emerald-950/60 hover:bg-emerald-900/40 border-emerald-800/60 hover:border-emerald-600/60 text-white'
                  }`}
                >
                  {/* Avatar o Iniziale */}
                  <div className="relative shrink-0">
                    {player.photoURL ? (
                      <img 
                        src={player.photoURL} 
                        alt={player.name} 
                        className="w-8 h-8 rounded-full object-cover border border-amber-400/60"
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border ${
                        isSelected 
                          ? 'gold-gradient text-emerald-950 border-amber-400' 
                          : 'bg-emerald-900 text-emerald-200 border-emerald-700/60'
                      }`}>
                        {player.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {player.isCloseFriend && (
                      <span className="absolute -top-1 -right-1 text-amber-400 drop-shadow">
                        <Star className="w-3 h-3 fill-amber-400" />
                      </span>
                    )}
                  </div>

                  {/* Nome e dettagli */}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-white truncate flex items-center gap-1">
                      <span className="truncate">{player.name}</span>
                      {player.isCurrentUser && (
                        <span className="text-[10px] text-amber-300 shrink-0 font-normal">(Tu)</span>
                      )}
                    </div>
                    {isSelected ? (
                      <div className="text-[10px] font-black text-amber-300 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        <span>
                          {selectedIdx < 2 ? 'Coppia 1' : 'Coppia 2'}
                        </span>
                      </div>
                    ) : player.isFriend ? (
                      <span className="text-[10px] text-emerald-400/70 truncate block">Amico Club</span>
                    ) : (
                      <span className="text-[10px] text-emerald-400/50 truncate block">Giocatore</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {availableRoster.length === 0 && (
            <div className="text-center py-6 px-3 rounded-2xl bg-emerald-950/40 border border-dashed border-emerald-800/60">
              <p className="text-xs text-emerald-300/70">
                Non ci sono ancora giocatori salvati in memoria.
              </p>
              <button
                type="button"
                onClick={() => setIsAddingPlayer(true)}
                className="mt-2 text-xs font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                + Aggiungi il primo compagno di gioco
              </button>
            </div>
          )}
        </div>

        {/* PULSANTE PRINCIPALE DI AVVIO DINAMICO */}
        <div className="mt-5 pt-4 border-t border-emerald-800/40 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            disabled={selectedCount < 2}
            onClick={handleQuickStartGame}
            className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
              selectedCount >= 2
                ? 'gold-gradient text-emerald-950 hover:brightness-110 shadow-amber-400/20'
                : 'bg-emerald-950/80 text-emerald-500/50 border border-emerald-800/40 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {selectedCount === 4
                ? '🃏 Siediti al Tavolo (2 vs 2)'
                : selectedCount === 3
                ? '🃏 Inizia Burraco a 3 (Trio)'
                : selectedCount === 2
                ? '🃏 Inizia Sfida Singola (1 vs 1)'
                : 'Seleziona almeno 2 giocatori'}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenNewGameModal}
            className="py-3 px-4 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 font-bold text-xs border border-emerald-500/40 shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer transition-all shrink-0"
            title="Configura traguardo punti personalizzato (1005, 1505, 2505), semipulito o squadre manuali"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Configurazione Libera</span>
          </button>
        </div>
      </div>

      {/* 2. RIVINCITA RAPIDA DALL'ULTIMA PARTITA (se presente) */}
      {lastGame && (
        <div className="felt-card p-3.5 sm:p-4 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
            <span className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">
              <RotateCcw className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                Ultima Partita Giocata
              </span>
              <p className="text-xs font-bold text-white truncate">
                {lastGame.team1?.name} vs {lastGame.team2?.name}
                {lastGame.mode === 'trio' && lastGame.team3?.name ? ` vs ${lastGame.team3.name}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={handleQuickRematchLastGame}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl gold-gradient text-emerald-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <span>Rivincita Immediata</span>
            </button>
            <button
              type="button"
              onClick={onOpenHistory}
              className="px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-xs border border-emerald-700/60 active:scale-95 cursor-pointer transition-all flex items-center gap-1 shrink-0"
              title="Apri archivio storico completo"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Storico</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. PARTECIPAZIONE RAPIDA CON PIN TAVOLO */}
      <div className="felt-card p-4 sm:p-5 rounded-3xl border border-emerald-500/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 text-center md:text-left">
          <span className="p-2.5 rounded-2xl bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 shrink-0 mx-auto md:mx-0">
            <KeyRound className="w-5 h-5 text-amber-400" />
          </span>
          <div>
            <h3 className="text-sm font-black text-white">Unisciti a un Tavolo Esistente</h3>
            <p className="text-xs text-emerald-300/70">
              Hai il PIN a 6 cifre mostrato sul telefono dell'organizzatore? Inseriscilo qui:
            </p>
          </div>
        </div>

        {/* Input PIN diretto */}
        <form onSubmit={handleJoinByPin} className="flex gap-2 w-full md:w-auto shrink-0">
          <input
            type="text"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.toUpperCase())}
            placeholder="PIN (es. 684210)"
            maxLength={10}
            className="flex-1 md:w-36 px-3.5 py-2.5 rounded-xl bg-emerald-950 border border-emerald-500/50 text-white placeholder-emerald-400/40 text-xs font-mono font-black tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-amber-400/60"
          />
          <button
            type="submit"
            disabled={isSearchingPin || pinInput.trim().length < 4}
            className="px-4 py-2.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            {isSearchingPin ? 'Ricerca...' : 'Entra'}
          </button>
        </form>
      </div>

      {/* 4. FOOTER DI ACCESSO RAPIDO ALLE REGOLE */}
      <div className="flex items-center justify-between text-xs text-emerald-300/60 px-2 pt-2">
        <span>Burraco Segnapunti Cloud & Ledger v2.0</span>
        <button
          type="button"
          onClick={onOpenRules}
          className="hover:text-amber-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Regole Ufficiali e Punteggi Carte</span>
        </button>
      </div>

    </div>
  );
}
