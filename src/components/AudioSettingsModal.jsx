import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Volume2, VolumeX, Bell, Play, Pause, Music, Disc } from 'lucide-react';
import { sound } from '../utils/soundEffects';
import { bgMusic, MUSIC_TRACKS } from '../utils/backgroundMusic';
import { useModalEscape } from '../hooks/useModalEscape';

export default function AudioSettingsModal({
  isOpen,
  onClose,
  soundOn = sound.enabled,
  onToggleSound,
  volume = Math.round(sound.volume * 100), // 0 - 100 per effetti sonori
  onChangeVolume
}) {
  const [musicState, setMusicState] = useState({
    isPlaying: bgMusic.isPlaying,
    volume: bgMusic.volume,
    trackId: bgMusic.trackId,
    enabled: bgMusic.enabled
  });

  useModalEscape(isOpen, onClose);

  useEffect(() => {
    return bgMusic.subscribe((state) => {
      setMusicState({ ...state });
    });
  }, []);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const sfxPresets = [
    { label: 'Muto', value: 0 },
    { label: '35%', value: 35 },
    { label: '65%', value: 65 },
    { label: '85%', value: 85 },
    { label: '100%', value: 100 },
  ];

  const musicPresets = [
    { label: 'Muto', value: 0 },
    { label: '25%', value: 25 },
    { label: '50%', value: 50 },
    { label: '75%', value: 75 },
    { label: '100%', value: 100 },
  ];

  const applyVolumeChange = (val) => {
    if (typeof onChangeVolume === 'function') {
      onChangeVolume(val);
    } else {
      sound.setVolume(val / 100);
    }
  };

  const handleToggleSfx = () => {
    if (typeof onToggleSound === 'function') {
      onToggleSound();
    } else {
      sound.setSoundEnabled(!sound.enabled);
    }
  };

  const handleSfxSlider = (e) => {
    const val = Number(e.target.value);
    applyVolumeChange(val);
  };

  const handleMusicSlider = (e) => {
    const val = Number(e.target.value) / 100;
    bgMusic.setVolume(val);
  };

  const handleSelectSfxPreset = (val) => {
    applyVolumeChange(val);
    if (val > 0) {
      sound.playTap();
    }
  };

  const handleSelectMusicPreset = (val) => {
    bgMusic.setVolume(val / 100);
  };

  const handleToggleMusic = () => {
    bgMusic.toggle();
  };

  const handleTrackChange = (trackId) => {
    bgMusic.setTrack(trackId);
    if (!musicState.isPlaying) {
      bgMusic.play();
    }
  };

  const currentMusicVolumePercent = Math.round(musicState.volume * 100);

  // createPortal monta il modale su document.body per evitare problemi di stacking context con backdrop-filter su iPad Safari
  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Audio e musica di sottofondo"
    >
      <div 
        className="relative w-full max-w-lg felt-card rounded-2xl border border-amber-500/40 p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Modale */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md shrink-0">
              <Music className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white m-0 tracking-tight">Audio & Musica di Sottofondo</h3>
              <p className="text-[11px] sm:text-xs text-emerald-300/80 m-0">Regola musica d'atmosfera ed effetti sonori del tavolo</p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenuto Scrollabile */}
        <div className="mt-3.5 space-y-4 overflow-y-auto pr-0.5">
          
          {/* SEZIONE 1: MUSICA DI SOTTOFONDO (JAZZ LOUNGE) */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/80 border border-amber-500/30 space-y-3.5 shadow-inner">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Disc className={`w-4 h-4 text-amber-400 ${musicState.isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                <span className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider">
                  Musica Lounge & Soft Piano
                </span>
              </div>
              
              {/* Stato di riproduzione */}
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${musicState.isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
                <span className="text-[11px] font-semibold text-emerald-200">
                  {musicState.isPlaying ? 'In riproduzione' : 'In pausa'}
                </span>
              </div>
            </div>

            {/* Pulsante Principale Play / Pausa */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleMusic}
                className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98 ${
                  musicState.isPlaying
                    ? 'bg-amber-400 hover:bg-amber-300 text-emerald-950 shadow-amber-500/20'
                    : 'bg-emerald-800/90 hover:bg-emerald-700 text-white border border-emerald-600/60'
                }`}
              >
                {musicState.isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Metti in Pausa la Musica</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-amber-300" />
                    <span>Riproduci Musica Lounge</span>
                  </>
                )}
              </button>
            </div>

            {/* Selettore Tracce Jazz */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-emerald-300/90 block">
                Scegli la Traccia Jazz (Atmosfera da Circolo):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                {MUSIC_TRACKS.map(track => {
                  const isSelected = musicState.trackId === track.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handleTrackChange(track.id)}
                      className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden active:scale-98 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/40'
                          : 'bg-emerald-900/40 hover:bg-emerald-900/80 border-emerald-800/60 text-emerald-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base sm:text-lg shrink-0">{track.icon}</span>
                        <div className="min-w-0 flex-1">
                          <span className={`block text-xs font-bold leading-tight truncate ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                            {track.name}
                          </span>
                          {track.artist && (
                            <span className="block text-[9px] text-amber-200/60 font-serif italic truncate">
                              {track.artist}
                            </span>
                          )}
                        </div>
                        {isSelected && musicState.isPlaying && (
                          <span className="flex h-2 w-2 relative shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-emerald-300/70 leading-snug line-clamp-2 m-0">
                        {track.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slider Volume Musica */}
            <div className="pt-1 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-300/90 font-medium">Volume Musica:</span>
                <span className="font-mono font-black text-amber-300">
                  {currentMusicVolumePercent > 0 ? `${currentMusicVolumePercent}%` : '0% (Muto)'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <VolumeX className="w-4 h-4 text-emerald-400/60 shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={currentMusicVolumePercent}
                  onChange={handleMusicSlider}
                  className="w-full h-2 bg-emerald-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
              </div>

              {/* Presets Volume Musica */}
              <div className="grid grid-cols-5 gap-1">
                {musicPresets.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleSelectMusicPreset(p.value)}
                    className={`py-1 px-0.5 rounded text-[10px] font-bold text-center transition-all cursor-pointer ${
                      currentMusicVolumePercent === p.value
                        ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                        : 'bg-emerald-900/60 text-emerald-300 hover:text-white border border-emerald-800/50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* SEZIONE 2: EFFETTI SONORI DI GIOCO */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/70 border border-emerald-700/40 space-y-3 shadow-inner">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  Effetti Sonori Carte & Rintocchi
                </span>
              </div>

              {/* Toggle ON / OFF Effetti */}
              <button
                type="button"
                onClick={handleToggleSfx}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  soundOn && volume > 0
                    ? 'bg-amber-400 text-emerald-950 shadow-sm'
                    : 'bg-emerald-900 text-emerald-400 border border-emerald-700/60'
                }`}
              >
                {soundOn && volume > 0 ? 'ON' : 'MUTO'}
              </button>
            </div>

            {/* Slider Volume Effetti */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-300/90 font-medium">Volume Effetti Sonori:</span>
                <span className="font-mono font-black text-amber-300">
                  {soundOn && volume > 0 ? `${volume}%` : '0% (Muto)'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <VolumeX className="w-4 h-4 text-emerald-400/60 shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={soundOn ? volume : 0}
                  onChange={handleSfxSlider}
                  className="w-full h-2 bg-emerald-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
              </div>

              {/* Presets Effetti */}
              <div className="grid grid-cols-5 gap-1">
                {sfxPresets.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleSelectSfxPreset(p.value)}
                    className={`py-1 px-0.5 rounded text-[10px] font-bold text-center transition-all cursor-pointer ${
                      soundOn && volume === p.value
                        ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                        : 'bg-emerald-900/60 text-emerald-300 hover:text-white border border-emerald-800/50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pulsanti Prova Effetti */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => sound.playBurracoChime()}
                className="py-1.5 px-2 rounded-lg bg-emerald-900/90 hover:bg-emerald-800 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Rintocco Burraco</span>
              </button>

              <button
                type="button"
                onClick={() => sound.playCardDeal()}
                className="py-1.5 px-2 rounded-lg bg-emerald-900/90 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
              >
                <Play className="w-3.5 h-3.5 text-emerald-300" />
                <span>Fruscio Carte</span>
              </button>
            </div>

          </div>

        </div>

        {/* Footer Modale */}
        <div className="pt-3 border-t border-emerald-700/50 shrink-0 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-98"
          >
            Fatto
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
