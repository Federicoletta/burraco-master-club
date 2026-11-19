import React, { useState, useEffect, useRef, useCallback, memo, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import {
  Share2,
  BookOpen,
  Settings,
  Music,
  Sun,
  RotateCw,
  Bell,
  Palette,
  X,
  Check
} from 'lucide-react';
import { sound } from '../utils/soundEffects';
import { bgMusic } from '../utils/backgroundMusic';
import { wakeLock } from '../utils/wakeLock';
import {
  checkForUpdates,
  applyAppUpdate,
  subscribeToAppUpdates,
  getFormattedBuildDate
} from '../utils/versionCheck';
import { useModalEscape } from '../hooks/useModalEscape';
import PWAInstallButton from './PWAInstallButton';

const AudioSettingsModal = lazy(() => import('./AudioSettingsModal'));

function Header({
  onOpenRules,
  onShareGame,
  hasActiveGame,
  notificationCount = 0,
  onOpenNotifications,
  onOpenThemeSelector
}) {
  const [soundOn, setSoundOn] = useState(sound.enabled);
  const [soundVolume, setSoundVolume] = useState(() => Math.round(sound.volume * 100));
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState({ top: 68, right: 16 });
  const [updateInfo, setUpdateInfo] = useState({ hasUpdate: false });
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [upToDateNotice, setUpToDateNotice] = useState(false);
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

  const menuButtonRef = useRef(null);
  const upToDateTimerRef = useRef(null);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  useModalEscape(isMenuOpen, closeMenu);

  const updateMenuCoords = useCallback(() => {
    const btn = menuButtonRef.current;
    if (!btn || typeof window === 'undefined') return;
    const rect = btn.getBoundingClientRect();
    const rightOffset = Math.max(12, Math.round(window.innerWidth - rect.right));
    const topOffset = Math.max(56, Math.round(rect.bottom + 8));
    setMenuCoords({ top: topOffset, right: rightOffset });
  }, []);

  const handleToggleMenu = useCallback(() => {
    if (!isMenuOpen) {
      updateMenuCoords();
      setIsMenuOpen(true);
    } else {
      setIsMenuOpen(false);
    }
  }, [isMenuOpen, updateMenuCoords]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const handleResize = () => updateMenuCoords();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMenuOpen, updateMenuCoords]);

  useEffect(() => {
    const unsubUpdates = subscribeToAppUpdates((state) => {
      if (state?.hasUpdate) {
        setUpdateInfo(state);
      }
    });

    const runCheck = () => {
      checkForUpdates();
    };
    runCheck();

    const interval = setInterval(runCheck, 60000);
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
      unsubUpdates();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisChange);
      unsubMusic();
      unsubWakeLock();
      if (upToDateTimerRef.current) clearTimeout(upToDateTimerRef.current);
    };
  }, []);

  const menuPortal = isMenuOpen && typeof document !== 'undefined'
    ? createPortal(
      <>
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-[2px]"
          onClick={closeMenu}
          aria-hidden="true"
        />

        {/* Bottom Sheet su mobile (<640px), Dropdown ancorato al pulsante su tablet/desktop (>=640px) */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Opzioni Tavolo"
          style={{
            '--menu-top': `${menuCoords.top}px`,
            '--menu-right': `${menuCoords.right}px`,
          }}
          className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:left-auto sm:top-[var(--menu-top)] sm:right-[var(--menu-right)] sm:w-80 max-h-[85dvh] overflow-y-auto club-modal-scroll rounded-t-3xl sm:rounded-2xl club-card-solid p-4 sm:p-3 z-[95] club-text-primary space-y-2 club-sheet-enter pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] sm:pb-3"
        >
          <div className="w-10 h-1 rounded-full club-handle mx-auto mb-2 sm:hidden" />

          <div className="px-2 pb-2 border-b club-divider flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider club-text-gold">
              <Settings className="w-3.5 h-3.5" />
              Opzioni Tavolo
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono-num club-text-subtle">
                {getFormattedBuildDate()}
              </span>
              <button
                type="button"
                onClick={closeMenu}
                className="sm:hidden min-w-[36px] min-h-[36px] rounded-lg club-inset club-text-muted flex items-center justify-center cursor-pointer"
                aria-label="Chiudi menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Schermo Sempre Acceso */}
          <button
            type="button"
            onClick={() => {
              wakeLock.toggle();
              setWakeLockState({ enabled: wakeLock.enabled, active: wakeLock.active });
            }}
            className="w-full min-h-[46px] flex items-center justify-between px-3 py-2.5 rounded-xl club-hover-soft text-left text-sm font-semibold transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <Sun className={`w-4 h-4 shrink-0 ${wakeLockState.enabled ? 'club-text-gold' : 'club-text-muted'}`} />
              <span>Schermo Sempre Acceso</span>
            </span>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold ${
              wakeLockState.enabled
                ? 'gold-gradient'
                : 'club-inset club-text-muted'
            }`}>
              {wakeLockState.enabled ? 'Attivo' : 'Spento'}
            </span>
          </button>

          {/* Regole Ufficiali */}
          {onOpenRules && (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onOpenRules();
              }}
              className="w-full min-h-[46px] flex items-center gap-3 px-3 py-2.5 rounded-xl club-hover-soft text-left transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 club-text-gold shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold club-text-primary">Regole Ufficiali</div>
                <div className="text-xs club-text-subtle">Punteggi carte, burrachi e chiusure</div>
              </div>
            </button>
          )}

          {/* Condividi Partita su WhatsApp */}
          {hasActiveGame && onShareGame && (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onShareGame();
              }}
              className="w-full min-h-[46px] flex items-center gap-3 px-3 py-2.5 rounded-xl club-hover-soft text-left transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 club-text-muted shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold club-text-primary">Condividi Punteggio</div>
                <div className="text-xs club-text-subtle">Invia riepilogo partita su WhatsApp</div>
              </div>
            </button>
          )}

          {/* Installa App PWA (si nasconde in modalità standalone) */}
          <PWAInstallButton variant="menu" onAfterClick={closeMenu} />

          {/* Aggiornamenti */}
          <div className="pt-1.5 border-t club-divider">
            <button
              type="button"
              disabled={isCheckingUpdate}
              onClick={async () => {
                if (updateInfo.hasUpdate) {
                  applyAppUpdate();
                } else {
                  setIsCheckingUpdate(true);
                  setUpToDateNotice(false);
                  const res = await checkForUpdates();
                  setIsCheckingUpdate(false);
                  if (res?.hasUpdate) {
                    setUpdateInfo(res);
                  } else {
                    setUpToDateNotice(true);
                    if (upToDateTimerRef.current) clearTimeout(upToDateTimerRef.current);
                    upToDateTimerRef.current = setTimeout(() => setUpToDateNotice(false), 3000);
                  }
                }
              }}
              className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm font-semibold transition-colors cursor-pointer ${
                updateInfo.hasUpdate
                  ? 'gold-gradient font-bold'
                  : upToDateNotice
                    ? 'bg-emerald-500/15 club-success-text'
                    : 'club-hover-soft club-text-muted'
              }`}
            >
              <span className="flex items-center gap-2.5">
                {upToDateNotice && !updateInfo.hasUpdate ? (
                  <Check className="w-4 h-4 club-success-text shrink-0" />
                ) : (
                  <RotateCw className={`w-4 h-4 shrink-0 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                )}
                <span>
                  {updateInfo.hasUpdate
                    ? 'Aggiorna Ora App'
                    : isCheckingUpdate
                      ? 'Controllo in corso...'
                      : upToDateNotice
                        ? 'App già aggiornata'
                        : 'Verifica Aggiornamenti'}
                </span>
              </span>
            </button>
          </div>
        </div>
      </>,
      document.body
    )
    : null;

  return (
    <header
      className="club-header-bar px-3 sm:px-6 py-2 sticky top-0 z-30 w-full"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.45rem)',
        paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 0.75rem)',
        paddingRight: 'calc(env(safe-area-inset-right, 0px) + 0.75rem)',
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 w-full min-h-[44px]">
        {/* Marchio Club Italiano Elegante */}
        <div className="flex items-center gap-2.5 min-w-0 select-none">
          <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center font-display font-bold text-base shrink-0">
            ♠
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="text-[15px] sm:text-lg font-bold tracking-tight club-text-primary m-0 flex items-baseline gap-1.5 truncate">
              <span>Burraco</span>
              <span className="font-display italic font-bold text-[16px] sm:text-[19px] club-text-gold">
                Master Club
              </span>
            </h1>
          </div>
        </div>

        {/* Azioni Bordo Tavolo (>=44px su mobile) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Audio & Jazz */}
          <button
            type="button"
            onClick={() => setIsAudioModalOpen(true)}
            className={`min-h-[42px] min-w-[42px] px-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 ${
              musicState.isPlaying
                ? 'bg-amber-400/18 border-amber-400/55 text-amber-200'
                : 'club-btn-secondary club-text-muted'
            }`}
            aria-label="Audio e Musica Jazz"
            title="Audio e Musica Jazz"
          >
            <Music className={`w-4 h-4 ${musicState.isPlaying ? 'text-amber-300' : ''}`} />
            <span className="hidden md:inline text-xs">
              {musicState.isPlaying ? 'Jazz' : 'Audio'}
            </span>
          </button>

          {/* Selettore Panno */}
          {onOpenThemeSelector && (
            <button
              type="button"
              onClick={onOpenThemeSelector}
              className="min-h-[42px] min-w-[42px] px-2.5 rounded-xl club-btn-secondary club-text-muted hover:text-amber-200 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95"
              aria-label="Cambia colore del panno"
              title="Cambia panno del tavolo"
            >
              <Palette className="w-4 h-4 club-text-gold" />
              <span className="hidden lg:inline text-xs">Panno</span>
            </button>
          )}

          {/* Notifiche & Inviti */}
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className={`relative min-h-[42px] min-w-[42px] px-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
                notificationCount > 0
                  ? 'bg-amber-400/20 border-amber-400/70 text-amber-200'
                  : 'club-btn-secondary club-text-muted'
              }`}
              aria-label={notificationCount > 0 ? `${notificationCount} notifiche non lette` : 'Notifiche e inviti'}
              title={notificationCount > 0 ? `${notificationCount} notifiche non lette` : 'Notifiche e Inviti'}
            >
              <Bell className={`w-4 h-4 ${notificationCount > 0 ? 'text-amber-300' : ''}`} />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full gold-gradient text-[10px] font-extrabold tabular-nums flex items-center justify-center shadow-sm">
                  {notificationCount}
                </span>
              )}
            </button>
          )}

          {/* Menu Opzioni Tavolo */}
          <div className="relative">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={handleToggleMenu}
              aria-expanded={isMenuOpen}
              aria-haspopup="dialog"
              className={`relative min-h-[42px] min-w-[42px] px-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
                updateInfo.hasUpdate || isMenuOpen
                  ? 'bg-amber-400/20 border-amber-400/70 text-amber-200'
                  : 'club-btn-secondary club-text-muted'
              }`}
              aria-label="Opzioni tavolo"
              title="Opzioni e impostazioni tavolo"
            >
              <Settings className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? 'rotate-45 text-amber-300' : ''}`} />
              {updateInfo.hasUpdate && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-black/40" />
              )}
            </button>
          </div>
        </div>
      </div>

      {menuPortal}

      {/* Modale Audio / Musica Jazz */}
      <Suspense fallback={null}>
        {isAudioModalOpen && (
          <AudioSettingsModal
            isOpen={isAudioModalOpen}
            onClose={() => setIsAudioModalOpen(false)}
            soundOn={soundOn}
            volume={soundVolume}
            onToggleSound={() => {
              const nextEnabled = !soundOn;
              sound.setSoundEnabled(nextEnabled);
              setSoundOn(sound.enabled);
            }}
            onChangeVolume={(val) => {
              sound.setVolume(val / 100);
              setSoundVolume(Math.round(sound.volume * 100));
              setSoundOn(sound.enabled);
            }}
          />
        )}
      </Suspense>
    </header>
  );
}

export default memo(Header);
