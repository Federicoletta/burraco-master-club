import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Users, 
  History, 
  Share2, 
  Cloud, 
  Volume2, 
  Volume1,
  VolumeX, 
  BookOpen, 
  MoreVertical,
  Music,
  Disc,
  Sun
} from 'lucide-react';
import { sound } from '../utils/soundEffects';
import { bgMusic, MUSIC_TRACKS } from '../utils/backgroundMusic';
import { wakeLock } from '../utils/wakeLock';
import AudioSettingsModal from './AudioSettingsModal';

export default function Header({ 
  onNewGame, 
  onOpenPlayers, 
  onOpenHistory, 
  onOpenCloud,
  onOpenRules,
  onShareGame,
  hasActiveGame 
}) {
  const [soundOn, setSoundOn] = useState(sound.enabled);
  const [volume, setVolume] = useState(Math.round(sound.volume * 100));
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
    const unsubMusic = bgMusic.subscribe((state) => {
      setMusicState({ ...state });
    });
    const unsubWakeLock = wakeLock.subscribe((state) => {
      setWakeLockState({ ...state });
    });
    return () => {
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
    <header className="felt-card border-b border-amber-500/20 px-2 sm:px-4 md:px-6 py-2 sm:py-2.5 sticky top-0 z-30 shadow-lg w-full">
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

        {/* Azioni barra superiore (ottimizzate per non affollare la barra su iPad e tablet) */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
          
          {/* Regolamento */}
          <button
            type="button"
            onClick={onOpenRules}
            className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
            title="Regolamento del Burraco e Punteggi Carte"
          >
            <BookOpen className="w-4 h-4 text-amber-300 shrink-0 pointer-events-none" />
            <span className="hidden md:inline pointer-events-none">Regole</span>
          </button>

          {/* Partecipanti */}
          <button
            type="button"
            onClick={onOpenPlayers}
            className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
            title="Partecipanti & Statistiche"
          >
            <Users className="w-4 h-4 text-amber-400 shrink-0 pointer-events-none" />
            <span className="hidden md:inline pointer-events-none">Partecipanti</span>
          </button>

          {/* Suoni & Musica Lounge */}
          <button
            type="button"
            onClick={() => setIsAudioModalOpen(true)}
            className={`h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none border ${
              musicState.isPlaying
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/50 shadow-sm shadow-amber-900/30 ring-1 ring-amber-400/30'
                : 'bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border-emerald-600/40'
            }`}
            title="Regola volume ed effetti sonori e musica di sottofondo"
          >
            {musicState.isPlaying ? (
              <span className="flex items-center gap-1.5 text-amber-300 pointer-events-none">
                <Music className="w-4 h-4 animate-bounce text-amber-300" style={{ animationDuration: '2.5s' }} />
                <span>Musica ON</span>
              </span>
            ) : (
              <>
                {soundOn && volume > 0 ? (
                  volume > 50 ? (
                    <Volume2 className="w-4 h-4 text-amber-400 shrink-0 pointer-events-none" />
                  ) : (
                    <Volume1 className="w-4 h-4 text-amber-400 shrink-0 pointer-events-none" />
                  )
                ) : (
                  <VolumeX className="w-4 h-4 text-emerald-400/50 shrink-0 pointer-events-none" />
                )}
                <span className="hidden sm:inline pointer-events-none">
                  {soundOn && volume > 0 ? `Audio (${volume}%)` : 'Muto'}
                </span>
              </>
            )}
          </button>

          {/* Cloud DB (visibile su desktop ampi >= xl, su tablet/iPad è nel menu Altro) */}
          <button
            type="button"
            onClick={onOpenCloud}
            className="hidden xl:flex h-9 sm:h-10 px-3 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
            title="Database Cloud Firestore & Condivisione Tavolo"
          >
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0 pointer-events-none" />
            <span className="pointer-events-none">Cloud</span>
          </button>

          {/* Condividi (visibile su desktop ampi >= xl) */}
          {hasActiveGame && onShareGame && (
            <button
              type="button"
              onClick={onShareGame}
              className="hidden xl:flex h-9 sm:h-10 px-3 rounded-xl bg-emerald-800/70 hover:bg-emerald-700 text-emerald-200 border border-emerald-600/50 transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
              title="Condividi punteggio su WhatsApp"
            >
              <Share2 className="w-4 h-4 text-emerald-300 shrink-0 pointer-events-none" />
              <span className="pointer-events-none">Condividi</span>
            </button>
          )}

          {/* Storico (visibile su desktop ampi >= xl) */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="hidden xl:flex h-9 sm:h-10 px-3 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
            title="Archivio partite passate"
          >
            <History className="w-4 h-4 text-amber-400 shrink-0 pointer-events-none" />
            <span className="pointer-events-none">Storico</span>
          </button>

          {/* Menu Altro "⋮" (visibile su Mobile e Tablet / iPad < xl) */}
          <div className="relative xl:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-9 sm:h-10 px-2.5 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
              title="Altre opzioni (Cloud, Storico, Condivisione, Schermo)"
            >
              <MoreVertical className="w-4 h-4 text-amber-300 pointer-events-none" />
              <span className="hidden sm:inline text-xs font-semibold text-emerald-200 pointer-events-none">Altro</span>
            </button>

            {/* Menu a tendina Mobile / Tablet */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-emerald-950 border border-amber-500/30 shadow-2xl p-1.5 z-50 text-white animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* Toggle Rapido Musica Lounge */}
                  <button
                    onClick={() => {
                      bgMusic.toggle();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Music className={`w-4 h-4 ${musicState.isPlaying ? 'text-amber-400 animate-pulse' : 'text-emerald-400/70'}`} />
                      Musica Lounge
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${musicState.isPlaying ? 'bg-amber-400 text-emerald-950 font-black shadow-xs' : 'bg-white/10 text-white/50'}`}>
                      {musicState.isPlaying ? '▶ ON' : 'PAUSA'}
                    </span>
                  </button>

                  {/* Volume & Audio Completo */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsAudioModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      {soundOn && volume > 0 ? (
                        <Volume2 className="w-4 h-4 text-amber-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-emerald-400/50" />
                      )}
                      Regola Volumi
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${soundOn && volume > 0 ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/10 text-white/50'}`}>
                      {soundOn && volume > 0 ? `${volume}%` : 'OFF'}
                    </span>
                  </button>

                  {/* Schermo Sempre Acceso (iPad / Mobile) */}
                  <button
                    onClick={() => {
                      wakeLock.toggle();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Sun className={`w-4 h-4 ${wakeLockState.enabled ? 'text-amber-400' : 'text-emerald-400/60'}`} />
                      Schermo Sempre Acceso
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${wakeLockState.enabled ? 'bg-amber-400 text-emerald-950 font-black shadow-xs' : 'bg-white/10 text-white/50'}`}>
                      {wakeLockState.enabled ? '☀️ ATTIVO' : 'OFF'}
                    </span>
                  </button>

                  {/* Storico Partite */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenHistory();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                  >
                    <History className="w-4 h-4 text-amber-400" />
                    <span>Archivio Partite</span>
                  </button>

                  {/* Cloud Database */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenCloud();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                  >
                    <Cloud className="w-4 h-4 text-emerald-400" />
                    <span>Database Cloud & Tavolo</span>
                  </button>

                  {/* Condividi su WhatsApp */}
                  {hasActiveGame && onShareGame && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onShareGame();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer border-t border-emerald-800/50 mt-1 pt-2"
                    >
                      <Share2 className="w-4 h-4 text-emerald-300" />
                      <span>Condividi Punteggio</span>
                    </button>
                  )}

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
