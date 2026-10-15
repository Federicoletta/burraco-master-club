import React, { useState } from 'react';
import { X, LogIn, LogOut, User, Trophy, Flame, Award, Calendar, Mail, ShieldCheck, Users, UserPlus, Send, Sparkles, Check } from 'lucide-react';
import { getFriendOnlineStatus } from '../services/social';

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
  onSendFriendRequest,
  onChallengeFriend,
  onInviteFriendToActiveGame,
  initialTab = 'profile'
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'profile' | 'friends'
  const [friendEmailInput, setFriendEmailInput] = useState('');
  const [friendFeedback, setFriendFeedback] = useState(null);
  const [isSendingFriend, setIsSendingFriend] = useState(false);
  const [invitingFriendUids, setInvitingFriendUids] = useState({});
  const [invitedFriendUids, setInvitedFriendUids] = useState({});

  if (!isOpen) return null;

  // Calcola statistiche collegate a questo utente autenticato
  const userDisplayName = currentUser?.displayName || 'Giocatore Burraco';
  const userPhoto = currentUser?.photoURL;
  const userEmail = currentUser?.email;

  // Cerca partite in cui compare il nome dell'utente
  const userGames = gamesHistory.filter(game => {
    if (!game) return false;
    const t1 = game.team1?.players || [];
    const t2 = game.team2?.players || [];
    const t3 = game.team3?.players || [];
    const all = [...t1, ...t2, ...t3];
    return all.some(p => p.toLowerCase() === userDisplayName.toLowerCase());
  });

  const gamesCount = userGames.length;
  let wonCount = 0;
  let totalScore = 0;

  userGames.forEach(game => {
    const isT1 = (game.team1?.players || []).some(p => p.toLowerCase() === userDisplayName.toLowerCase());
    const isT2 = (game.team2?.players || []).some(p => p.toLowerCase() === userDisplayName.toLowerCase());
    const isT3 = (game.team3?.players || []).some(p => p.toLowerCase() === userDisplayName.toLowerCase());

    const t1Score = (game.rounds || []).reduce((acc, r) => acc + (r.team1Score || 0), 0);
    const t2Score = (game.rounds || []).reduce((acc, r) => acc + (r.team2Score || 0), 0);
    const t3Score = (game.rounds || []).reduce((acc, r) => acc + (r.team3Score || 0), 0);

    if (isT1) totalScore += t1Score;
    if (isT2) totalScore += t2Score;
    if (isT3) totalScore += t3Score;

    if (game.winner === 'team1' && isT1) wonCount++;
    else if (game.winner === 'team2' && isT2) wonCount++;
    else if (game.winner === 'team3' && isT3) wonCount++;
  });

  const winRate = gamesCount > 0 ? Math.round((wonCount / gamesCount) * 100) : 0;

  const onlineFriends = friendsList.filter(f => getFriendOnlineStatus(f.lastSeen).isOnline);
  const onlineCount = onlineFriends.length;

  const handleSendFriend = async (e) => {
    e.preventDefault();
    if (!friendEmailInput.trim()) return;
    if (!onSendFriendRequest) return;
    setIsSendingFriend(true);
    setFriendFeedback(null);
    try {
      await onSendFriendRequest(friendEmailInput.trim());
      setFriendFeedback({
        type: 'success',
        text: `Richiesta di amicizia inviata a ${friendEmailInput.trim()}!`
      });
      setFriendEmailInput('');
    } catch (err) {
      setFriendFeedback({
        type: 'error',
        text: err.message || 'Errore durante l\'invio della richiesta'
      });
    } finally {
      setIsSendingFriend(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg felt-card rounded-2xl border border-amber-500/40 p-5 shadow-2xl space-y-4">
        
        {/* Intestazione */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md shrink-0">
              {activeTab === 'friends' ? (
                <Users className="w-5 h-5 text-emerald-950" />
              ) : (
                <User className="w-5 h-5 text-emerald-950" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white m-0">
                {activeTab === 'friends' ? 'I Miei Amici del Burraco' : 'Profilo Personale'}
              </h2>
              <p className="text-[11px] text-emerald-300/80 m-0">
                {activeTab === 'friends' 
                  ? 'Compagni di gioco connessi, sfide dirette e inviti'
                  : 'Account Google, statistiche di carriera e sincronizzazione'}
              </p>
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

        {/* Se l'utente è autenticato mostra le due schede (Profilo / Amici) */}
        {currentUser ? (
          <div className="space-y-4">
            
            {/* Barra di Navigazione tra le due schede */}
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
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'friends'
                    ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                    : 'text-emerald-300 hover:text-white hover:bg-emerald-900/40'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>I Miei Amici</span>
                {friendsList.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === 'friends' ? 'bg-emerald-950 text-amber-300' : 'bg-emerald-900 text-emerald-200'
                  }`}>
                    {friendsList.length}
                  </span>
                )}
                {onlineCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title={`${onlineCount} amici online adesso`} />
                )}
              </button>
            </div>

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

                {/* Box Informativo */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                  <span className="font-bold block flex items-center gap-1.5 text-amber-300">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Profilo sincronizzato nel Cloud</span>
                  </span>
                  <p className="text-[11px] text-amber-200/80 m-0">
                    Le tue partite, vittorie e amici sono protetti e sincronizzati automaticamente su tutti i tuoi dispositivi (iPad, PC, smartphone).
                  </p>
                </div>

                {/* Pulsante Logout */}
                <div className="pt-2 flex justify-between items-center border-t border-emerald-700/50">
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Esci dall'Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 text-xs font-semibold cursor-pointer"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            )}

            {/* SCHEDA 2: I MIEI AMICI ONLINE */}
            {activeTab === 'friends' && (
              <div className="space-y-3.5 animate-in fade-in duration-150">
                {/* Form Invita Amico tramite Email */}
                <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
                    <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Aggiungi Amico tramite Email</span>
                  </div>
                  <p className="text-[11px] text-emerald-300/80 m-0">
                    Inserisci l'indirizzo email Google del tuo amico: gli comparirà subito la notifica per accettare!
                  </p>
                  
                  <form onSubmit={handleSendFriend} className="flex gap-2 pt-1">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-emerald-400/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={friendEmailInput}
                        onChange={(e) => setFriendEmailInput(e.target.value)}
                        placeholder="es. mario.rossi@gmail.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-emerald-900/60 border border-emerald-700/60 text-white placeholder-emerald-400/40 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                        disabled={isSendingFriend}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSendingFriend || !friendEmailInput.trim()}
                      className="px-3.5 py-2 rounded-xl gold-gradient text-emerald-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-950" />
                      <span>{isSendingFriend ? 'Invio...' : 'Invia'}</span>
                    </button>
                  </form>

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

                {/* Lista Amici Confermati */}
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
                    <div className="py-8 text-center rounded-xl bg-emerald-950/40 border border-emerald-800/40 p-4 space-y-2">
                      <Users className="w-8 h-8 text-emerald-500/40 mx-auto" />
                      <p className="text-xs text-emerald-300/80 font-medium m-0">
                        Non hai ancora aggiunto amici.
                      </p>
                      <p className="text-[11px] text-emerald-400/60 m-0">
                        Aggiungi i tuoi compagni di Burraco per vedere quando sono online e sfidarli a giocare!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
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

                            {/* Tasti Azione: Invita al Tavolo Attivo oppure Nuova Sfida */}
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end border-t border-emerald-700/50">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 text-xs font-semibold cursor-pointer"
                  >
                    Chiudi
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Stato Utente Non Autenticato */
          <div className="text-center py-4 space-y-4">
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

            <p className="text-[11px] text-emerald-400/60 m-0">
              Nessuna password da ricordare • 100% gratuito e sicuro
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
