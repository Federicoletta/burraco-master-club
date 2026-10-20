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
    <>
      {/* RIGA 1: CHIUSURA (+100) & STATO POZZETTO (AFFIANCATI) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        
        {/* Toggle Chiusura */}
        <div className="sm:col-span-4 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 flex items-center justify-between">
          <div className="min-w-0 pr-1">
            <span className="text-xs font-bold text-white block truncate">Chiusura</span>
            <span className="text-[10px] text-emerald-400/80">+100 pt</span>
          </div>
          <button
            type="button"
            onClick={onToggleChiusura}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              currentData.chiusura
                ? 'gold-gradient text-emerald-950 shadow-md ring-2 ring-amber-300/50'
                : 'bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 hover:text-white'
            }`}
          >
            <Check className={`w-3.5 h-3.5 stroke-[3] ${currentData.chiusura ? 'opacity-100' : 'opacity-0'}`} />
            <span>{currentData.chiusura ? 'Chiuso (+100)' : 'No'}</span>
          </button>
        </div>

        {/* Segmento Stato Pozzetto */}
        <div className="sm:col-span-8 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40 flex flex-col justify-center">
          <div className="flex items-center justify-between text-[11px] text-emerald-300 font-semibold mb-1">
            <span>Stato Pozzetto:</span>
            <span className="text-[10px] text-emerald-400/80 font-normal">
              {currentData.pozzetto === 'preso_giocato' ? '0 pt' : '-100 pt'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-emerald-900/60 p-0.5 rounded-lg border border-emerald-800/60 text-center">
            <button
              type="button"
              onClick={() => setCurrentData(p => ({ ...p, pozzetto: 'preso_giocato' }))}
              className={`py-1 px-1 rounded-md text-[11px] font-bold transition-all cursor-pointer truncate ${
                currentData.pozzetto === 'preso_giocato'
                  ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                  : 'text-emerald-300 hover:text-white'
              }`}
            >
              Preso & Giocato
            </button>
            <button
              type="button"
              onClick={() => setCurrentData(p => ({ ...p, pozzetto: 'non_preso' }))}
              className={`py-1 px-1 rounded-md text-[11px] font-bold transition-all cursor-pointer truncate ${
                currentData.pozzetto === 'non_preso'
                  ? 'bg-rose-600 text-white shadow-xs font-extrabold'
                  : 'text-rose-300/80 hover:text-rose-200'
              }`}
            >
              Non Preso (-100)
            </button>
            <button
              type="button"
              onClick={() => setCurrentData(p => ({ ...p, pozzetto: 'preso_non_giocato' }))}
              className={`py-1 px-1 rounded-md text-[11px] font-bold transition-all cursor-pointer truncate ${
                currentData.pozzetto === 'preso_non_giocato'
                  ? 'bg-rose-600 text-white shadow-xs font-extrabold'
                  : 'text-rose-300/80 hover:text-rose-200'
              }`}
            >
              Non Giocato (-100)
            </button>
          </div>
        </div>

      </div>

      {/* RIGA 2: BURRACHI REALIZZATI (GRIGLIA ORIZZONTALE A 2/3 COLONNE) */}
      <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/40">
        <div className="flex items-center justify-between text-xs text-amber-300 font-bold mb-2">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Burrachi Realizzati</span>
          </span>
          <span className="text-[11px] text-emerald-400/90 font-mono font-normal">
            Totale Onori: +{currentHonorsBurrachi} pt
          </span>
        </div>

        <div className={`grid ${allowSemipulito ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
          
          {/* Burraco Pulito */}
          <div className="p-2 rounded-lg bg-emerald-900/50 border border-emerald-700/40 flex flex-col items-center justify-between text-center">
            <div>
              <span className="text-xs font-bold text-amber-300 block">💎 Pulito</span>
              <span className="text-[10px] text-emerald-400/80 block">+200 pt cad.</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setCurrentData(p => ({ ...p, burracoPulito: Math.max(0, p.burracoPulito - 1) }));
                }}
                className="w-6 h-6 rounded-md bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer font-bold"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-5 text-center font-black text-sm text-white">{currentData.burracoPulito}</span>
              <button
                type="button"
                onClick={() => {
                  sound.playBurracoChime();
                  setCurrentData(p => ({ ...p, burracoPulito: p.burracoPulito + 1 }));
                }}
                className="w-6 h-6 rounded-md bg-amber-500 hover:bg-amber-400 text-emerald-950 flex items-center justify-center active:scale-95 cursor-pointer font-black"
              >
                <Plus className="w-3 h-3 text-emerald-950 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Burraco Semipulito (se consentito) */}
          {allowSemipulito && (
            <div className="p-2 rounded-lg bg-emerald-900/50 border border-emerald-700/40 flex flex-col items-center justify-between text-center">
              <div>
                <span className="text-xs font-bold text-cyan-300 block">🃏 Semipulito</span>
                <span className="text-[10px] text-emerald-400/80 block">+150 pt cad.</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setCurrentData(p => ({ ...p, burracoSemipulito: Math.max(0, p.burracoSemipulito - 1) }));
                  }}
                  className="w-6 h-6 rounded-md bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer font-bold"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center font-black text-sm text-white">{currentData.burracoSemipulito}</span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playBurracoChime();
                    setCurrentData(p => ({ ...p, burracoSemipulito: p.burracoSemipulito + 1 }));
                  }}
                  className="w-6 h-6 rounded-md bg-cyan-500 hover:bg-cyan-400 text-emerald-950 flex items-center justify-center active:scale-95 cursor-pointer font-black"
                >
                  <Plus className="w-3 h-3 text-emerald-950 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* Burraco Sporco */}
          <div className="p-2 rounded-lg bg-emerald-900/50 border border-emerald-700/40 flex flex-col items-center justify-between text-center">
            <div>
              <span className="text-xs font-bold text-orange-300 block">♠ Sporco</span>
              <span className="text-[10px] text-emerald-400/80 block">+100 pt cad.</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setCurrentData(p => ({ ...p, burracoSporco: Math.max(0, p.burracoSporco - 1) }));
                }}
                className="w-6 h-6 rounded-md bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-700 active:scale-95 cursor-pointer font-bold"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-5 text-center font-black text-sm text-white">{currentData.burracoSporco}</span>
              <button
                type="button"
                onClick={() => {
                  sound.playBurracoChime();
                  setCurrentData(p => ({ ...p, burracoSporco: p.burracoSporco + 1 }));
                }}
                className="w-6 h-6 rounded-md bg-orange-400 hover:bg-orange-300 text-emerald-950 flex items-center justify-center active:scale-95 cursor-pointer font-black"
              >
                <Plus className="w-3 h-3 text-emerald-950 stroke-[3]" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
