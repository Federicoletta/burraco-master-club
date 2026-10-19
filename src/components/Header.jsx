import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Users, 
  History, 
  Share2, 
  Cloud, 
  BookOpen, 
  Settings,
  Music,
  Sun,
  RotateCw,
  Sparkles,
  Trophy,
  User,
  LogIn,
  Bell,
  BarChart3,
  Volume2,
  VolumeX
} from 'lucide-react';
import { sound } from '../utils/soundEffects';
import { bgMusic } from '../utils/backgroundMusic';
import { wakeLock } from '../utils/wakeLock';
import { checkForUpdates, forceAppUpdate, getFormattedBuildDate } from '../utils/versionCheck';
import { getFriendOnlineStatus } from '../services/social';
import AudioSettingsModal from './AudioSettingsModal';

export default function Header({ 
  onNewGame, 
  onOpenHistory, 
  onOpenCloud,
  onOpenRules,
  onOpenTournament,
  onShareGame,
  hasActiveGame,
  hasActiveTournament,
  currentUser,
  onOpenProfile,
  onLogin,
  notificationCount = 0,
  onOpenNotifications,
  friendsList = []
}) {
  const [soundOn, setSoundOn] = useState(sound.enabled);
  const [volume, setVolume] = useState(Math.round(sound.volume * 100));
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState({ hasUpdate: false });
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [musicState, setMusicState] = useState({
    isPlaying: bgMusic.isPlaying,
    volume: bgMusic.volume,
    trackId: bgMusic.trackId,
    enabled: bgMusic.enabled
  });

  const [wakeLockState, setWakeLockState] = useState({
    enabled: wakeLock.enabled,
    active: wakeLock.active
  });

  const onlineFriendsCount = (friendsList || []).filter(f => {
    try {
      return getFriendOnlineStatus(f.lastSeen).isOnline;
    } catch {
      return false;
    }
  }).length;

  useEffect(() => {
    let mounted = true;
    const runCheck = async () => {
      const res = await checkForUpdates();
      if (mounted && res?.hasUpdate) {
        setUpdateInfo(res);
      }
    };
    runCheck();

    const interval = setInterval(runCheck, 45000); // Controlla ogni 45 secondi
    const onVisChange = () => {
      if (document.visibilityState === 'visible') runCheck();
    };
    document.addEventListener('visibilitychange', onVisChange);

    const unsubMusic = bgMusic.subscribe((state) => {
      setMusicState({ ...state });
    });
    const unsubWakeLock = wakeLock.subscribe((state) => {
      setWakeLockState({ ...state });
    });
    return () => {
      mounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisChange);
      unsubMusic();
      unsubWakeLock();
    };
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    sound.setSoundEnabled(next);
    setSoundOn(next);
    if (next) sound.playTap();
  };

  const handleVolumeChange = (newVal) => {
    const vol = Number(newVal);
    setVolume(vol);
    sound.setVolume(vol / 100);
    setSoundOn(vol > 0);
  };

  return (
    <header 
      className="felt-card border-b border-amber-500/20 px-2 sm:px-4 md:px-6 pb-2 sm:pb-2.5 sticky top-0 z-30 shadow-lg w-full transition-all"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.625rem)',
        paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 0.5rem)',
        paddingRight: 'calc(env(safe-area-inset-right, 0px) + 0.5rem)',
      }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3 w-full">
        
        {/* Logo e Titolo (shrink-0 per non essere MAI schiacciato o troncato) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-900/40 text-emerald-950 font-black text-sm sm:text-base select-none shrink-0">
            ♠
          </div>
          <div className="shrink-0">
            <h1 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white m-0 whitespace-nowrap">
              Burraco<span className="text-amber-400 font-serif ml-0.5">Score</span>
            </h1>
            <p className="hidden md:block text-[11px] text-emerald-300/80 m-0 whitespace-nowrap">
              {hasActiveGame ? 'Partita in corso' : 'Pronto per giocare'} • ♣ ♦ ♥ ♠
            </p>
          </div>
        </div>

        {/* Azioni barra superiore - Pulite, ordinate e intuitive */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          
          {/* 1. Modalità Torneo (Desktop e schermi comodi; su mobile è accessibile nel menu) */}
          {onOpenTournament && (
            <button
              type="button"
              onClick={onOpenTournament}
              className={`hidden sm:flex h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl border transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none ${
                hasActiveTournament
                  ? 'bg-amber-500/25 text-amber-200 border-amber-400 ring-2 ring-amber-400/40 shadow-md shadow-amber-950/40 font-black'
                  : 'bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border-emerald-600/40'
              }`}
              title="Modalità Torneo a Gironi"
            >
              <Trophy className="w-4 h-4 text-amber-400 shrink-0 pointer-events-none" />
              <span className="hidden md:inline pointer-events-none">Torneo</span>
              {hasActiveTournament && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              )}
            </button>
          )}

          {/* 2. Tasto Rapido Audio / Jazz (Desktop; su mobile è accessibile nel menu) */}
          <button
            type="button"
            onClick={() => setIsAudioModalOpen(true)}
            className={`hidden sm:flex h-9 sm:h-10 px-2 sm:px-2.5 rounded-xl border transition-all items-center justify-center gap-1 text-xs cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none ${
              musicState.isPlaying
                ? 'bg-amber-400/20 border-amber-400/60 text-amber-300 shadow-sm shadow-amber-950/30'
                : 'bg-emerald-900/70 hover:bg-emerald-800 border-emerald-600/40 text-emerald-300'
            }`}
            title="Regola musica jazz e volume"
          >
            <Music className={`w-4 h-4 ${musicState.isPlaying ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
            {musicState.isPlaying && (
              <span className="hidden md:inline font-bold text-[11px] text-amber-300">Jazz ON</span>
            )}
          </button>

          {/* 3. Profilo & Account Utente Google (Visibile su mobile e desktop) */}
          {onOpenProfile && (
            <button
              type="button"
              onClick={() => onOpenProfile('profile')}
              className={`flex h-8.5 w-8.5 sm:w-auto sm:h-10 px-0 sm:px-2.5 rounded-xl border transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none ${
                currentUser
                  ? 'bg-emerald-950/80 hover:bg-emerald-900 text-amber-200 border-amber-400/50 shadow-sm'
                  : 'bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border-emerald-600/40'
              }`}
              title={
                currentUser 
                  ? `Profilo: ${currentUser.displayName || currentUser.email}${onlineFriendsCount > 0 ? ` (${onlineFriendsCount} amici online)` : ''}` 
                  : "Accedi con Google"
              }
            >
              <div className="relative shrink-0 flex items-center justify-center">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Avatar'}
                    className="w-6 h-6 rounded-full border border-amber-400 shrink-0 object-cover"
                  />
                ) : currentUser ? (
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 font-black text-[11px] flex items-center justify-center shrink-0">
                    {(currentUser.displayName || currentUser.email || 'U').slice(0, 1).toUpperCase()}
                  </div>
                ) : (
                  <User className="w-4 h-4 text-emerald-300 shrink-0 pointer-events-none" />
                )}
                {onlineFriendsCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-950 animate-pulse" 
                    title={`${onlineFriendsCount} online adesso`}
                  />
                )}
              </div>
              <span className="hidden sm:inline pointer-events-none max-w-[85px] truncate">
                {currentUser ? (currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Profilo') : 'Accedi'}
              </span>
            </button>
          )}

          {/* 4. Campanella Notifiche & Inviti */}
          {currentUser && onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className={`relative h-8.5 sm:h-10 px-2 sm:px-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none ${
                notificationCount > 0
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200 ring-2 ring-amber-400/40 shadow-md shadow-amber-950/40'
                  : 'bg-emerald-900/70 hover:bg-emerald-800 text-emerald-300 border-emerald-600/40'
              }`}
              title={notificationCount > 0 ? `${notificationCount} notifiche non lette` : "Notifiche & Inviti"}
            >
              <Bell className={`w-4 h-4 ${notificationCount > 0 ? 'text-amber-300 animate-bounce' : 'text-emerald-300'}`} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-400 text-emerald-950 text-[9px] font-black flex items-center justify-center shadow-md border-2 border-emerald-950 animate-pulse">
                  {notificationCount}
                </span>
              )}
            </button>
          )}

          {/* 5. Menu Compatto "Altro" (Design responsivo & pulito per mobile e desktop) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`relative h-8.5 sm:h-10 px-2.5 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none border ${
                updateInfo.hasUpdate
                  ? 'bg-amber-500/25 text-amber-200 border-amber-400 ring-2 ring-amber-400/40 shadow-md shadow-amber-950/40'
                  : isMenuOpen
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/50 ring-1 ring-amber-400/30 shadow-md shadow-amber-950/30'
                  : 'bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border-emerald-600/40'
              }`}
              title="Menu, Partecipanti e Opzioni"
            >
              <Settings className={`w-4 h-4 text-amber-300 pointer-events-none transition-transform duration-200 ${isMenuOpen ? 'rotate-45 text-amber-200' : ''}`} />
              <span className="hidden sm:inline pointer-events-none">Altro</span>
              {updateInfo.hasUpdate && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-emerald-950 animate-ping" />
              )}
            </button>

            {/* Menu a tendina Impostazioni & Funzioni */}
            {isMenuOpen && (
              <>
                {/* Overlay scuro per chiudere cliccando fuori */}
                <div 
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
                  onClick={() => setIsMenuOpen(false)}
                />
                
                <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-14 sm:top-full mt-2 w-auto sm:w-80 max-w-[360px] mx-auto sm:mx-0 rounded-2xl bg-emerald-950/95 backdrop-blur-md border border-amber-500/40 shadow-2xl p-2.5 z-50 text-white animate-in fade-in zoom-in-95 duration-150 space-y-2 max-h-[85vh] overflow-y-auto">
                  
                  {/* Intestazione del menu */}
                  <div className="px-3 py-1.5 border-b border-emerald-800/60 flex items-center justify-between text-[11px] font-bold text-amber-400 tracking-wider uppercase">
                    <span className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-amber-400" />
                      Menu & Strumenti
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-mono font-normal">
                      {getFormattedBuildDate()}
                    </span>
                  </div>

                  {/* Scheda Profilo & Account Personale */}
                  {onOpenProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenProfile('profile');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer border border-amber-500/30 shadow-xs"
                    >
                      {currentUser?.photoURL ? (
                        <img 
                          src={currentUser.photoURL} 
                          alt="" 
                          className="w-8 h-8 rounded-full border border-amber-400 shrink-0 object-cover" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-400 text-emerald-950 font-black text-xs flex items-center justify-center shrink-0">
                          {currentUser ? (currentUser.displayName || currentUser.email || 'U').slice(0, 1).toUpperCase() : <User className="w-4 h-4" />}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-bold truncate">
                          {currentUser ? (currentUser.displayName || 'Il tuo Profilo') : 'Accedi con Google'}
                        </div>
                        <div className="text-[10px] text-amber-300/80 font-normal truncate">
                          {currentUser ? (currentUser.email || 'Statistiche e trofei cloud') : 'Sincronizza partite e compagni'}
                        </div>
                      </div>
                    </button>
                  )}

                  {/* SEZIONE 1: PARTITA & TORNEI */}
                  <div className="pt-1">
                    <div className="px-2 pb-1 text-[10px] font-bold text-amber-400/80 uppercase tracking-wider flex items-center gap-1">
                      <span>🃏 Partita & Tornei</span>
                    </div>

                    <div className="space-y-0.5">
                      {/* Nuova Partita */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNewGame();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-white font-bold">Nuova Partita</div>
                          <div className="text-[10px] text-emerald-300/70 font-normal">Avvia tavolo a coppie, singolo o a 3</div>
                        </div>
                      </button>

                      {/* Modalità Torneo a Gironi */}
                      {onOpenTournament && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenTournament();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                            hasActiveTournament
                              ? 'bg-amber-500/15 text-amber-200 border border-amber-400/40'
                              : 'hover:bg-emerald-900/70 text-emerald-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-white font-bold truncate">Torneo a Gironi</div>
                              <div className="text-[10px] text-emerald-300/70 font-normal truncate">Tabelloni, classifica e scontri</div>
                            </div>
                          </div>
                          {hasActiveTournament && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-amber-400 text-emerald-950 uppercase shrink-0">
                              In Corso
                            </span>
                          )}
                        </button>
                      )}

                      {/* Archivio Partite */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenHistory();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                      >
                        <History className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-white font-bold">Archivio Partite</div>
                          <div className="text-[10px] text-emerald-300/70 font-normal">Storico mani, modifica e partite concluse</div>
                        </div>
                      </button>

                      {/* Regole del Burraco */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenRules();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-white font-bold">Regole del Burraco</div>
                          <div className="text-[10px] text-emerald-300/70 font-normal">Punteggi carte, combinazioni e chiusure</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* SEZIONE 2: CONDIVISIONE & CLOUD */}
                  <div className="pt-1 border-t border-emerald-800/40">
                    <div className="px-2 pb-1 text-[10px] font-bold text-amber-400/80 uppercase tracking-wider flex items-center gap-1">
                      <span>🌐 Condivisione & Cloud</span>
                    </div>

                    <div className="space-y-0.5">
                      {/* Cloud Database & Invita al Tavolo */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenCloud();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                      >
                        <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-white font-bold">Invita al Tavolo (Cloud)</div>
                          <div className="text-[10px] text-emerald-300/70 font-normal">Condividi codice o link multiplayer</div>
                        </div>
                      </button>

                      {/* Condividi Punteggio WhatsApp (se partita attiva) */}
                      {hasActiveGame && onShareGame && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onShareGame();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                        >
                          <Share2 className="w-4 h-4 text-emerald-300 shrink-0" />
                          <div>
                            <div className="text-white font-bold">Condividi Punteggio</div>
                            <div className="text-[10px] text-emerald-300/70 font-normal">Invia riepilogo su WhatsApp</div>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SEZIONE 3: AUDIO & IMPOSTAZIONI */}
                  <div className="pt-1 border-t border-emerald-800/40">
                    <div className="px-2 pb-1 text-[10px] font-bold text-amber-400/80 uppercase tracking-wider flex items-center gap-1">
                      <span>⚙️ Audio & Impostazioni</span>
                    </div>

                    <div className="space-y-0.5">
                      {/* Audio & Musica Jazz Unificato */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsAudioModalOpen(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <Music className={`w-4 h-4 shrink-0 ${musicState.isPlaying ? 'text-amber-400' : 'text-emerald-400'}`} />
                          <span>Audio & Musica Jazz</span>
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                          musicState.isPlaying
                            ? 'bg-amber-400 text-emerald-950 font-black shadow-xs' 
                            : 'bg-emerald-900 text-emerald-300 border border-emerald-700/60'
                        }`}>
                          {musicState.isPlaying ? 'JAZZ ON' : `${volume}%`}
                        </span>
                      </button>

                      {/* Schermo Sempre Acceso */}
                      <button
                        type="button"
                        onClick={() => {
                          wakeLock.toggle();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <Sun className={`w-4 h-4 shrink-0 ${wakeLockState.enabled ? 'text-amber-400' : 'text-emerald-400/60'}`} />
                          <span>Schermo Sempre Acceso</span>
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black ${wakeLockState.enabled ? 'bg-amber-400 text-emerald-950 font-black shadow-xs' : 'bg-white/10 text-white/50'}`}>
                          {wakeLockState.enabled ? 'ATTIVO' : 'OFF'}
                        </span>
                      </button>

                      {/* Ricarica / Aggiorna */}
                      <button
                        type="button"
                        onClick={async () => {
                          setIsCheckingUpdate(true);
                          const res = await checkForUpdates();
                          if (res.hasUpdate) {
                            forceAppUpdate();
                          } else {
                            window.location.reload();
                          }
                          setIsCheckingUpdate(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer border ${
                          updateInfo.hasUpdate
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/30'
                            : 'hover:bg-emerald-900/70 border-transparent text-emerald-100'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <RotateCw className={`w-4 h-4 shrink-0 ${isCheckingUpdate || updateInfo.hasUpdate ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
                          <span>{updateInfo.hasUpdate ? 'Nuova Versione!' : 'Ricarica App'}</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 font-bold border border-emerald-700/60">
                          {isCheckingUpdate ? '...' : updateInfo.hasUpdate ? 'AGGIORNA' : 'RICARICA'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* 6. Nuova Partita (Opzione A: compatto su mobile, esteso su schermi più ampi) */}
          <button
            type="button"
            onClick={onNewGame}
            className="h-8.5 w-8.5 sm:w-auto sm:h-10 px-0 sm:px-4 py-0 sm:py-1.5 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-black shadow-md shadow-amber-950/40 transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap touch-manipulation select-none"
            title="Inizia una nuova partita"
          >
            <PlusCircle className="w-4.5 h-4.5 sm:w-4 sm:h-4 text-emerald-950 shrink-0 pointer-events-none" />
            <span className="pointer-events-none hidden sm:inline text-xs sm:text-sm font-black">+ Nuova Partita</span>
          </button>

        </div>
      </div>

      {/* Banner Notifica Nuovo Aggiornamento Disponibile (visibile su iPad/mobile/desktop quando c'è una nuova release) */}
      {updateInfo.hasUpdate && (
        <div className="max-w-5xl mx-auto mt-2 p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-amber-500/25 via-amber-400/35 to-amber-500/25 border border-amber-400/60 flex items-center justify-between gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs text-amber-100">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
            <div>
              <span className="font-bold text-white">Nuova versione disponibile!</span>
              <span className="hidden sm:inline text-amber-200/90 ml-1">L'app è stata aggiornata. Tocca per applicare le novità.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => forceAppUpdate()}
            className="px-3 py-1.5 rounded-lg gold-gradient text-emerald-950 font-black text-xs shrink-0 shadow-md hover:brightness-110 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            AGGIORNA ORA
          </button>
        </div>
      )}

      {/* Modale Regolazione Volume & Effetti Sonori */}
      <AudioSettingsModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        soundOn={soundOn}
        onToggleSound={handleToggleSound}
        volume={volume}
        onChangeVolume={handleVolumeChange}
      />
    </header>
  );
}
