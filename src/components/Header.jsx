import React, { useState, useEffect, memo, lazy, Suspense } from 'react';
import { 
  Share2, 
  BookOpen, 
  Settings,
  Music,
  Sun,
  RotateCw,
  Sparkles,
  Bell,
  Palette,
  Volume2,
  VolumeX
} from 'lucide-react';
import { THEMES } from '../utils/theme';
import { sound } from '../utils/soundEffects';
import { bgMusic } from '../utils/backgroundMusic';
import { wakeLock } from '../utils/wakeLock';
import { checkForUpdates, forceAppUpdate, getFormattedBuildDate } from '../utils/versionCheck';
const AudioSettingsModal = lazy(() => import('./AudioSettingsModal'));

function Header({ 
  onOpenRules,
  onShareGame,
  hasActiveGame,
  notificationCount = 0,
  onOpenNotifications,
  onOpenThemeSelector,
  currentTheme = 'emerald'
}) {
  const [soundOn, setSoundOn] = useState(sound.enabled);
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

  useEffect(() => {
    let mounted = true;
    const runCheck = async () => {
      const res = await checkForUpdates();
      if (mounted && res?.hasUpdate) {
        setUpdateInfo(res);
      }
    };
    runCheck();

    const interval = setInterval(runCheck, 60000); // Controlla ogni 60s
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

  return (
    <header 
      className="felt-card border-b border-amber-500/20 px-3 sm:px-6 py-2.5 sticky top-0 z-30 shadow-lg w-full transition-all"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
        paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 0.75rem)',
        paddingRight: 'calc(env(safe-area-inset-right, 0px) + 0.75rem)',
      }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 w-full">
        
        {/* Logo & Titolo Luxury */}
        <div className="flex items-center gap-2.5 shrink-0 select-none">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl gold-gradient flex items-center justify-center shadow-md shadow-amber-950/40 text-emerald-950 font-black text-sm sm:text-base shrink-0">
            ♠
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-white m-0 flex items-center gap-1.5">
              <span>Burraco</span>
              <span className="text-amber-400 font-serif">Master Club</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-emerald-300/70 m-0">
              {hasActiveGame ? 'Partita al tavolo in corso' : 'Tavolo da gioco'} • ♣ ♦ ♥ ♠
            </p>
          </div>
        </div>

        {/* Strumenti Rapidi di Bordo Tavolo (Zero Ridondanze con la Bottom Bar) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* 1. Tasto Audio & Jazz */}
          <button
            type="button"
            onClick={() => setIsAudioModalOpen(true)}
            className={`h-9 px-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 touch-manipulation select-none ${
              musicState.isPlaying
                ? 'bg-amber-400/20 border-amber-400/60 text-amber-300 shadow-sm shadow-amber-950/30'
                : 'bg-emerald-950/70 hover:bg-emerald-900 border-emerald-700/50 text-emerald-300'
            }`}
            title="Audio & Musica Jazz"
          >
            <Music className={`w-4 h-4 ${musicState.isPlaying ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
            <span className="hidden md:inline text-[11px]">
              {musicState.isPlaying ? 'Jazz ON' : 'Audio'}
            </span>
          </button>

          {/* 2. Selettore Panno Feltro */}
          {onOpenThemeSelector && (
            <button
              type="button"
              onClick={onOpenThemeSelector}
              className="h-9 px-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 hover:text-amber-300 transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 select-none"
              title="Cambia colore del panno di gioco"
            >
              <Palette className="w-4 h-4 text-amber-400" />
              <span className="hidden lg:inline text-[11px]">Panno</span>
            </button>
          )}

          {/* 3. Notifiche & Inviti Amici */}
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className={`relative h-9 px-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer active:scale-95 select-none ${
                notificationCount > 0
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200 ring-2 ring-amber-400/40 shadow-md shadow-amber-950/40'
                  : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border-emerald-700/50'
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

          {/* 4. Menu Strumenti Utilità Tavolo */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`relative h-9 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer active:scale-95 select-none border ${
                updateInfo.hasUpdate
                  ? 'bg-amber-500/25 text-amber-200 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                  : isMenuOpen
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/50'
                  : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border-emerald-700/50'
              }`}
              title="Opzioni e impostazioni tavolo"
            >
              <Settings className={`w-4 h-4 text-amber-300 transition-transform duration-200 ${isMenuOpen ? 'rotate-45' : ''}`} />
              {updateInfo.hasUpdate && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-emerald-950 animate-ping" />
              )}
            </button>

            {/* Menu a tendina Utilità */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
                  onClick={() => setIsMenuOpen(false)}
                />
                
                <div className="fixed sm:absolute right-3 sm:right-0 top-14 sm:top-full mt-2 w-72 rounded-2xl bg-emerald-950/95 backdrop-blur-md border border-amber-500/40 shadow-2xl p-2.5 z-50 text-white animate-in fade-in zoom-in-95 duration-150 space-y-1.5">
                  
                  <div className="px-3 py-1.5 border-b border-emerald-800/60 flex items-center justify-between text-[11px] font-bold text-amber-400 tracking-wider uppercase">
                    <span className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5" />
                      Opzioni Tavolo
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">
                      {getFormattedBuildDate()}
                    </span>
                  </div>

                  {/* Schermo Sempre Acceso */}
                  <button
                    type="button"
                    onClick={() => {
                      wakeLock.toggle();
                      setWakeLockState({ enabled: wakeLock.enabled, active: wakeLock.active });
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Sun className={`w-4 h-4 shrink-0 ${wakeLockState.enabled ? 'text-amber-400' : 'text-emerald-400'}`} />
                      <span>Schermo Sempre Acceso</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                      wakeLockState.enabled
                        ? 'bg-amber-400 text-emerald-950'
                        : 'bg-emerald-900 text-emerald-400 border border-emerald-800'
                    }`}>
                      {wakeLockState.enabled ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Regole Ufficiali */}
                  {onOpenRules && (
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
                        <div className="text-white font-bold">Regole Ufficiali</div>
                        <div className="text-[10px] text-emerald-300/70 font-normal">Punteggi carte, combinazioni e chiusure</div>
                      </div>
                    </button>
                  )}

                  {/* Condividi Partita su WhatsApp (se attiva) */}
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

                  {/* Verifica Aggiornamenti */}
                  <div className="pt-1 border-t border-emerald-800/40">
                    <button
                      type="button"
                      disabled={isCheckingUpdate}
                      onClick={async () => {
                        if (updateInfo.hasUpdate) {
                          forceAppUpdate();
                        } else {
                          setIsCheckingUpdate(true);
                          const res = await checkForUpdates();
                          setIsCheckingUpdate(false);
                          if (res?.hasUpdate) {
                            setUpdateInfo(res);
                          }
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-colors cursor-pointer ${
                        updateInfo.hasUpdate
                          ? 'bg-amber-400 text-emerald-950 font-black shadow-md'
                          : 'hover:bg-emerald-900/70 text-emerald-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <RotateCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                        <span>{updateInfo.hasUpdate ? 'Aggiorna Ora App!' : isCheckingUpdate ? 'Controllo in corso...' : 'Verifica Aggiornamenti'}</span>
                      </span>
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>

        </div>

      </div>

      {/* Modale Regolazione Audio / Musica Jazz */}
      <Suspense fallback={null}>
        {isAudioModalOpen && (
          <AudioSettingsModal
            isOpen={isAudioModalOpen}
            onClose={() => setIsAudioModalOpen(false)}
          />
        )}
      </Suspense>
    </header>
  );
}

export default memo(Header);
