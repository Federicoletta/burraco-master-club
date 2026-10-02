import React, { useState } from 'react';
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
  MoreVertical 
} from 'lucide-react';
import { sound } from '../utils/soundEffects';
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
        
        {/* Logo e Titolo (flessibile e non ruba mai spazio ai tasti) */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-shrink">
          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-900/40 text-emerald-950 font-black text-sm sm:text-base select-none shrink-0">
            ♠
          </div>
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base md:text-xl font-black tracking-tight text-white m-0 whitespace-nowrap">
                Burraco<span className="text-amber-400 font-serif ml-0.5">Score</span>
              </h1>
            </div>
            <p className="hidden lg:block text-xs text-emerald-300/80 m-0 truncate">
              {hasActiveGame ? 'Partita in corso' : 'Pronto per giocare'} • ♣ ♦ ♥ ♠
            </p>
          </div>
        </div>

        {/* Azioni barra superiore (shrink-0 per non essere mai schiacciate o tagliate) */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
          
          {/* Regolamento (Sempre visibile su tutti i dispositivi) */}
          <button
            type="button"
            onClick={onOpenRules}
            className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
            title="Regolamento del Burraco e Punteggi Carte"
          >
            <BookOpen className="w-4 h-4 text-amber-300 shrink-0 pointer-events-none" />
            <span className="hidden md:inline pointer-events-none">Regole</span>
          </button>

          {/* Partecipanti (Sempre visibile su tutti i dispositivi) */}
          <button
            type="button"
            onClick={onOpenPlayers}
            className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
            title="Partecipanti & Statistiche"
          >
            <Users className="w-4 h-4 text-amber-400 shrink-0 pointer-events-none" />
            <span className="hidden md:inline pointer-events-none">Partecipanti</span>
          </button>

          {/* Suoni & Volume (visibile direttamente su Desktop >= lg, su mobile e tablet è nel menu Altro) */}
          <button
            type="button"
            onClick={() => setIsAudioModalOpen(true)}
            className="hidden lg:flex h-9 sm:h-10 px-3 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
            title="Regola volume ed effetti sonori"
          >
            {soundOn && volume > 0 ? (
              volume > 50 ? (
                <Volume2 className="w-4 h-4 text-amber-400 shrink-0 pointer-events-none" />
              ) : (
                <Volume1 className="w-4 h-4 text-amber-400 shrink-0 pointer-events-none" />
              )
            ) : (
              <VolumeX className="w-4 h-4 text-emerald-400/50 shrink-0 pointer-events-none" />
            )}
            <span className="pointer-events-none">
              {soundOn && volume > 0 ? `Audio (${volume}%)` : 'Muto'}
            </span>
          </button>

          {/* Cloud DB (visibile direttamente su Desktop >= lg) */}
          <button
            type="button"
            onClick={onOpenCloud}
            className="hidden lg:flex h-9 sm:h-10 px-3 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
            title="Database Cloud Firestore & Condivisione Tavolo"
          >
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0 pointer-events-none" />
            <span className="pointer-events-none">Cloud</span>
          </button>

          {/* Condividi (visibile direttamente su Desktop >= lg) */}
          {hasActiveGame && onShareGame && (
            <button
              type="button"
              onClick={onShareGame}
              className="hidden lg:flex h-9 sm:h-10 px-3 rounded-xl bg-emerald-800/70 hover:bg-emerald-700 text-emerald-200 border border-emerald-600/50 transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
              title="Condividi punteggio su WhatsApp"
            >
              <Share2 className="w-4 h-4 text-emerald-300 shrink-0 pointer-events-none" />
              <span className="pointer-events-none">Condividi</span>
            </button>
          )}

          {/* Storico (visibile direttamente su Desktop >= lg) */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="hidden lg:flex h-9 sm:h-10 px-3 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
            title="Archivio partite passate"
          >
            <History className="w-4 h-4 text-amber-400 shrink-0 pointer-events-none" />
            <span className="pointer-events-none">Storico</span>
          </button>

          {/* Menu Altro "⋮" (visibile su Mobile e Tablet < lg) */}
          <div className="relative lg:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-9 sm:h-10 px-2.5 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shrink-0 touch-manipulation select-none"
              title="Altre opzioni (Suoni, Cloud, Storico, Condivisione)"
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
                  
                  {/* Suoni & Volume */}
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
                      Volume & Suoni
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${soundOn && volume > 0 ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/10 text-white/50'}`}>
                      {soundOn && volume > 0 ? `${volume}%` : 'OFF'}
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
