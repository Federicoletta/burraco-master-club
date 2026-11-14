import React from 'react';
import { Check, Sparkles, Plus, Minus } from 'lucide-react';
import { sound } from '../../utils/soundEffects';

export default function BurracoToggles({
  currentData,
  setCurrentData,
  onToggleChiusura,
  allowSemipulito = true,
  currentHonorsBurrachi = 0
}) {
  return (
    <div className="space-y-2.5">
      {/* RIGA 1: CHIUSURA (+100) & STATO POZZETTO (AFFIANCATI) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        
        {/* Toggle Chiusura */}
        <div className="sm:col-span-5 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-between shadow-inner">
          <div className="min-w-0 pr-2">
            <span className="text-xs font-black text-white block truncate">Chiusura Tavolo</span>
            <span className="text-[10px] text-amber-300 font-bold">+100 pt</span>
          </div>
          <button
            type="button"
            onClick={onToggleChiusura}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 touch-manipulation ${
              currentData.chiusura
                ? 'gold-gradient text-emerald-950 shadow-md ring-2 ring-amber-300/60'
                : 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 hover:text-white'
            }`}
          >
            <Check className={`w-4 h-4 stroke-[3] ${currentData.chiusura ? 'opacity-100' : 'opacity-30'}`} />
            <span>{currentData.chiusura ? 'Chiuso (+100)' : 'Non ha chiuso'}</span>
          </button>
        </div>

        {/* Segmento Stato Pozzetto */}
        <div className="sm:col-span-7 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-600/50 flex flex-col justify-center shadow-inner">
          <div className="flex items-center justify-between text-[11px] text-emerald-300 font-bold mb-1.5">
            <span>Stato Pozzetto:</span>
            <span className="text-[10px] font-mono">
              {currentData.pozzetto === 'preso_giocato' ? (
                <strong className="text-emerald-400">0 pt (Preso & Giocato)</strong>
              ) : (
                <strong className="text-rose-400 font-bold">-100 pt</strong>
              )}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-emerald-900/80 p-1 rounded-xl border border-emerald-700/60 text-center">
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setCurrentData(p => ({ ...p, pozzetto: 'preso_giocato' }));
              }}
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate touch-manipulation ${
                currentData.pozzetto === 'preso_giocato'
                  ? 'bg-emerald-600 text-white shadow-md font-black'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              Preso & Giocato
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setCurrentData(p => ({ ...p, pozzetto: 'non_preso' }));
              }}
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate touch-manipulation ${
                currentData.pozzetto === 'non_preso'
                  ? 'bg-rose-600 text-white shadow-md font-black'
                  : 'text-rose-300/80 hover:text-rose-200'
              }`}
            >
              Non Preso (-100)
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setCurrentData(p => ({ ...p, pozzetto: 'preso_non_giocato' }));
              }}
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer truncate touch-manipulation ${
                currentData.pozzetto === 'preso_non_giocato'
                  ? 'bg-rose-600 text-white shadow-md font-black'
                  : 'text-rose-300/80 hover:text-rose-200'
              }`}
            >
              Non Giocato (-100)
            </button>
          </div>
        </div>

      </div>

      {/* RIGA 2: BURRACHI REALIZZATI (PULSANTONI GRANDI ERGONOMICI) */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-600/50 shadow-inner">
        <div className="flex items-center justify-between text-xs text-amber-300 font-bold mb-2.5">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Burrachi Realizzati</span>
          </span>
          <span className="text-[11px] text-amber-300 font-mono font-bold bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/40">
            Totale Onori: +{currentHonorsBurrachi} pt
          </span>
        </div>

        <div className={`grid ${allowSemipulito ? 'grid-cols-3' : 'grid-cols-2'} gap-2 sm:gap-3`}>
          
          {/* Burraco Pulito */}
          <div className="p-2.5 rounded-xl bg-emerald-900/60 border border-amber-400/40 flex flex-col items-center justify-between text-center shadow-sm">
            <div>
              <span className="text-xs sm:text-sm font-black text-amber-300 block">💎 Pulito</span>
              <span className="text-[10px] text-amber-200/80 block">+200 pt cad.</span>
            </div>
            <div className="flex items-center gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setCurrentData(p => ({ ...p, burracoPulito: Math.max(0, p.burracoPulito - 1) }));
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-950 hover:bg-emerald-800 text-white flex items-center justify-center active:scale-90 cursor-pointer font-bold border border-emerald-700/60 touch-manipulation"
                title="Rimuovi 1 burraco pulito"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center font-black text-base sm:text-lg text-white">
                {currentData.burracoPulito}
              </span>
              <button
                type="button"
                onClick={() => {
                  sound.playBurracoChime();
                  setCurrentData(p => ({ ...p, burracoPulito: p.burracoPulito + 1 }));
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl gold-gradient text-emerald-950 flex items-center justify-center active:scale-90 cursor-pointer font-black shadow-md touch-manipulation"
                title="Aggiungi 1 burraco pulito (+200)"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Burraco Semipulito (se consentito) */}
          {allowSemipulito && (
            <div className="p-2.5 rounded-xl bg-emerald-900/60 border border-emerald-400/40 flex flex-col items-center justify-between text-center shadow-sm">
              <div>
                <span className="text-xs sm:text-sm font-black text-emerald-300 block">🃏 Semipulito</span>
                <span className="text-[10px] text-emerald-200/80 block">+150 pt cad.</span>
              </div>
              <div className="flex items-center gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setCurrentData(p => ({ ...p, burracoSemipulito: Math.max(0, p.burracoSemipulito - 1) }));
                  }}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-950 hover:bg-emerald-800 text-white flex items-center justify-center active:scale-90 cursor-pointer font-bold border border-emerald-700/60 touch-manipulation"
                  title="Rimuovi 1 burraco semipulito"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-black text-base sm:text-lg text-white">
                  {currentData.burracoSemipulito}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playBurracoChime();
                    setCurrentData(p => ({ ...p, burracoSemipulito: p.burracoSemipulito + 1 }));
                  }}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 flex items-center justify-center active:scale-90 cursor-pointer font-black shadow-md touch-manipulation"
                  title="Aggiungi 1 burraco semipulito (+150)"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* Burraco Sporco */}
          <div className="p-2.5 rounded-xl bg-emerald-900/60 border border-orange-400/40 flex flex-col items-center justify-between text-center shadow-sm">
            <div>
              <span className="text-xs sm:text-sm font-black text-orange-300 block">♠ Sporco</span>
              <span className="text-[10px] text-orange-200/80 block">+100 pt cad.</span>
            </div>
            <div className="flex items-center gap-2.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setCurrentData(p => ({ ...p, burracoSporco: Math.max(0, p.burracoSporco - 1) }));
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-950 hover:bg-emerald-800 text-white flex items-center justify-center active:scale-90 cursor-pointer font-bold border border-emerald-700/60 touch-manipulation"
                title="Rimuovi 1 burraco sporco"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center font-black text-base sm:text-lg text-white">
                {currentData.burracoSporco}
              </span>
              <button
                type="button"
                onClick={() => {
                  sound.playBurracoChime();
                  setCurrentData(p => ({ ...p, burracoSporco: p.burracoSporco + 1 }));
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-orange-400 hover:bg-orange-300 text-emerald-950 flex items-center justify-center active:scale-90 cursor-pointer font-black shadow-md touch-manipulation"
                title="Aggiungi 1 burraco sporco (+100)"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
