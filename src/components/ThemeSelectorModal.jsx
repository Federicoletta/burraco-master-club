import React, { useState } from 'react';
import { X, Check, Palette, Sun } from 'lucide-react';
import { THEMES, getStoredTheme, applyTheme } from '../utils/theme';
import { sound } from '../utils/soundEffects';
import ModalShell from './ui/ModalShell';

export default function ThemeSelectorModal({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
}) {
  const [selectedTheme, setSelectedTheme] = useState(() => currentTheme || getStoredTheme());

  if (!isOpen) return null;

  const activeTheme = currentTheme || selectedTheme;

  const handleSelect = (themeId) => {
    setSelectedTheme(themeId);
    applyTheme(themeId);
    if (onThemeChange) {
      onThemeChange(themeId);
    }
    sound.playTap();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Panno del tavolo"
      maxWidthClass="max-w-lg"
      usePortal={true}
      panelClassName="max-h-[90dvh]"
    >
      <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
        <span className="w-10 h-1 rounded-full club-handle" />
      </div>

      {/* Header Modale */}
      <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b club-divider flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg sm:text-xl font-bold club-text-primary m-0 truncate">
              Panno del Tavolo
            </h2>
            <p className="text-xs club-text-subtle m-0 truncate">
              Scegli il feltro scuro o il tema diurno ad alto contrasto
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 rounded-xl club-btn-secondary flex items-center justify-center cursor-pointer shrink-0"
          title="Chiudi"
          aria-label="Chiudi selezione tema"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Griglia Selezione Temi */}
      <div className="p-4 sm:p-6 overflow-y-auto club-modal-scroll grid grid-cols-1 sm:grid-cols-2 gap-3">
        {THEMES.map((theme) => {
          const isActive = activeTheme === theme.id;
          const isLight = Boolean(theme.isLight);
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleSelect(theme.id)}
              aria-pressed={isActive}
              className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98] ${
                isLight ? 'sm:col-span-2' : ''
              } ${
                isActive
                  ? 'club-card border-[var(--accent-gold)] ring-2 ring-[var(--accent-ring)]'
                  : 'club-inset border-[var(--border-subtle)] hover:border-[var(--border-hairline)]'
              }`}
            >
              <div
                className={`w-full h-18 rounded-xl bg-gradient-to-br ${theme.previewBg} p-2.5 flex items-center justify-between border ${
                  isLight ? 'border-emerald-900/25' : 'border-white/15'
                } shadow-inner mb-3`}
              >
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    isLight
                      ? 'bg-[#0d281e] text-[#f5f1e6] border-emerald-950/40'
                      : 'bg-black/45 text-white border-white/15'
                  }`}
                >
                  <span className={isLight ? 'text-amber-300 font-display text-sm' : 'text-amber-300 font-display text-sm'}>
                    {theme.primarySuit}
                  </span>
                  <span>{theme.name.split(' ')[0]}</span>
                  {isLight && <Sun className="w-3.5 h-3.5 text-amber-300" />}
                </div>

                {isActive ? (
                  <div className="w-6 h-6 rounded-full gold-gradient flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div className={`w-5 h-5 rounded-full border ${isLight ? 'border-emerald-900/40' : 'border-white/35'}`} />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-sm font-bold club-text-primary flex items-center gap-1.5">
                    {theme.name}
                    {isLight && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-700 text-white">
                        Giorno
                      </span>
                    )}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-extrabold club-text-gold uppercase tracking-wider">
                      Attivo
                    </span>
                  )}
                </div>
                <p className="text-xs club-text-subtle line-clamp-2 m-0">
                  {theme.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-3.5 border-t club-divider flex items-center justify-between gap-3 shrink-0">
        <span className="text-xs club-text-subtle">
          Salvato per le prossime partite
        </span>
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] px-5 rounded-xl gold-gradient font-bold text-xs active:scale-95 transition-all cursor-pointer"
        >
          Fatto
        </button>
      </div>
    </ModalShell>
  );
}
