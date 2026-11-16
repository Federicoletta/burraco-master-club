import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Palette } from 'lucide-react';
import { THEMES, getStoredTheme, applyTheme } from '../utils/theme';
import { sound } from '../utils/soundEffects';
import { useModalEscape } from '../hooks/useModalEscape';

export default function ThemeSelectorModal({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
}) {
  const [selectedTheme, setSelectedTheme] = useState(() => currentTheme || getStoredTheme());
  useModalEscape(isOpen, onClose);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const activeTheme = currentTheme || selectedTheme;

  const handleSelect = (themeId) => {
    setSelectedTheme(themeId);
    applyTheme(themeId);
    if (onThemeChange) {
      onThemeChange(themeId);
    }
    sound.playTap();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Panno del tavolo"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg club-card-solid rounded-t-3xl sm:rounded-3xl max-h-[90dvh] flex flex-col overflow-hidden z-10 club-sheet-enter">
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="w-10 h-1 rounded-full bg-white/25" />
        </div>

        {/* Header Modale */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b club-divider flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl font-bold text-white m-0 truncate">
                Panno del Tavolo
              </h2>
              <p className="text-xs club-text-subtle m-0 truncate">
                Scegli il feltro e l&apos;atmosfera del club
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
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THEMES.map((theme) => {
            const isActive = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelect(theme.id)}
                className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98] ${
                  isActive
                    ? 'club-card border-[var(--accent-gold)] ring-2 ring-[var(--accent-ring)]'
                    : 'club-inset border-[var(--border-subtle)] hover:border-[var(--border-hairline)]'
                }`}
              >
                <div className={`w-full h-18 rounded-xl bg-gradient-to-br ${theme.previewBg} p-2.5 flex items-center justify-between border border-white/15 shadow-inner mb-3`}>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/45 text-xs font-bold text-white border border-white/15">
                    <span className="text-amber-300 font-display text-sm">{theme.primarySuit}</span>
                    <span>{theme.name.split(' ')[0]}</span>
                  </div>

                  {isActive ? (
                    <div className="w-6 h-6 rounded-full gold-gradient flex items-center justify-center shadow">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/35" />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-sm font-bold text-white">
                      {theme.name}
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
            className="min-h-[42px] px-5 rounded-xl gold-gradient font-bold text-xs active:scale-95 transition-all cursor-pointer"
          >
            Fatto
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
