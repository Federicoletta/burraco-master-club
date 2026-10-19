import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  LogOut, 
  User, 
  Trophy, 
  Flame, 
  Award, 
  Calendar, 
  Mail, 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Send, 
  Sparkles, 
  Check, 
  Trash2, 
  Search, 
  Bell 
} from 'lucide-react';
import { getFriendOnlineStatus } from '../services/social';
import { computeUserCareerStats } from '../utils/storage';

export default function UserProfileModal({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  gamesHistory = [],
  activeGame,
  tablePlayers = [],
  friendsList = [],
  clubUsers = [],
  notifications = [],
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onSendFriendRequest,
  onChallengeFriend,
  onInviteFriendToActiveGame,
  onRemoveFriend,
  initialTab = 'profile'
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'profile' | 'friends'
  const [friendSearchInput, setFriendSearchInput] = useState('');
  const [friendFeedback, setFriendFeedback] = useState(null);
  const [isSendingFriend, setIsSendingFriend] = useState(false);
  const [invitingFriendUids, setInvitingFriendUids] = useState({});
  const [invitedFriendUids, setInvitedFriendUids] = useState({});

  if (!isOpen) return null;

  // Calcola statistiche collegate a questo utente autenticato
  const userDisplayName = currentUser?.displayName || 'Giocatore Burraco';
  const userPhoto = currentUser?.photoURL;
  const userEmail = currentUser?.email;

  // Richieste di amicizia in arrivo per questo account
  const incomingFriendRequests = (notifications || []).filter(
    n => n && n.type === 'friend_request' && n.status === 'pending'
  );

  // Calcola statistiche collegate a questo utente autenticato con risoluzione nickname e cloud
  const career = currentUser ? computeUserCareerStats(currentUser, gamesHistory, activeGame) : null;
  const cloudCareer = currentUser?.careerStats || {};

  const gamesCount = Math.max(career?.gamesPlayed || 0, Number(cloudCareer.gamesPlayed) || 0);
  const wonCount = Math.max(career?.gamesWon || 0, Number(cloudCareer.gamesWon) || 0);
  const totalScore = Math.max(career?.totalPoints || 0, Number(cloudCareer.totalPoints) || 0);
  const winRate = gamesCount > 0 ? Math.round((wonCount / gamesCount) * 100) : (career?.winRate || Number(cloudCareer.winRate) || 0);
  const cleanBurrachi = Math.max(career?.cleanBurrachi || 0, Number(cloudCareer.cleanBurrachi) || 0);
  const semiCleanBurrachi = Math.max(career?.semiCleanBurrachi || 0, Number(cloudCareer.semiCleanBurrachi) || 0);
  const dirtyBurrachi = Math.max(career?.dirtyBurrachi || 0, Number(cloudCareer.dirtyBurrachi) || 0);
  const totalBurrachi = cleanBurrachi + semiCleanBurrachi + dirtyBurrachi;
  const closures = Math.max(career?.closures || 0, Number(cloudCareer.closures) || 0);
  const bestHandScore = Math.max(career?.bestHandScore || 0, Number(cloudCareer.bestHandScore) || 0);

  const onlineFriends = friendsList.filter(f => getFriendOnlineStatus(f.lastSeen).isOnline);
  const onlineCount = onlineFriends.length;

  // Membri del club registrati che non sono ancora amici e non sono l'utente corrente (usati SOLO per suggerimenti durante la digitazione)
  const nonFriendClubMembers = (clubUsers || []).filter(u => {
    if (!u) return false;
    if (u.uid && currentUser?.uid && u.uid === currentUser.uid) return false;
    if (u.email && currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) return false;
    
    const alreadyFriend = (friendsList || []).some(f => 
      (f.uid && u.uid && f.uid === u.uid) ||
      (f.email && u.email && f.email.toLowerCase() === u.email.toLowerCase()) ||
      (f.displayName && u.displayName && f.displayName.toLowerCase() === u.displayName.toLowerCase())
    );
    return !alreadyFriend;
  });

  // Filtro suggerimenti live attivo solo quando si digitano almeno 2 caratteri
  const filteredSuggestions = friendSearchInput.trim().length >= 2 
    ? nonFriendClubMembers.filter(m => {
        const term = friendSearchInput.toLowerCase().trim();
        const nameMatch = (m.displayName || '').toLowerCase().includes(term);
        const emailMatch = (m.email || '').toLowerCase().includes(term);
        return nameMatch || emailMatch;
      })
    : [];

  const handleSendFriend = async (target) => {
    if (!onSendFriendRequest || !target) return;
    setIsSendingFriend(true);
    setFriendFeedback(null);
    try {
      await onSendFriendRequest(target);
      const label = typeof target === 'object' ? (target.displayName || target.email) : target;
      setFriendFeedback({
        type: 'success',
        text: `Richiesta di amicizia inviata con successo a ${label}!`
      });
      setFriendSearchInput('');
    } catch (err) {
      setFriendFeedback({
        type: 'error',
        text: err.message || 'Errore durante l\'invio della richiesta'
      });
    } finally {
      setIsSendingFriend(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const trimmed = friendSearchInput.trim();
    if (!trimmed) return;
    const exactMatch = nonFriendClubMembers.find(m => 
      (m.email && m.email.toLowerCase() === trimmed.toLowerCase()) ||
      (m.displayName && m.displayName.toLowerCase() === trimmed.toLowerCase())
    );
    if (exactMatch) {
      handleSendFriend(exactMatch);
    } else {
      handleSendFriend(trimmed);
    }
  };

  const handleInviteToActiveGame = async (friend) => {
    if (!onInviteFriendToActiveGame || !friend) return;
    const key = friend.uid || friend.email;
    setInvitingFriendUids(prev => ({ ...prev, [key]: true }));
    try {
      await onInviteFriendToActiveGame(friend);
      setInvitedFriendUids(prev => ({ ...prev, [key]: true }));
    } catch (err) {
      console.warn('Errore invito attivo:', err);
    } finally {
      setInvitingFriendUids(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleChallenge = (friend) => {
    onClose();
    if (onChallengeFriend) {
      onChallengeFriend(friend);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg felt-card rounded-2xl border border-amber-500/40 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[86vh] my-auto overflow-hidden">
        
        {/* HEADER FISSO PINNATO (Mai tagliato su nessun telefono) */}
        <div className="p-3.5 sm:p-4 pb-3 border-b border-emerald-700/50 flex items-center justify-between shrink-0 bg-emerald-950/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md shrink-0">
              {activeTab === 'friends' ? (
                <Users className="w-5 h-5 text-emerald-950" />
              ) : (
                <User className="w-5 h-5 text-emerald-950" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white m-0 truncate">
                {activeTab === 'friends' ? 'I Miei Amici del Burraco' : 'Profilo Personale'}
              </h2>
              <p className="text-[11px] text-emerald-300/80 m-0 truncate">
                {activeTab === 'friends' 
                  ? 'Compagni di gioco connessi, sfide dirette e inviti'
                  : 'Account Google, statistiche di carriera e sincronizzazione'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer shrink-0 ml-2"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Se l'utente è autenticato mostra il contenuto */}
        {currentUser ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            
            {/* Barra di Navigazione fissa tra le due schede */}
            <div className="px-3.5 sm:px-4 pt-3 pb-1.5 shrink-0 bg-emerald-950/60">
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-emerald-950/80 border border-emerald-800/60 shadow-inner">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                      : 'text-emerald-300 hover:text-white hover:bg-emerald-900/40'
                  }`}
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>Il Mio Profilo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('friends')}
                  className={`relative py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === 'friends'
                      ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                      : 'text-emerald-300 hover:text-white hover:bg-emerald-900/40'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span>I Miei Amici</span>
                  {incomingFriendRequests.length > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse ml-0.5">
                      {incomingFriendRequests.length} nuova!
                    </span>
                  ) : friendsList.length > 0 ? (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      activeTab === 'friends' ? 'bg-emerald-950 text-amber-300' : 'bg-emerald-900 text-emerald-200'
                    }`}>
                      {friendsList.length}
                    </span>
                  ) : null}
                  {onlineCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title={`${onlineCount} amici online`} />
                  )}
                </button>
              </div>
            </div>

            {/* BODY SCORREVOLE */}
            <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 min-h-0 space-y-3.5">
              
              {/* SCHEDA 1: PROFILO & STATISTICHE PERSONALI */}
              {activeTab === 'profile' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Scheda Utente con Avatar Google */}
                  <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-600/40 flex items-center gap-3.5 shadow-md">
                    {userPhoto ? (
                      <img 
                        src={userPhoto} 
                        alt={userDisplayName} 
                        className="w-14 h-14 rounded-full border-2 border-amber-400 shadow-md shrink-0 object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-emerald-900 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-bold text-xl shrink-0 shadow-md">
                        {userDisplayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-black text-white m-0 truncate">
                          {userDisplayName}
                        </h3>
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" title="Account Google Verificato" />
                      </div>
                      <p className="text-xs text-emerald-300/80 truncate flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{userEmail}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                          Membro Ufficiale Club
                        </span>
                        {onlineCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {onlineCount} {onlineCount === 1 ? 'amico online' : 'amici online'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Statistiche Personali Rapide */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-400/80 block">Partite</span>
                      <span className="text-lg font-black text-white">{gamesCount}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-400/80 block">Vittorie</span>
                      <span className="text-lg font-black text-amber-300">{wonCount} <small className="text-xs font-normal">({winRate}%)</small></span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-400/80 block">Punti Totali</span>
                      <span className="text-lg font-black text-emerald-200">{totalScore.toLocaleString('it-IT')}</span>
                    </div>
                  </div>

                  {/* Burrachi, Chiusure e Record */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-center">
                      <span className="text-[10px] font-bold text-amber-300/80 block">Burrachi</span>
                      <span className="text-sm font-black text-amber-200">{totalBurrachi}</span>
                      <span className="text-[9px] text-emerald-300/60 block mt-0.5">
                        {cleanBurrachi}P / {semiCleanBurrachi}S / {dirtyBurrachi}Sp
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-center">
                      <span className="text-[10px] font-bold text-emerald-400/80 block">Chiusure</span>
                      <span className="text-sm font-black text-white">{closures}</span>
                      <span className="text-[9px] text-emerald-300/60 block mt-0.5">volte</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-center">
                      <span className="text-[10px] font-bold text-emerald-400/80 block">Record Mano</span>
                      <span className="text-sm font-black text-emerald-300">+{bestHandScore}</span>
                      <span className="text-[9px] text-emerald-300/60 block mt-0.5">punti max</span>
                    </div>
                  </div>

                  {/* Box Informativo */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Profilo sincronizzato nel Cloud</span>
                    </span>
                    <p className="text-[11px] text-amber-200/80 m-0">
                      Le tue partite, vittorie e amici sono protetti e sincronizzati automaticamente su tutti i tuoi dispositivi.
                    </p>
                  </div>
                </div>
              )}

              {/* SCHEDA 2: I MIEI AMICI ONLINE */}
              {activeTab === 'friends' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  
                  {/* SEZIONE 1 (SE PRESENTE): RICHIESTE DI AMICIZIA IN ARRIVO */}
                  {incomingFriendRequests.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/90 to-emerald-950/90 border border-amber-400/80 shadow-lg space-y-2.5 animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 uppercase tracking-wider">
                          <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                          <span>Richiesta Ricevuta ({incomingFriendRequests.length})</span>
                        </div>
                        <span className="text-[10px] text-amber-300 font-bold bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                          In attesa
                        </span>
                      </div>

                      <div className="space-y-2">
                        {incomingFriendRequests.map((req) => (
                          <div 
                            key={req.id}
                            className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-700/60 flex items-center justify-between gap-3 shadow-md"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {req.fromPhoto ? (
                                <img src={req.fromPhoto} alt="" className="w-10 h-10 rounded-full border-2 border-amber-400 object-cover shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-800 border-2 border-amber-400 text-amber-300 font-bold text-sm flex items-center justify-center shrink-0">
                                  {(req.fromName || 'U').slice(0, 1).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="text-sm font-bold text-white block truncate">{req.fromName}</span>
                                <span className="text-xs text-emerald-300/80 block truncate">{req.fromEmail}</span>
                                <span className="text-[10px] text-amber-300 font-medium mt-0.5 block">Vuole aggiungerti agli amici!</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => onAcceptFriendRequest && onAcceptFriendRequest(req)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-md active:scale-95 flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Accetta</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeclineFriendRequest && onDeclineFriendRequest(req)}
                                className="p-1.5 rounded-xl bg-emerald-900/60 hover:bg-rose-950 text-emerald-300 hover:text-rose-300 border border-emerald-700/40 text-xs transition-colors cursor-pointer"
                                title="Rifiuta richiesta"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SEZIONE 2: LISTA AMICI CONFERMATI */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-300 uppercase tracking-wider px-1">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>I Tuoi Amici ({friendsList.length})</span>
                      </span>
                      {onlineCount > 0 && (
                        <span className="text-[11px] text-emerald-400 normal-case font-semibold">
                          🟢 {onlineCount} online adesso
                        </span>
                      )}
                    </div>

                    {friendsList.length === 0 ? (
                      <div className="py-6 text-center rounded-xl bg-emerald-950/40 border border-emerald-800/40 p-4 space-y-1.5">
                        <Users className="w-7 h-7 text-emerald-500/40 mx-auto" />
                        <p className="text-xs text-emerald-200 font-semibold m-0">
                          Non hai ancora aggiunto amici
                        </p>
                        <p className="text-[11px] text-emerald-400/70 m-0 max-w-xs mx-auto">
                          Invia una richiesta con l'indirizzo email del tuo amico qui sotto per collegarvi e sfidarvi ai tavoli!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[36vh] overflow-y-auto pr-1">
                        {friendsList.map((friend) => {
                          const status = getFriendOnlineStatus(friend.lastSeen);
                          return (
                            <div 
                              key={friend.friendshipId || friend.uid || friend.email}
                              className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-between gap-3 shadow-md hover:border-amber-400/40 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="relative shrink-0">
                                  {friend.photoURL ? (
                                    <img 
                                      src={friend.photoURL} 
                                      alt="" 
                                      className="w-10 h-10 rounded-full border-2 border-amber-400 object-cover" 
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-emerald-900 border-2 border-amber-400 text-amber-300 font-bold text-sm flex items-center justify-center">
                                      {(friend.displayName || friend.email || 'U').slice(0, 1).toUpperCase()}
                                    </div>
                                  )}
                                  <span 
                                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-emerald-950 ${
                                      status.color === 'emerald'
                                        ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                                        : status.color === 'amber'
                                        ? 'bg-amber-400'
                                        : 'bg-zinc-500'
                                    }`}
                                    title={status.label}
                                  />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-sm text-white truncate">
                                      {friend.displayName || 'Giocatore'}
                                    </span>
                                    <span className="text-[10px] text-amber-400">⭐</span>
                                  </div>
                                  <div className="text-[11px] text-emerald-300/70 truncate">
                                    {friend.email}
                                  </div>
                                  <div className="text-[10px] font-medium mt-0.5 flex items-center gap-1">
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      status.color === 'emerald' ? 'bg-emerald-400 animate-pulse' : status.color === 'amber' ? 'bg-amber-400' : 'bg-zinc-500'
                                    }`} />
                                    <span className={status.color === 'emerald' ? 'text-emerald-300 font-bold' : status.color === 'amber' ? 'text-amber-300/90' : 'text-zinc-400'}>
                                      {status.label}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Tasti Azione: Invita al Tavolo Attivo, Sfida, oppure Rimuovi */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {activeGame && activeGame.id && onInviteFriendToActiveGame && (
                                  tablePlayers.some(p => (friend.uid && p.uid === friend.uid) || (friend.email && p.email?.toLowerCase() === friend.email?.toLowerCase())) ? (
                                    <span className="px-2 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/40">
                                      Al Tavolo 🟢
                                    </span>
                                  ) : invitedFriendUids[friend.uid || friend.email] ? (
                                    <span className="px-2 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-400/40 flex items-center gap-1">
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>Inviato!</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={invitingFriendUids[friend.uid || friend.email]}
                                      onClick={() => handleInviteToActiveGame(friend)}
                                      className="px-2.5 py-1.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1 hover:brightness-110 disabled:opacity-50"
                                      title={`Invita subito ${friend.displayName || friend.email} a questo tavolo da gioco`}
                                    >
                                      <span>🎯</span>
                                      <span>{invitingFriendUids[friend.uid || friend.email] ? '...' : 'Invita al Tavolo'}</span>
                                    </button>
                                  )
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleChallenge(friend)}
                                  className={`px-2.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                                    activeGame && activeGame.id
                                      ? 'bg-emerald-900/80 hover:bg-emerald-800 text-amber-300 border border-amber-500/30'
                                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-black'
                                  }`}
                                  title={`Inizia una nuova partita con ${friend.displayName}`}
                                >
                                  {activeGame && activeGame.id ? <span>Nuova Sfida</span> : <><span>🎯</span><span>Sfida</span></>}
                                </button>

                                {onRemoveFriend && friend.friendshipId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Vuoi rimuovere ${friend.displayName || friend.email} dai tuoi amici?`)) {
                                        onRemoveFriend(friend.friendshipId);
                                      }
                                    }}
                                    className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400/70 hover:text-rose-300 border border-rose-800/40 transition-colors cursor-pointer"
                                    title="Rimuovi dai tuoi amici"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* SEZIONE 3: INVITA UN AMICO TRAMITE EMAIL O NOME (Pulita e ordinata) */}
                  <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
                      <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                      <span>Aggiungi un Amico</span>
                    </div>
                    <p className="text-[11px] text-emerald-300/80 m-0">
                      Scrivi l'email Google del tuo compagno di gioco per inviargli la richiesta di amicizia:
                    </p>
                    
                    <form onSubmit={handleFormSubmit} className="flex gap-2 pt-1">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 text-emerald-400/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={friendSearchInput}
                          onChange={(e) => setFriendSearchInput(e.target.value)}
                          placeholder="es. mario.rossi@gmail.com o nome..."
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-400/40 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                          disabled={isSendingFriend}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSendingFriend || !friendSearchInput.trim()}
                        className="px-3.5 py-2 rounded-xl gold-gradient text-emerald-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-950" />
                        <span>{isSendingFriend ? 'Invio...' : 'Invia'}</span>
                      </button>
                    </form>

                    {/* Suggerimenti live SOLO durante la digitazione di almeno 2 caratteri */}
                    {filteredSuggestions.length > 0 && (
                      <div className="mt-1 p-1.5 rounded-xl bg-emerald-900/90 border border-amber-400/40 space-y-1 shadow-lg animate-in fade-in">
                        <span className="text-[10px] uppercase font-bold text-amber-300 px-2 block">
                          Giocatori trovati:
                        </span>
                        {filteredSuggestions.map(sug => (
                          <div
                            key={sug.uid || sug.email}
                            onClick={() => handleSendFriend(sug)}
                            className="p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-800/80 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {sug.photoURL ? (
                                <img src={sug.photoURL} alt="" className="w-6 h-6 rounded-full border border-amber-400 object-cover shrink-0" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-emerald-800 text-amber-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {(sug.displayName || 'U').slice(0, 1).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-white truncate block">{sug.displayName}</span>
                                <span className="text-[10px] text-emerald-300/70 truncate block">{sug.email}</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-amber-300 shrink-0">➕ Invia Richiesta</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {friendFeedback && (
                      <div className={`p-2 rounded-lg text-xs font-medium ${
                        friendFeedback.type === 'success'
                          ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-600/60'
                          : 'bg-rose-950/80 text-rose-200 border border-rose-700/60'
                      }`}>
                        {friendFeedback.text}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

            {/* FOOTER FISSO PINNATO (Sempre visibile, non si sposta mai fuori schermo) */}
            <div className="p-3 border-t border-emerald-700/50 flex justify-between items-center shrink-0 bg-emerald-950/90">
              {activeTab === 'profile' ? (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Esci</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 text-xs font-bold cursor-pointer transition-all active:scale-95"
              >
                Chiudi
              </button>
            </div>

          </div>
        ) : (
          /* Stato Utente Non Autenticato */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-900/80 border-2 border-amber-400/60 flex items-center justify-center mx-auto text-amber-300 shadow-xl">
              <User className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-white mb-1">
                Collega il tuo Account Google
              </h3>
              <p className="text-xs text-emerald-300/80 max-w-xs mx-auto leading-relaxed">
                Accedi per salvare la tua carriera personale a vita, aggiungere i tuoi amici del Burraco Club, vedere quando sono online e sfidarli ai tavoli!
              </p>
            </div>

            <button
              type="button"
              onClick={onLogin}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-100 text-zinc-900 font-bold text-sm shadow-xl flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-98"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continua con Google</span>
            </button>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 text-xs font-semibold cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
