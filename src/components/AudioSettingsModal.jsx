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
  volume = Math.round(sound.volume * 100),
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
    applyVolumeChange(Number(e.target.value));
  };

  const handleMusicSlider = (e) => {
    bgMusic.setVolume(Number(e.target.value) / 100);
  };

  const handleSelectSfxPreset = (val) => {
    applyVolumeChange(val);
    if (val > 0) sound.playTap();
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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md overflow-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Audio e musica di sottofondo"
    >
      <div
        className="relative w-full max-w-lg club-card-solid rounded-t-3xl sm:rounded-3xl max-h-[92dvh] flex flex-col overflow-hidden club-sheet-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="w-10 h-1 rounded-full club-handle" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b club-divider flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shrink-0">
              <Music className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-bold club-text-primary m-0 truncate">Audio & Musica</h3>
              <p className="text-xs club-text-subtle m-0 truncate">Atmosfera Lounge ed effetti al tavolo</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-xl club-btn-secondary flex items-center justify-center cursor-pointer shrink-0"
            title="Chiudi"
            aria-label="Chiudi impostazioni audio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* MUSICA LOUNGE */}
          <div className="p-4 rounded-2xl club-inset border club-border space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Disc className={`w-4 h-4 club-text-gold ${musicState.isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                <span className="text-xs font-extrabold club-text-gold uppercase tracking-wider">
                  Musica Lounge
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${musicState.isPlaying ? 'bg-emerald-400' : 'bg-white/30'}`} />
                <span className="text-xs font-semibold club-text-muted">
                  {musicState.isPlaying ? 'Attiva' : 'In pausa'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleMusic}
              className={`w-full min-h-[46px] px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
                musicState.isPlaying ? 'gold-gradient' : 'club-btn-secondary'
              }`}
            >
              {musicState.isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Metti in Pausa</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current club-text-gold" />
                  <span>Riproduci Musica Lounge</span>
                </>
              )}
            </button>

            <div className="space-y-2">
              <label className="text-xs font-semibold club-text-muted block">
                Traccia Jazz:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MUSIC_TRACKS.map(track => {
                  const isSelected = musicState.trackId === track.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handleTrackChange(track.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer active:scale-95 ${
                        isSelected
                          ? 'club-card border-[var(--accent-gold)] ring-1 ring-[var(--accent-ring)]'
                          : 'club-row-bg border-[var(--border-subtle)] club-hover-soft'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base shrink-0">{track.icon}</span>
                        <div className="min-w-0 flex-1">
                          <span className={`block text-xs font-bold leading-tight truncate ${isSelected ? 'club-text-gold' : 'club-text-primary'}`}>
                            {track.name}
                          </span>
                          {track.artist && (
                            <span className="block text-[10px] club-text-subtle font-display italic truncate">
                              {track.artist}
                            </span>
                          )}
                        </div>
                        {isSelected && musicState.isPlaying && (
                          <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] club-text-subtle leading-snug line-clamp-2 m-0">
                        {track.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="club-text-muted font-medium">Volume Musica:</span>
                <span className="font-mono-num font-bold club-text-gold">
                  {currentMusicVolumePercent > 0 ? `${currentMusicVolumePercent}%` : 'Muto'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <VolumeX className="w-4 h-4 club-text-subtle shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={currentMusicVolumePercent}
                  onChange={handleMusicSlider}
                  className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[var(--accent-gold)]"
                />
                <Volume2 className="w-4 h-4 club-text-gold shrink-0" />
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {musicPresets.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleSelectMusicPreset(p.value)}
                    className={`min-h-[36px] rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer font-mono-num ${
                      currentMusicVolumePercent === p.value ? 'gold-gradient' : 'club-btn-secondary club-text-muted'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* EFFETTI SONORI */}
          <div className="p-4 rounded-2xl club-inset border club-divider space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 club-text-gold" />
                <span className="text-xs font-extrabold club-text-primary uppercase tracking-wider">
                  Effetti Carte & Rintocchi
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleSfx}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  soundOn && volume > 0 ? 'gold-gradient' : 'club-btn-secondary club-text-muted'
                }`}
              >
                {soundOn && volume > 0 ? 'ON' : 'MUTO'}
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="club-text-muted font-medium">Volume Effetti:</span>
                <span className="font-mono-num font-bold club-text-gold">
                  {soundOn && volume > 0 ? `${volume}%` : 'Muto'}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <VolumeX className="w-4 h-4 club-text-subtle shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={soundOn ? volume : 0}
                  onChange={handleSfxSlider}
                  className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[var(--accent-gold)]"
                />
                <Volume2 className="w-4 h-4 club-text-gold shrink-0" />
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {sfxPresets.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleSelectSfxPreset(p.value)}
                    className={`min-h-[36px] rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer font-mono-num ${
                      soundOn && volume === p.value ? 'gold-gradient' : 'club-btn-secondary club-text-muted'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => sound.playBurracoChime()}
                className="min-h-[42px] px-3 rounded-xl club-btn-secondary club-text-gold text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Bell className="w-4 h-4" />
                <span>Prova Rintocco</span>
              </button>

              <button
                type="button"
                onClick={() => sound.playCardDeal()}
                className="min-h-[42px] px-3 rounded-xl club-btn-secondary text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 club-success-text" />
                <span>Prova Carte</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-3.5 border-t club-divider shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[46px] rounded-xl gold-gradient font-bold text-sm cursor-pointer active:scale-95"
          >
            Fatto
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
