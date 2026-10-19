import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trophy, Award, Trash2, TrendingUp, Skull, BookUser, Edit2, Check, BarChart3, Sparkles, Users, Globe, Wifi } from 'lucide-react';
import { calculatePlayerStats, computeUserCareerStats } from '../utils/storage';
import { getPlayerTitle } from '../utils/trophies';
import { sound } from '../utils/soundEffects';
import StatsCharts from './StatsCharts';
import TrophiesShowcase from './TrophiesShowcase';

// Frasi commemorative a rotazione per la dipartita del giocatore
const EULOGY_PHRASES = [
  "Ci mancherai tanto da tutto il club burraco",
  "Il tavolo verde piange la tua scomparsa... Riposa in pace",
  "Hai chiuso l'ultima mano terrena. Addio, leggenda del Burraco",
  "Un minuto di silenzio per il nostro caro compagno di carte",
  "Niente più pozzetti per te quaggiù... Ci mancherai immensamente",
  "Hai scartato per l'ultima volta. Che la terra ti sia lieve",
  "Il club del Burraco ti porta nel cuore. Riposa tra i pinelle d'oro",
  "La partita della vita è terminata. Ciao, sarai sempre nei nostri cuori",
  "Il mazzo è finito, ma il tuo ricordo al tavolo non svanirà mai",
  "Onore e rispetto. La sedia al tavolo 1 rimarrà per sempre vuota in tuo onore",
  "Ci mancheranno le tue giocate e le tue chiusure. Ciao amico caro"
];

