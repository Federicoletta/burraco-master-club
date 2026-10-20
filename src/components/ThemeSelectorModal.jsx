import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Sparkles, Palette } from 'lucide-react';
import { THEMES, getStoredTheme, applyTheme } from '../utils/theme';
import { sound } from '../utils/soundEffects';

export default function ThemeSelectorModal({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
}) {
  const [selectedTheme, setSelectedTheme] = useState(() => currentTheme || getStoredTheme());

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const handleSelect = (themeId) => {
    setSelectedTheme(themeId);
    applyTheme(themeId);
    if (onThemeChange) {
      onThemeChange(themeId);
    }
    sound.playTap();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg felt-card rounded-3xl border border-amber-500/40 p-5 sm:p-6 my-4 shadow-2xl z-10 space-y-5">
        
        {/* Header Modale */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-sm">
              <Palette className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Panno del Tavolo
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-emerald-300/80 font-normal">
                Scegli il feltro e l'atmosfera per le tue partite
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Griglia Selezione Temi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THEMES.map((theme) => {
            const isActive = selectedTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelect(theme.id)}
                className={`relative p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between overflow-hidden group active:scale-[0.98] ${
                  isActive
                    ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-black/40 bg-white/10'
                    : 'border-white/10 hover:border-white/25 bg-black/30 hover:bg-black/40'
                }`}
              >
                {/* Anteprima Panno con Sfumatura e Texture */}
                <div className={`w-full h-18 rounded-xl bg-gradient-to-br ${theme.previewBg} p-2 flex items-center justify-between border border-white/10 shadow-inner mb-3`}>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-xs text-[11px] font-bold text-white border border-white/10">
                    <span className="text-amber-400 font-serif text-sm">{theme.primarySuit}</span>
                    <span>{theme.name.split(' ')[0]}</span>
                  </div>

                  {isActive ? (
                    <div className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center shadow-md animate-in zoom-in-75 duration-200">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/30 group-hover:border-white/60 transition-colors" />
                  )}
                </div>

                {/* Info Tema */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-bold text-white group-hover:text-amber-200 transition-colors">
                      {theme.name}
                    </span>
                    {isActive && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">
                        Attivo
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/60 line-clamp-2">
                    {theme.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-white/50">
            Il tema viene salvato automaticamente per le prossime partite.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl gold-gradient text-emerald-950 font-bold text-xs shadow-md shadow-amber-900/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            Fatto
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
