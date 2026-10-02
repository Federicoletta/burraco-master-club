import React from 'react';
import { X, Volume2, VolumeX, Volume1, Sparkles, Bell, Play } from 'lucide-react';
import { sound } from '../utils/soundEffects';

export default function AudioSettingsModal({
  isOpen,
  onClose,
  soundOn,
  onToggleSound,
  volume, // 0 - 100
  onChangeVolume
}) {
  if (!isOpen) return null;

  const presets = [
    { label: 'Muto', value: 0 },
    { label: 'Basso', value: 35 },
    { label: 'Medio', value: 65 },
    { label: 'Forte', value: 85 },
    { label: 'Massimo', value: 100 },
  ];

  const handleSlider = (e) => {
    const val = Number(e.target.value);
    onChangeVolume(val);
  };

  const handleSelectPreset = (val) => {
    onChangeVolume(val);
    if (val > 0) {
      sound.playTap();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-sm felt-card rounded-2xl border border-amber-500/40 p-4 sm:p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Modale */}
        <div className="flex items-center justify-between pb-2.5 border-b border-emerald-700/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md shrink-0">
              {soundOn && volume > 0 ? (
                volume > 50 ? <Volume2 className="w-4 h-4 text-emerald-950" /> : <Volume1 className="w-4 h-4 text-emerald-950" />
              ) : (
                <VolumeX className="w-4 h-4 text-emerald-950" />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white m-0">Regolazione Volume</h3>
              <p className="text-[11px] text-emerald-300/80 m-0">Effetti sonori e rintocchi di gioco</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controlli Volume */}
        <div className="mt-3.5 space-y-4">
          
          {/* Switch On/Off Principale */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60">
            <span className="text-xs font-semibold text-white">
              Stato Effetti Sonori:
            </span>
            <button
              type="button"
              onClick={onToggleSound}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                soundOn
                  ? 'bg-amber-400 text-emerald-950 shadow-md ring-1 ring-amber-300'
                  : 'bg-emerald-900/80 text-emerald-400 border border-emerald-700/60'
              }`}
            >
              <span>{soundOn ? 'ATTIVO (ON)' : 'DISATTIVATO (MUTO)'}</span>
            </button>
          </div>

          {/* Slider Volume con Percentuale */}
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-300/90 font-medium">Livello Volume:</span>
              <span className="font-mono font-black text-amber-300 text-sm">
                {soundOn ? `${volume}%` : '0% (Muto)'}
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
                onChange={handleSlider}
                className="w-full h-2 bg-emerald-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            </div>

            {/* Pulsanti Presets Rapidi */}
            <div className="grid grid-cols-5 gap-1 pt-1">
              {presets.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleSelectPreset(p.value)}
                  className={`py-1 px-0.5 rounded text-[10px] font-bold text-center transition-all cursor-pointer ${
                    soundOn && volume === p.value
                      ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                      : 'bg-emerald-900/60 text-emerald-300 hover:text-white hover:bg-emerald-800/80 border border-emerald-800/50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sezione Prova Suono */}
          <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60 space-y-1.5">
            <span className="text-[11px] text-emerald-400/90 font-medium block">
              Ascolta l'anteprima:
            </span>
            <div className="grid grid-cols-2 gap-2">
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

          {/* Pulsante Fatto */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-black text-xs shadow-md transition-all cursor-pointer active:scale-98"
          >
            Fatto
          </button>

        </div>

      </div>
    </div>
  );
}