export default function PlayersStatsModal({
  isOpen,
  onClose,
  playersList,
  onAddPlayer,
  onDeletePlayer,
  onRenamePlayer,
  gamesHistory,
  activeGame,
  currentUser,
  friendsList = []
}) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [activeTab, setActiveTab] = useState('ranking'); // 'ranking' | 'trend' | 'trophies' | 'roster'
  const [rankingScope, setRankingScope] = useState(currentUser ? 'friends' : 'local'); // 'friends' | 'local'
  const [sortBy, setSortBy] = useState('points'); // 'points' | 'burrachi' | 'winrate'
  const [selectedPlayerForTrend, setSelectedPlayerForTrend] = useState(null);
  const [selectedPlayerForTrophies, setSelectedPlayerForTrophies] = useState(null);

  // Stato modifica nome giocatore inline
  const [editingPlayerName, setEditingPlayerName] = useState(null); // nome originale in modifica
  const [renameInputValue, setRenameInputValue] = useState('');

  // Stato per la modalità Morte / Blackout tenebroso
  const [deadPlayerModal, setDeadPlayerModal] = useState(null); // Giocatore in attesa di conferma eliminazione
  const [isDeathBlackout, setIsDeathBlackout] = useState(false);
  const [currentEulogy, setCurrentEulogy] = useState('');

  // Statistiche del dispositivo locale
  const stats = calculatePlayerStats(playersList, gamesHistory, activeGame);

  // Statistiche di carriera dell'utente loggato
  const myCareer = currentUser ? (computeUserCareerStats(currentUser, gamesHistory, activeGame) || {
    totalPoints: 0,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    winRate: 0,
    cleanBurrachi: 0,
    semiCleanBurrachi: 0,
    dirtyBurrachi: 0,
    totalBurrachi: 0,
    closures: 0,
    bestHandScore: 0,
    totalHands: 0,
    avgPointsPerHand: 0
  }) : null;

  // Unione profili amici in tempo reale da Firestore
  const effectiveFriends = friendsList || [];

  const friendsLeaderboardData = [];

  // Inserisci l'utente corrente nella leaderboard amici
  if (currentUser && myCareer) {
    friendsLeaderboardData.push({
      uid: currentUser.uid,
      name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Tu',
      displayName: currentUser.displayName || 'Tu',
      email: currentUser.email,
      photoURL: currentUser.photoURL,
      isMe: true,
      isOnline: true,
      totalPoints: myCareer.totalPoints,
      gamesPlayed: myCareer.gamesPlayed,
      gamesWon: myCareer.gamesWon,
      gamesLost: myCareer.gamesLost || 0,
      winRate: myCareer.winRate,
      cleanBurrachi: myCareer.cleanBurrachi,
      semiCleanBurrachi: myCareer.semiCleanBurrachi,
      dirtyBurrachi: myCareer.dirtyBurrachi,
      totalBurrachi: myCareer.totalBurrachi,
      closures: myCareer.closures,
      bestHandScore: myCareer.bestHandScore,
      avgPointsPerHand: myCareer.avgPointsPerHand || 0,
    });
  }

  // Aggiungi tutti gli amici con le loro statistiche di carriera live (e calcolo locale unificato se non ancora sincronizzati)
  effectiveFriends.forEach(f => {
    if (currentUser && f.uid === currentUser.uid) return;
    const c = f.careerStats || {};
    const localS = computeUserCareerStats(f, gamesHistory, activeGame) || {};

    const totalPoints = Math.max(Number(c.totalPoints) || 0, Number(localS.totalPoints) || 0);
    const played = Math.max(Number(c.gamesPlayed) || 0, Number(localS.gamesPlayed) || 0);
    const won = Math.max(Number(c.gamesWon) || 0, Number(localS.gamesWon) || 0);
    const lost = Math.max(0, played - won);
    const winRate = Number(c.winRate) || (played > 0 ? Math.round((won / played) * 100) : (localS.winRate || 0));
    const cleanBurrachi = Math.max(Number(c.cleanBurrachi) || 0, Number(localS.cleanBurrachi) || 0);
    const semiCleanBurrachi = Math.max(Number(c.semiCleanBurrachi) || 0, Number(localS.semiCleanBurrachi) || 0);
    const dirtyBurrachi = Math.max(Number(c.dirtyBurrachi) || 0, Number(localS.dirtyBurrachi) || 0);
    const totalBurrachi = cleanBurrachi + semiCleanBurrachi + dirtyBurrachi;
    const closures = Math.max(Number(c.closures) || 0, Number(localS.closures) || 0);
    const bestHandScore = Math.max(Number(c.bestHandScore) || 0, Number(localS.bestHandScore) || 0);
    const isOnline = f.lastSeen ? (Date.now() - new Date(f.lastSeen).getTime() < 5 * 60 * 1000) : false;

    friendsLeaderboardData.push({
      uid: f.uid,
      name: f.displayName || f.email?.split('@')[0] || 'Amico',
      displayName: f.displayName,
      email: f.email,
      photoURL: f.photoURL,
      isMe: false,
      isOnline,
      totalPoints,
      gamesPlayed: played,
      gamesWon: won,
      gamesLost: lost,
      winRate,
      cleanBurrachi,
      semiCleanBurrachi,
      dirtyBurrachi,
      totalBurrachi,
      closures,
      bestHandScore,
      avgPointsPerHand: 0,
    });
  });

  // Ordinamento classifica amici
  const sortedFriendsStats = [...friendsLeaderboardData].sort((a, b) => {
    if (sortBy === 'burrachi') {
      return b.totalBurrachi - a.totalBurrachi || b.cleanBurrachi - a.cleanBurrachi || b.totalPoints - a.totalPoints;
    }
    if (sortBy === 'winrate') {
      return b.winRate - a.winRate || b.gamesWon - a.gamesWon || b.totalPoints - a.totalPoints;
    }
    return b.totalPoints - a.totalPoints || b.winRate - a.winRate;
  });

  const maxFriendsVal = sortBy === 'burrachi'
    ? Math.max(...sortedFriendsStats.map(s => s.totalBurrachi), 1)
    : sortBy === 'winrate'
    ? 100
    : Math.max(...sortedFriendsStats.map(s => s.totalPoints), 1);

  // Gestione Blackout di 5 secondi
  useEffect(() => {
    let timer;
    if (isDeathBlackout) {
      timer = setTimeout(() => {
        setIsDeathBlackout(false);
        setCurrentEulogy('');
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isDeathBlackout]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    onAddPlayer(newPlayerName.trim());
    setNewPlayerName('');
  };

  // Conferma ed esecuzione della morte del giocatore
  const confirmExecuteDeath = () => {
    if (!deadPlayerModal) return;
    const playerToKill = deadPlayerModal;
    setDeadPlayerModal(null);

    // Seleziona una frase a rotazione casuale
    const randomPhrase = EULOGY_PHRASES[Math.floor(Math.random() * EULOGY_PHRASES.length)];
    setCurrentEulogy(randomPhrase);

    // Suona il rintocco solenne di campana
    sound.playDeathBell();

    // Attiva lo schermo nero per 5 secondi
    setIsDeathBlackout(true);

    // Rimuovi definitivamente il giocatore dalla memoria e dal cloud
    onDeletePlayer(playerToKill);
  };

  // Avvio modifica nome
  const handleStartRename = (playerName) => {
    setEditingPlayerName(playerName);
    setRenameInputValue(playerName);
  };

  // Salva nuovo nome giocatore
  const handleSaveRename = (e) => {
    if (e) e.preventDefault();
    if (!editingPlayerName || !renameInputValue.trim()) {
      setEditingPlayerName(null);
      return;
    }
    const cleanNew = renameInputValue.trim();
    if (cleanNew !== editingPlayerName) {
      if (onRenamePlayer) {
        onRenamePlayer(editingPlayerName, cleanNew);
      }
    }
    setEditingPlayerName(null);
  };

  const handleCancelRename = () => {
    setEditingPlayerName(null);
    setRenameInputValue('');
  };

  const handleDelete = (playerName) => {
    setDeadPlayerModal(playerName);
  };

  const handleViewTrend = (playerName) => {
    setSelectedPlayerForTrend(playerName);
    setActiveTab('trend');
  };

  const handleViewTrophies = (playerName) => {
    setSelectedPlayerForTrophies(playerName);
    setActiveTab('trophies');
  };

  // Ordinamento giocatori in base al criterio selezionato
  const sortedStats = [...stats].sort((a, b) => {
    if (sortBy === 'burrachi') {
      return b.totalBurrachi - a.totalBurrachi || b.cleanBurrachi - a.cleanBurrachi || b.totalPoints - a.totalPoints;
    }
    if (sortBy === 'winrate') {
      return b.winRate - a.winRate || b.gamesWon - a.gamesWon || b.totalPoints - a.totalPoints;
    }
    // Default: 'points'
    return b.totalPoints - a.totalPoints || b.winRate - a.winRate;
  });

  // Massimo per la scala della barra visuale reale
  const maxVal = sortBy === 'burrachi'
    ? Math.max(...sortedStats.map(s => s.totalBurrachi), 1)
    : sortBy === 'winrate'
    ? 100
    : Math.max(...sortedStats.map(s => s.totalPoints), 1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl felt-card rounded-2xl border border-amber-500/40 p-4 sm:p-5 my-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md shrink-0">
              <BarChart3 className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-white m-0">
                Statistiche & Compagni
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-300/80 m-0">
                Classifica, rubrica compagni, andamento e trofei
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Sezioni Principali Unificate (Mobile 2x2, Desktop 4x1) */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-emerald-950/90 border border-emerald-800/80 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('ranking')}
            className={`min-h-[38px] sm:min-h-[40px] py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] select-none ${
              activeTab === 'ranking'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <Trophy className="w-4 h-4 shrink-0" />
            <span>Classifica</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`min-h-[38px] sm:min-h-[40px] py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] select-none ${
              activeTab === 'roster'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <BookUser className="w-4 h-4 shrink-0" />
            <span>Compagni</span>
            {playersList.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'roster' ? 'bg-emerald-950 text-amber-300' : 'bg-emerald-800 text-emerald-200'
              }`}>
                {playersList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trend')}
            className={`min-h-[38px] sm:min-h-[40px] py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] select-none ${
              activeTab === 'trend'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Andamento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trophies')}
            className={`min-h-[38px] sm:min-h-[40px] py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] select-none ${
              activeTab === 'trophies'
                ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-900/50'
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>Trofei</span>
          </button>
        </div>

        {/* CONTENUTO PRINCIPALE */}
        <div className="my-3.5 max-h-[62vh] overflow-y-auto pr-1">
          
          {/* TAB 1: CLASSIFICA UNIFICATA & AMICI CLOUD */}
          {activeTab === 'ranking' && (
            <div className="space-y-3">
              
              {/* Selettore Ambito: ⭐ Amici Club (Cloud Live) vs 👥 Ospiti Tavolo Locale */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-emerald-950/90 border border-emerald-800/80 shadow-inner">
                <button
                  type="button"
                  onClick={() => setRankingScope('friends')}
                  className={`min-h-[38px] py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] select-none ${
                    rankingScope === 'friends'
                      ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-emerald-950 shadow-md font-black'
                      : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
                  }`}
                >
                  <div className="relative flex items-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 absolute -top-0.5 -right-0.5 animate-pulse" />
                  </div>
                  <span className="truncate">Amici Club (Live Cloud)</span>
                  {friendsLeaderboardData.length > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black shrink-0 ${
                      rankingScope === 'friends' ? 'bg-emerald-950 text-amber-300' : 'bg-emerald-800 text-emerald-200'
                    }`}>
                      {friendsLeaderboardData.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRankingScope('local')}
                  className={`min-h-[38px] py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] select-none ${
                    rankingScope === 'local'
                      ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                      : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Ospiti Locali</span>
                  {playersList.length > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black shrink-0 ${
                      rankingScope === 'local' ? 'bg-emerald-950 text-amber-300' : 'bg-emerald-800 text-emerald-200'
                    }`}>
                      {playersList.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Barra Strumenti: Criterio Ordinamento + Azioni Contestuali */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-emerald-300 font-semibold shrink-0 mr-1">Ordina:</span>
                  <div className="flex items-center gap-1 bg-emerald-900/60 p-0.5 rounded-lg border border-emerald-800/60">
                    <button
                      type="button"
                      onClick={() => setSortBy('points')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        sortBy === 'points'
                          ? 'bg-amber-400 text-emerald-950 shadow-xs'
                          : 'text-emerald-300 hover:text-white'
                      }`}
                    >
                      Punti
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy('burrachi')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        sortBy === 'burrachi'
                          ? 'bg-amber-400 text-emerald-950 shadow-xs'
                          : 'text-emerald-300 hover:text-white'
                      }`}
                    >
                      Burrachi
                    </button>
                    <button
                      type="button"
                      onClick={() => setSortBy('winrate')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        sortBy === 'winrate'
                          ? 'bg-amber-400 text-emerald-950 shadow-xs'
                          : 'text-emerald-300 hover:text-white'
                      }`}
                    >
                      Vittorie %
                    </button>
                  </div>
                </div>

                {rankingScope === 'friends' ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-300/80 bg-emerald-900/40 px-2.5 py-1 rounded-lg border border-emerald-800/50">
                    <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
                    <span>Aggiornato live da ogni dispositivo</span>
                  </div>
                ) : (
                  /* Form inserimento partecipante locale */
                  <form onSubmit={handleAdd} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Nuovo giocatore..."
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      className="flex-1 sm:w-44 px-2.5 py-1 rounded-lg bg-emerald-900/80 border border-emerald-700/60 text-white placeholder-emerald-400/50 text-xs focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-lg gold-gradient hover:brightness-110 text-emerald-950 font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-emerald-950" />
                      <span>Aggiungi</span>
                    </button>
                  </form>
                )}
              </div>

              {/* CONTENUTO SCOPE: AMICI CLUB (LIVE CLOUD) */}
              {rankingScope === 'friends' && (
                <div>
                  {!currentUser ? (
                    <div className="text-center py-8 px-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 space-y-2">
                      <Globe className="w-8 h-8 text-amber-400 mx-auto opacity-80" />
                      <h4 className="text-sm font-bold text-white m-0">Accedi per sfidare i tuoi Amici</h4>
                      <p className="text-xs text-emerald-300/80 max-w-md mx-auto m-0">
                        Esegui il login con il tuo account Google per visualizzare le carriere, i trofei e le statistiche in tempo reale dei tuoi amici ogni volta che giocano ovunque nel mondo.
                      </p>
                    </div>
                  ) : sortedFriendsStats.length === 0 ? (
                    <div className="text-center py-8 px-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 space-y-2">
                      <Users className="w-8 h-8 text-amber-400 mx-auto opacity-80" />
                      <h4 className="text-sm font-bold text-white m-0">Nessun amico nel tuo Burraco Club</h4>
                      <p className="text-xs text-emerald-300/80 max-w-md mx-auto m-0">
                        Aggiungi i tuoi compagni di gioco inviando una richiesta di amicizia o condividendo il tavolo. Le loro statistiche si aggiorneranno automaticamente qui in tempo reale!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {sortedFriendsStats.map((p, index) => {
                        const titleInfo = getPlayerTitle(p);
                        
                        let currentVal = p.totalPoints;
                        let primaryText = `${p.totalPoints.toLocaleString('it-IT')} pt`;
                        let subText = `${p.gamesPlayed} partite disputate`;

                        if (sortBy === 'burrachi') {
                          currentVal = p.totalBurrachi;
                          primaryText = `${p.totalBurrachi} burrachi`;
                          subText = `${p.cleanBurrachi}P • ${p.semiCleanBurrachi}S • ${p.dirtyBurrachi}I`;
                        } else if (sortBy === 'winrate') {
                          currentVal = p.winRate;
                          primaryText = `${p.winRate}% vittorie`;
                          subText = `${p.gamesWon}V / ${p.gamesLost}P (${p.gamesPlayed} tot)`;
                        }

                        const pct = currentVal > 0 && maxFriendsVal > 0 ? Math.round((currentVal / maxFriendsVal) * 100) : 0;

                        return (
                          <div 
                            key={p.uid || p.name}
                            className={`p-3 sm:p-3.5 rounded-xl border transition-all space-y-2.5 shadow-sm ${
                              p.isMe
                                ? 'bg-gradient-to-r from-emerald-950/90 via-emerald-900/60 to-emerald-950/90 border-amber-500/60 shadow-amber-500/10'
                                : 'bg-emerald-950/75 border-emerald-700/40 hover:border-amber-500/40'
                            }`}
                          >
                            {/* Riga 1: Podio + Avatar + Nome + Badge Titolo + Valore Primario */}
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {/* Podio Rank Badge */}
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${
                                  index === 0 
                                    ? 'gold-gradient text-emerald-950 shadow-amber-500/20' 
                                    : index === 1 
                                    ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 font-bold' 
                                    : index === 2 
                                    ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 font-bold' 
                                    : 'bg-emerald-900/80 border border-emerald-800 text-emerald-400 font-mono'
                                }`}>
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                </div>

                                {/* Avatar con indicatore Online */}
                                <div className="relative shrink-0">
                                  {p.photoURL ? (
                                    <img 
                                      src={p.photoURL} 
                                      alt={p.name} 
                                      className="w-8 h-8 rounded-full border border-amber-400/50 object-cover" 
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-emerald-800 border border-emerald-600 text-amber-300 font-bold flex items-center justify-center text-xs">
                                      {p.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  {p.isOnline && (
                                    <span 
                                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-emerald-950 shadow-xs" 
                                      title="Online adesso"
                                    />
                                  )}
                                </div>

                                {/* Nome & Titolo Onorifico */}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="text-sm sm:text-base font-extrabold text-white m-0 truncate">
                                      {p.displayName || p.name}
                                    </h4>
                                    {p.isMe && (
                                      <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-emerald-950 font-black text-[10px]">
                                        Tu
                                      </span>
                                    )}
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900/90 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                                      <span>{titleInfo.icon}</span>
                                      <span>{titleInfo.title}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Punteggio/Metrica Evidenziata */}
                              <div className="text-right shrink-0">
                                <div className="text-sm sm:text-base font-black text-amber-300">
                                  {primaryText}
                                </div>
                                <div className="text-[10px] text-emerald-400/80">
                                  {subText}
                                </div>
                              </div>
                            </div>

                            {/* Riga 2: Barra di Progressione Reale */}
                            <div className="h-2 w-full bg-emerald-950 rounded-full border border-emerald-800/60 overflow-hidden">
                              {pct > 0 && (
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    index === 0
                                      ? 'bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                                      : index === 1
                                      ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                                      : 'bg-gradient-to-r from-emerald-600 to-teal-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              )}
                            </div>

                            {/* Riga 3: Chips Statistiche Compatte di Carriera */}
                            <div className="flex flex-wrap items-center gap-1 text-[10px] pt-1 border-t border-emerald-900/60">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-900/50 text-emerald-200 border border-emerald-800/60">
                                🎯 <strong>{p.totalPoints.toLocaleString('it-IT')}</strong> pt
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-900/50 text-emerald-200 border border-emerald-800/60">
                                💎 <strong>{p.totalBurrachi}</strong> burr. ({p.cleanBurrachi}P · {p.semiCleanBurrachi}S · {p.dirtyBurrachi}I)
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-900/50 text-amber-300/90 border border-emerald-800/60">
                                🏆 <strong>{p.winRate}%</strong> ({p.gamesWon}V/{p.gamesLost}P)
                              </span>
                              {p.bestHandScore > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-900/50 text-emerald-200 border border-emerald-800/60">
                                  ⚡ Record: <strong>+{p.bestHandScore}</strong>
                                </span>
                              )}
                              {p.closures > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-900/50 text-emerald-200 border border-emerald-800/60">
                                  🔒 Chiusure: <strong>{p.closures}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* CONTENUTO SCOPE: OSPITI TAVOLO LOCALE */}
              {rankingScope === 'local' && (
                <div>
                  {sortedStats.length === 0 ? (
                    <div className="text-center py-10 text-emerald-300/70 text-xs">
                      Nessun partecipante registrato. Aggiungi il primo giocatore sopra!
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {sortedStats.map((p, index) => {
                        const titleInfo = getPlayerTitle(p);
                        
                        let currentVal = p.totalPoints;
                        let primaryText = `${p.totalPoints.toLocaleString('it-IT')} pt`;
                        let subText = `med. ${p.avgPointsPerHand} pt/mano`;

                        if (sortBy === 'burrachi') {
                          currentVal = p.totalBurrachi;
                          primaryText = `${p.totalBurrachi} burrachi`;
                          subText = `${p.cleanBurrachi}P • ${p.semiCleanBurrachi}S • ${p.dirtyBurrachi}I`;
                        } else if (sortBy === 'winrate') {
                          currentVal = p.winRate;
                          primaryText = `${p.winRate}% vittorie`;
                          subText = `${p.gamesWon}V / ${p.gamesLost}P (${p.gamesPlayed} tot)`;
                        }

                        const pct = currentVal > 0 && maxVal > 0 ? Math.round((currentVal / maxVal) * 100) : 0;

                        return (
                          <div 
                            key={p.name}
                            className="p-3 sm:p-3.5 rounded-xl bg-emerald-950/75 border border-emerald-700/40 hover:border-amber-500/40 transition-all space-y-2.5 shadow-sm"
                          >
                            {/* Riga 1: Podio + Nome Giocatore + Valore Primario */}
                            <div className="flex items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {/* Podio Rank Badge */}
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${
                                  index === 0 
                                    ? 'gold-gradient text-emerald-950 shadow-amber-500/20' 
                                    : index === 1 
                                    ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 font-bold' 
                                    : index === 2 
                                    ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 font-bold' 
                                    : 'bg-emerald-900/80 border border-emerald-800 text-emerald-400 font-mono'
                                }`}>
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                </div>

                                {/* Nome & Titolo Onorifico */}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="text-sm sm:text-base font-extrabold text-white m-0 truncate">
                                      {p.name}
                                    </h4>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900/90 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                                      <span>{titleInfo.icon}</span>
                                      <span>{titleInfo.title}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Punteggio/Metrica Evidenziata */}
                              <div className="text-right shrink-0">
                                <div className="text-sm sm:text-base font-black text-amber-300">
                                  {primaryText}
                                </div>
                                <div className="text-[10px] text-emerald-400/80">
                                  {subText}
                                </div>
                              </div>
                            </div>

                            {/* Riga 2: Barra di Progressione Reale */}
                            <div className="h-2 w-full bg-emerald-950 rounded-full border border-emerald-800/60 overflow-hidden">
                              {pct > 0 && (
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    index === 0
                                      ? 'bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                                      : index === 1
                                      ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                                      : 'bg-gradient-to-r from-emerald-600 to-teal-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              )}
                            </div>

                            {/* Riga 3: Chips Statistiche Compatte + Tasti Rapidi */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-emerald-900/60">
                              <div className="flex flex-wrap items-center gap-1 text-[10px]">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-900/50 text-emerald-200 border border-emerald-800/60">
                                  🎯 <strong>{p.totalPoints.toLocaleString('it-IT')}</strong> pt ({p.avgPointsPerHand} /m)
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-900/50 text-emerald-200 border border-emerald-800/60">
                                  💎 <strong>{p.totalBurrachi}</strong> burr. ({p.cleanBurrachi}P · {p.semiCleanBurrachi}S · {p.dirtyBurrachi}I)
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-900/50 text-amber-300/90 border border-emerald-800/60">
                                  🏆 <strong>{p.winRate}%</strong> ({p.gamesWon}V/{p.gamesLost}P)
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-900/50 text-emerald-200 border border-emerald-800/60">
                                  ⚡ Record: <strong>+{p.bestHandScore}</strong>
                                </span>
                              </div>

                              {/* Azioni Giocatore Discrete */}
                              <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleViewTrend(p.name)}
                                  className="px-2 py-0.5 rounded-md bg-emerald-900/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/60 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Visualizza curva andamento"
                                >
                                  <TrendingUp className="w-3 h-3 text-amber-400" />
                                  <span>Trend</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleViewTrophies(p.name)}
                                  className="px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Visualizza trofei sbloccati"
                                >
                                  <Award className="w-3 h-3 text-amber-400" />
                                  <span>Trofei</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(p.name)}
                                  className="p-1 rounded-md text-emerald-600 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Rimuovi giocatore"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: RUBRICA GIOCATORI DELL'APP CON TESCHIO TENEBROSO */}
          {activeTab === 'roster' && (
            <div className="space-y-3">
              {/* Box Introduttivo con Avviso Tenebroso */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/70 via-black/80 to-red-950/70 border border-red-800/50 shadow-md">
                <div className="flex items-center gap-2 mb-1">
                  <Skull className="w-4 h-4 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <h3 className="text-xs sm:text-sm font-black text-red-400 uppercase tracking-wider m-0">
                    Rubrica Giocatori del Burraco Club
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-400 m-0 leading-relaxed">
                  Lista completa di tutti i partecipanti salvati nell'app. Premendo il <strong className="text-red-400">Teschio Rosso Tenebroso 💀</strong> il giocatore verrà dichiarato defunto e rimosso per sempre dal club.
                </p>
              </div>

              {/* Info Amici Online Google */}
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center gap-2.5 text-xs text-emerald-300/80">
                <span className="text-base shrink-0">👥</span>
                <span className="leading-tight">
                  I tuoi compagni con account Google e lo stato online si trovano nella sezione <strong>I Miei Amici</strong> sul tuo <strong>Profilo</strong> (icona in alto a destra).
                </span>
              </div>

              {/* Form Aggiunta Nuovo Membro */}
              <form onSubmit={handleAdd} className="flex gap-1.5 p-2 rounded-xl bg-emerald-950/70 border border-emerald-800/60">
                <input
                  type="text"
                  placeholder="Iscrivi nuovo giocatore al club..."
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-900/80 border border-emerald-700/60 text-white placeholder-emerald-400/50 text-xs focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg gold-gradient hover:brightness-110 text-emerald-950 font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-950" />
                  <span>Aggiungi</span>
                </button>
              </form>

              {/* Elenco Membri con Teschio Rosso Cupo */}
              {playersList.length === 0 ? (
                <div className="text-center py-12 text-emerald-300/70 text-xs">
                  Nessun giocatore registrato nell'app. Aggiungine uno con il form sopra!
                </div>
              ) : (
                <div className="space-y-2">
                  {playersList.map((playerName) => {
                    const pStat = stats.find(s => s.name.toLowerCase() === playerName.toLowerCase());
                    const gamesCount = pStat ? pStat.gamesPlayed : 0;
                    const pointsCount = pStat ? pStat.totalPoints : 0;
                    const isEditingThis = editingPlayerName === playerName;

                    return (
                      <div
                        key={playerName}
                        className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/90 via-emerald-950/70 to-zinc-950/80 border border-emerald-800/50 hover:border-emerald-600/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm group"
                      >
                        {/* Info Giocatore / Form Rinomina Inline */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-emerald-900/80 border border-emerald-700/50 flex items-center justify-center font-bold text-amber-300 text-sm shrink-0">
                            ♠
                          </div>

                          {isEditingThis ? (
                            <form onSubmit={handleSaveRename} className="flex items-center gap-1.5 flex-1 min-w-0">
                              <input
                                type="text"
                                autoFocus
                                value={renameInputValue}
                                onChange={(e) => setRenameInputValue(e.target.value)}
                                className="flex-1 max-w-xs px-2.5 py-1 rounded-lg bg-emerald-900 border-2 border-amber-400 text-white font-bold text-xs focus:outline-none"
                                placeholder="Nuovo nome..."
                              />
                              <button
                                type="submit"
                                className="p-1.5 rounded-lg gold-gradient text-emerald-950 font-black cursor-pointer shadow-sm hover:brightness-110 active:scale-95"
                                title="Salva nuovo nome"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelRename}
                                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer transition-colors active:scale-95"
                                title="Annulla"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          ) : (
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-white m-0 truncate">
                                {playerName}
                              </h4>
                              <p className="text-[11px] text-emerald-400/80 m-0 truncate">
                                {gamesCount} {gamesCount === 1 ? 'partita giocata' : 'partite giocate'} • {pointsCount.toLocaleString('it-IT')} pt
                              </p>
                            </div>
                          )}
                        </div>

                        {/* AZIONI GIOCATORE: MODIFICA NOME & TESCHIO TENEBROSO */}
                        {!isEditingThis && (
                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {/* TASTO MODIFICA NOME */}
                            <button
                              type="button"
                              onClick={() => handleStartRename(playerName)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 hover:text-amber-300 border border-emerald-700/60 hover:border-amber-400/60 flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all active:scale-95"
                              title={`Modifica il nome di ${playerName}`}
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                              <span>Modifica</span>
                            </button>

                            {/* BOTTONE TESCHIO IN ROSSO TENEBROSO */}
                            <button
                              type="button"
                              onClick={() => setDeadPlayerModal(playerName)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-br from-red-950 via-zinc-950 to-red-950 hover:from-red-900 hover:to-red-950 text-red-500 hover:text-red-300 border-2 border-red-700/70 hover:border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.25)] hover:shadow-[0_0_18px_rgba(239,68,68,0.6)] flex items-center gap-1.5 text-xs font-black uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                              title={`Dichiara la morte di ${playerName}`}
                            >
                              <Skull className="w-4 h-4 text-red-500 animate-pulse drop-shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
                              <span className="text-red-400 group-hover:text-red-200">Defunto</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: GRAFICO ANDAMENTO */}
          {activeTab === 'trend' && (
            <StatsCharts
              stats={stats}
              selectedPlayerName={selectedPlayerForTrend}
              onSelectPlayer={setSelectedPlayerForTrend}
            />
          )}

          {/* TAB: BACHECA TROFEI & TITOLI */}
          {activeTab === 'trophies' && (
            <TrophiesShowcase
              stats={stats}
              gamesHistory={gamesHistory}
              activeGame={activeGame}
              initialPlayerName={selectedPlayerForTrophies}
            />
          )}

        </div>

        {/* Footer Modale Pulito e Discreto */}
        <div className="mt-3 pt-2.5 border-t border-emerald-700/50 flex items-center justify-between text-xs">
          <span className="text-emerald-400/80 text-[11px]">
            {activeTab === 'roster'
              ? `${playersList.length} ospiti in rubrica`
              : `${stats.length} giocatori con statistiche`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 font-semibold text-xs transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>

      </div>

      {/* POPUP CONFERMA MORTE GIOCATORE */}
      {deadPlayerModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-zinc-950 via-zinc-900 to-red-950 border-2 border-red-700 p-5 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-500/80 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.5)]">
              <Skull className="w-9 h-9 text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider mb-1">
                Confermi la Dipartita?
              </h3>
              <p className="text-xs text-red-200/90 leading-relaxed">
                Stai per dichiarare che <strong className="text-white text-sm font-black underline decoration-red-500 underline-offset-2">"{deadPlayerModal}"</strong> è passato a miglior vita.
              </p>
              <p className="text-[11px] text-zinc-400 mt-2 italic">
                Verrà celebrato il suo addio al club e non esisterà più tra i partecipanti.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2 border-t border-red-900/60">
              <button
                type="button"
                onClick={() => setDeadPlayerModal(null)}
                className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs border border-zinc-700 cursor-pointer transition-colors active:scale-95"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={confirmExecuteDeath}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-black text-xs border border-red-500 shadow-lg shadow-red-950/80 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Skull className="w-3.5 h-3.5 text-white" />
                <span>È Morto ⚰️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY BLACKOUT TENEBROSO 5 SECONDI */}
      {isDeathBlackout && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-700"
          style={{ animationDuration: '600ms' }}
        >
          {/* Teschio Spettrale in dissolvenza */}
          <div className="mb-6 opacity-80 animate-pulse">
            <Skull className="w-16 h-16 sm:w-20 sm:h-20 text-red-600 drop-shadow-[0_0_25px_rgba(220,38,38,0.8)]" />
          </div>

          {/* Frase Commemorativa Bianca in Corsivo Elegante e Ben Visibile */}
          <blockquote className="max-w-xl text-white text-2xl sm:text-3xl md:text-4xl font-serif italic tracking-wide leading-relaxed drop-shadow-[0_2px_12px_rgba(255,255,255,0.45)] px-4 animate-in zoom-in-95 duration-500">
            "{currentEulogy || 'Ci mancherai tanto da tutto il club burraco'}"
          </blockquote>

          {/* Sottotitolo solenne */}
          <div className="mt-8 flex items-center gap-2 text-zinc-500 text-xs sm:text-sm uppercase tracking-widest font-mono">
            <span>♠</span>
            <span>Il Burraco Club in lutto perenne</span>
            <span>♠</span>
          </div>
        </div>
      )}

    </div>
  );
}
