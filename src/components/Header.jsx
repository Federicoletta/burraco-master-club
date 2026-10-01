import React, { useState } from 'react';
import { 
  PlusCircle, 
  Users, 
  History, 
  Share2, 
  Cloud, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  MoreVertical 
} from 'lucide-react';
import { sound } from '../utils/soundEffects';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleAudio = () => {
    const next = !soundOn;
    sound.setSoundEnabled(next);
    setSoundOn(next);
    if (next) sound.playTap();
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
              <span className="hidden xl:inline-flex text-[11px] px-2 py-0.5 rounded-full bg-emerald-800/80 text-amber-300 font-medium border border-amber-500/30">
                Segnapunti & Statistiche
              </span>
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
            onClick={onOpenRules}
            className="h-8 px-2 sm:px-2.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-600/30 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0"
            title="Regolamento del Burraco e Punteggi Carte"
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
            <span className="hidden md:inline">Regole</span>
          </button>

          {/* Partecipanti (Sempre visibile su tutti i dispositivi) */}
          <button
            onClick={onOpenPlayers}
            className="h-8 px-2 sm:px-2.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-600/30 transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0"
            title="Partecipanti & Statistiche"
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
            <span className="hidden md:inline">Partecipanti</span>
          </button>

          {/* Suoni ON / OFF (visibile direttamente su Desktop >= lg, su mobile e tablet è nel menu Altro) */}
          <button
            onClick={toggleAudio}
            className="hidden lg:flex h-8 px-2.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-600/30 transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0"
            title={soundOn ? 'Effetti sonori attivi (tocca per disattivare)' : 'Effetti sonori disattivati (tocca per attivare)'}
          >
            {soundOn ? (
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <VolumeX className="w-4 h-4 text-emerald-400/50 shrink-0" />
            )}
            <span>{soundOn ? 'Audio' : 'Muto'}</span>
          </button>

          {/* Cloud DB (visibile direttamente su Desktop >= lg) */}
          <button
            onClick={onOpenCloud}
            className="hidden lg:flex h-8 px-2.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-600/30 transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0"
            title="Database Cloud Firestore & Condivisione Tavolo"
          >
            <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cloud</span>
          </button>

          {/* Condividi (visibile direttamente su Desktop >= lg) */}
          {hasActiveGame && onShareGame && (
            <button
              onClick={onShareGame}
              className="hidden lg:flex h-8 px-2.5 rounded-lg bg-emerald-800/60 hover:bg-emerald-700/80 text-emerald-200 border border-emerald-600/40 transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0"
              title="Condividi punteggio su WhatsApp"
            >
              <Share2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Condividi</span>
            </button>
          )}

          {/* Storico (visibile direttamente su Desktop >= lg) */}
          <button
            onClick={onOpenHistory}
            className="hidden lg:flex h-8 px-2.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-600/30 transition-all items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 shrink-0"
            title="Archivio partite passate"
          >
            <History className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Storico</span>
          </button>

          {/* Menu Altro "⋮" (visibile su Mobile e Tablet < lg) */}
          <div className="relative lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="h-8 px-2 rounded-lg bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/40 transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shrink-0"
              title="Altre opzioni (Suoni, Cloud, Storico, Condivisione)"
            >
              <MoreVertical className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline text-xs font-semibold text-emerald-200">Altro</span>
            </button>

            {/* Menu a tendina Mobile / Tablet */}
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-emerald-950 border border-amber-500/30 shadow-2xl p-1.5 z-50 text-white animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* Suoni Switch */}
                  <button
                    onClick={() => {
                      toggleAudio();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-emerald-900/70 text-left text-xs font-semibold text-emerald-100 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      {soundOn ? (
                        <Volume2 className="w-4 h-4 text-amber-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-emerald-400/50" />
                      )}
                      Effetti Sonori
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black ${soundOn ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'bg-white/10 text-white/50'}`}>
                      {soundOn ? 'ON' : 'OFF'}
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
            onClick={onNewGame}
            className="h-8 px-2.5 sm:px-3 py-1.5 rounded-lg gold-gradient hover:brightness-110 text-emerald-950 font-black text-xs sm:text-sm shadow-md shadow-amber-900/30 transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer active:scale-95 shrink-0 whitespace-nowrap"
            title="Inizia una nuova partita"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-950 shrink-0" />
            <span>+ Nuova<span className="hidden sm:inline"> Partita</span></span>
          </button>

        </div>
      </div>
    </header>
  );
}
