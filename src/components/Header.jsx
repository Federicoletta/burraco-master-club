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
  Trophy
} from 'lucide-react';
import { sound } from '../utils/soundEffects';
import { bgMusic } from '../utils/backgroundMusic';
import { wakeLock } from '../utils/wakeLock';
import { checkForUpdates, forceAppUpdate, getFormattedBuildDate } from '../utils/versionCheck';
import AudioSettingsModal from './AudioSettingsModal';

export default function Header({ 
  onNewGame, 
  onOpenPlayers, 
  onOpenHistory, 
  onOpenCloud,
  onOpenRules,
  onOpenTournament,
  onShareGame,
  hasActiveGame,
  hasActiveTournament
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

        {/* Azioni barra superiore */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
          
          {/* Condividi Punteggio (visibile su tablet e desktop >= md) */}
          {hasActiveGame && onShareGame && (
            <button
              type="button"
              onClick={onShareGame}
              className="hidden md:flex h-9 sm:h-10 px-3 rounded-xl bg-emerald-800/70 hover:bg-emerald-700 text-emerald-200 border border-emerald-600/50 transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
              title="Condividi punteggio su WhatsApp"
            >
              <Share2 className="w-4 h-4 text-emerald-300 shrink-0 pointer-events-none" />
              <span className="pointer-events-none">Condividi</span>
            </button>
          )}

          {/* Archivio Partite (visibile su tablet e desktop >= md) */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="hidden md:flex h-9 sm:h-10 px-3 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
            title="Archivio partite passate"
          >
            <History className="w-4 h-4 text-amber-400 shrink-0 pointer-events-none" />
            <span className="pointer-events-none">Archivio</span>
          </button>

          {/* Partecipanti (visibile su tablet e desktop >= md) */}
          <button
            type="button"
            onClick={onOpenPlayers}
            className="hidden md:flex h-9 sm:h-10 px-3 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
            title="Partecipanti & Statistiche"
          >
            <Users className="w-4 h-4 text-amber-400 shrink-0 pointer-events-none" />
            <span className="pointer-events-none">Partecipanti</span>
          </button>

          {/* Torneo (visibile da tablet e desktop) */}
          {onOpenTournament && (
            <button
              type="button"
              onClick={onOpenTournament}
              className={`hidden sm:flex h-9 sm:h-10 px-3 rounded-xl border transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none ${
                hasActiveTournament
                  ? 'bg-amber-500/25 text-amber-200 border-amber-400 ring-2 ring-amber-400/40 shadow-md shadow-amber-950/40 font-black'
                  : 'bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border-emerald-600/40'
              }`}
              title="Modalità Torneo a Gironi"
            >
              <Trophy className="w-4 h-4 text-amber-400 shrink-0 pointer-events-none" />
              <span className="pointer-events-none">Torneo</span>
              {hasActiveTournament && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              )}
            </button>
          )}

          {/* Menu Impostazioni (Ingranaggio) con Regolamento, Musica, Cloud, Schermo e azioni su mobile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`relative h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none border ${
                updateInfo.hasUpdate
                  ? 'bg-amber-500/25 text-amber-200 border-amber-400 ring-2 ring-amber-400/40 shadow-md shadow-amber-950/40'
                  : isMenuOpen
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/50 ring-1 ring-amber-400/30 shadow-md shadow-amber-950/30'
                  : 'bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border-emerald-600/40'
              }`}
              title="Menu & Impostazioni"
            >
              <Settings className={`w-4 h-4 text-amber-300 pointer-events-none transition-transform duration-200 ${isMenuOpen ? 'rotate-45 text-amber-200' : ''}`} />
              <span className="hidden sm:inline pointer-events-none">Menu</span>
              {updateInfo.hasUpdate && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-emerald-950 animate-ping" />
              )}
            </button>

            {/* Menu a tendina Impostazioni & Funzioni */}
            {isMenuOpen && (
              <>
                {/* Overlay trasparente per chiudere cliccando fuori */}
                <div 
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setIsMenuOpen(false)}
                />
                
                <div className="absolute right-0 top-full mt-2 w-68 rounded-2xl bg-emerald-950/95 backdrop-blur-md border border-amber-500/40 shadow-2xl p-2 z-50 text-white animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* Intestazione del menu */}
                  <div className="px-3 py-1.5 border-b border-emerald-800/60 mb-1 flex items-center justify-between text-[11px] font-bold text-amber-400 tracking-wider uppercase">
                    <span className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-amber-400" />
                      Menu & Opzioni
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-mono font-normal">
                      {getFormattedBuildDate()}
                    </span>
                  </div>

                  {/* Pulsante dedicato Aggiornamento / Ricarica PWA iPad */}
                  <button
                    onClick={async () => {
                      setIsCheckingUpdate(true);
                      const res = await checkForUpdates();
                      if (res.hasUpdate) {
                        forceAppUpdate();
                      } else {
                        setTimeout(() => {
                          forceAppUpdate();
                        }, 200);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer mb-1 border ${
                      updateInfo.hasUpdate
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400/30'
                        : 'bg-emerald-900/40 border-emerald-700/40 hover:bg-emerald-900/80 text-emerald-100'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <RotateCw className={`w-4 h-4 shrink-0 ${isCheckingUpdate || updateInfo.hasUpdate ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
                      <div>
                        <div className="text-white font-bold flex items-center gap-1.5">
                          <span>{updateInfo.hasUpdate ? 'Nuovo Aggiornamento!' : 'Ricarica / Aggiorna'}</span>
                          {updateInfo.hasUpdate && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-400 text-emerald-950 font-black text-[9px]">NUOVO</span>
                          )}
                        </div>
                        <div className="text-[10px] text-emerald-300/70 font-normal">
                          {updateInfo.hasUpdate ? `Tocca per installare` : `Scarica ultima versione`}
                        </div>
                      </div>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                      updateInfo.hasUpdate ? 'bg-amber-400 text-emerald-950 font-black shadow-xs' : 'bg-white/10 text-white/50'
                    }`}>
                      {updateInfo.hasUpdate ? 'AGGIORNA' : 'RICARICA'}
                    </span>
                  </button>

                  {/* Voci rapide visibili SOLO su smartphone (perché nascoste dalla barra principale) */}
                  {hasActiveGame && onShareGame && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onShareGame();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer md:hidden"
                    >
                      <Share2 className="w-4 h-4 text-emerald-300 shrink-0" />
                      <div>
                        <div className="text-white font-bold">Condividi Punteggio</div>
                        <div className="text-[10px] text-emerald-300/70 font-normal">Invia riepilogo su WhatsApp</div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenHistory();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer md:hidden"
                  >
                    <History className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-white font-bold">Archivio Partite</div>
                      <div className="text-[10px] text-emerald-300/70 font-normal">Storico partite passate</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenPlayers();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer md:hidden"
                  >
                    <Users className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-white font-bold">Partecipanti</div>
                      <div className="text-[10px] text-emerald-300/70 font-normal">Giocatori e statistiche</div>
                    </div>
                  </button>

                  {/* Torneo (Voce menu sempre accessibile) */}
                  {onOpenTournament && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenTournament();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                    >
                      <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="text-white font-bold flex items-center gap-1.5">
                          <span>Torneo di Burraco</span>
                          {hasActiveTournament && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-400 text-emerald-950 font-black text-[9px]">ATTIVO</span>
                          )}
                        </div>
                        <div className="text-[10px] text-emerald-300/70 font-normal">Classifica, gironi e tavoli</div>
                      </div>
                    </button>
                  )}

                  {/* Separatore su mobile se ci sono le voci sopra */}
                  <div className="border-t border-emerald-800/40 my-1 md:hidden" />

                  {/* Regolamento del Burraco */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenRules();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-amber-300 shrink-0" />
                    <div>
                      <div className="text-white font-bold">Regole del Burraco</div>
                      <div className="text-[10px] text-emerald-300/70 font-normal">Punteggi carte, combinazioni, chiusure</div>
                    </div>
                  </button>

                  {/* Schermo Sempre Acceso (iPad / Mobile) */}
                  <button
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
                      {wakeLockState.enabled ? '☀️ ATTIVO' : 'OFF'}
                    </span>
                  </button>

                  {/* Musica (Unico tasto per musica e volumi) */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsAudioModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Music className={`w-4 h-4 shrink-0 ${musicState.isPlaying ? 'text-amber-400 animate-pulse' : 'text-emerald-400/70'}`} />
                      <div>
                        <div className="text-white font-bold">Musica</div>
                        <div className="text-[10px] text-emerald-300/70 font-normal">Brani d'atmosfera e volume</div>
                      </div>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${musicState.isPlaying ? 'bg-amber-400 text-emerald-950 font-black shadow-xs' : 'bg-white/10 text-white/50'}`}>
                      {musicState.isPlaying ? '▶ ON' : 'OFF'}
                    </span>
                  </button>

                  {/* Cloud Database & Condivisione Tavolo */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenCloud();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer border-t border-emerald-800/60 mt-1 pt-2"
                  >
                    <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-white font-bold">Database Cloud & Tavolo</div>
                      <div className="text-[10px] text-emerald-300/70 font-normal">Sincronizzazione partite online</div>
                    </div>
                  </button>

                </div>
              </>
            )}
          </div>

          {/* Nuova Partita (Pulsante Principale - sempre visibile, shrink-0, mai tagliato) */}
          <button
            type="button"
            onClick={onNewGame}
            className="h-9 sm:h-10 px-3 sm:px-3.5 py-1.5 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-black text-xs sm:text-sm shadow-md shadow-amber-950/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap touch-manipulation select-none"
            title="Inizia una nuova partita"
          >
            <PlusCircle className="w-4 h-4 text-emerald-950 shrink-0 pointer-events-none" />
            <span className="pointer-events-none">+ Nuova<span className="hidden sm:inline"> Partita</span></span>
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
