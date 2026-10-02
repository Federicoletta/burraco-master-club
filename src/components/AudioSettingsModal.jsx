import React from 'react';
import { X, Volume2, VolumeX, Volume1, Bell, Play } from 'lucide-react';
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
    { label: '35%', value: 35 },
    { label: '65%', value: 65 },
    { label: '85%', value: 85 },
    { label: '100%', value: 100 },
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-16 sm:pt-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-sm felt-card rounded-2xl border border-amber-500/40 p-3.5 sm:p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Modale con Switch On/Off integrato (Compatto per non finire sotto la barra di Safari) */}
        <div className="flex items-center justify-between pb-2 border-b border-emerald-700/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl gold-gradient flex items-center justify-center text-emerald-950 font-black shadow-md shrink-0">
              {soundOn && volume > 0 ? (
                volume > 50 ? <Volume2 className="w-3.5 h-3.5 text-emerald-950" /> : <Volume1 className="w-3.5 h-3.5 text-emerald-950" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-emerald-950" />
              )}
            </div>
            <h3 className="text-sm font-bold text-white m-0">Volume Effetti Sonori</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSound}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                soundOn && volume > 0
                  ? 'bg-amber-400 text-emerald-950 shadow-sm'
                  : 'bg-emerald-900 text-emerald-400 border border-emerald-700/60'
              }`}
            >
              {soundOn && volume > 0 ? 'ON' : 'MUTO'}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Controlli Volume Compatti */}
        <div className="mt-2.5 space-y-2.5">
          
          {/* Slider Volume con Percentuale */}
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-300/90 font-medium text-[11px]">Livello:</span>
              <span className="font-mono font-black text-amber-300 text-xs sm:text-sm">
                {soundOn && volume > 0 ? `${volume}%` : 'Muto'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <VolumeX className="w-3.5 h-3.5 text-emerald-400/60 shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={soundOn ? volume : 0}
                onChange={handleSlider}
                className="w-full h-2 bg-emerald-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <Volume2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </div>

            {/* Pulsanti Presets Rapidi */}
            <div className="grid grid-cols-5 gap-1 pt-0.5">
              {presets.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleSelectPreset(p.value)}
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

          {/* Sezione Prova Suono */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => sound.playBurracoChime()}
              className="py-1.5 px-2 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
            >
              <Bell className="w-3 h-3 text-amber-400" />
              <span>Prova Burraco</span>
            </button>

            <button
              type="button"
              onClick={() => sound.playCardDeal()}
              className="py-1.5 px-2 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
            >
              <Play className="w-3 h-3 text-emerald-300" />
              <span>Prova Carte</span>
            </button>
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
