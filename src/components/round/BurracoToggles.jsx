import React from 'react';
import { Check, Sparkles, Plus, Minus, Trophy, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { sound } from '../../utils/soundEffects';

export default function BurracoToggles({
  currentData,
  setCurrentData,
  onToggleChiusura,
  allowSemipulito = true,
  currentHonorsBurrachi = 0
}) {
  return (
    <div className="space-y-3">
      
      {/* 1. TOGGLE CHIUSURA MANO (+100 PT) */}
      <div 
        onClick={onToggleChiusura}
        className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2 shadow-md active:scale-[0.99] touch-manipulation ${
          currentData.chiusura
            ? 'gold-gradient text-emerald-950 border-amber-300 shadow-amber-400/20 ring-2 ring-amber-300/60'
            : 'bg-emerald-950/80 hover:bg-emerald-900/60 border-emerald-600/40 text-white'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shadow-sm shrink-0 ${
            currentData.chiusura ? 'bg-emerald-950 text-amber-300' : 'bg-emerald-900 text-emerald-300 border border-emerald-700/60'
          }`}>
            <Trophy className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-1.5 font-black text-xs sm:text-sm">
              <span>Chiusura della Smazzata</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 whitespace-nowrap ${
                currentData.chiusura ? 'bg-emerald-950/20 text-emerald-950' : 'bg-amber-400/20 text-amber-300'
              }`}>
                +100 pt
              </span>
            </div>
            <p className={`text-[11px] m-0 ${currentData.chiusura ? 'text-emerald-950/80 font-medium' : 'text-emerald-300/70'}`}>
              {currentData.chiusura ? 'Questa squadra ha chiuso la mano' : 'Tocca se questa squadra ha effettuato la chiusura'}
            </p>
          </div>
        </div>

        <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all shrink-0 ${
          currentData.chiusura 
            ? 'bg-emerald-950 border-emerald-950 text-amber-300' 
            : 'border-emerald-600 bg-emerald-900/60 text-transparent'
        }`}>
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      </div>

      {/* 2. STATO DEL POZZETTO (REGOLA FIBUR) */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-600/40 shadow-inner space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <span className="font-bold text-emerald-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <span>Stato del Pozzetto</span>
          </span>
          <span className="text-[11px] font-black shrink-0">
            {currentData.pozzetto === 'preso_giocato' ? (
              <span className="text-emerald-400">Preso regolarmente (0 pt)</span>
            ) : (
              <span className="text-rose-400 font-bold">-100 pt di penalità</span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-emerald-900/60 border border-emerald-700/50">
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setCurrentData(p => ({ ...p, pozzetto: 'preso_giocato' }));
            }}
            className={`min-w-0 overflow-hidden py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 touch-manipulation ${
              currentData.pozzetto === 'preso_giocato'
                ? 'bg-emerald-600 text-white shadow-md font-black'
                : 'text-emerald-300/80 hover:text-white hover:bg-emerald-800/40'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="w-full truncate text-center text-[10px] sm:text-[11px]">Preso (0 pt)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setCurrentData(p => ({ ...p, pozzetto: 'non_preso' }));
            }}
            className={`min-w-0 overflow-hidden py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 touch-manipulation ${
              currentData.pozzetto === 'non_preso'
                ? 'bg-rose-600 text-white shadow-md font-black'
                : 'text-rose-300/70 hover:text-rose-200 hover:bg-rose-950/40'
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-300 shrink-0" />
            <span className="w-full truncate text-center text-[10px] sm:text-[11px]">Non Preso (-100)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setCurrentData(p => ({ ...p, pozzetto: 'preso_non_giocato' }));
            }}
            className={`min-w-0 overflow-hidden py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 touch-manipulation ${
              currentData.pozzetto === 'preso_non_giocato'
                ? 'bg-rose-600 text-white shadow-md font-black'
                : 'text-rose-300/70 hover:text-rose-200 hover:bg-rose-950/40'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="w-full truncate text-center text-[10px] sm:text-[11px]">Non Giocato (-100)</span>
          </button>
        </div>
      </div>

      {/* 3. BURRACHI REALIZZATI (BOX TATTILI CON STEPPER GIGANTI) */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-600/40 shadow-inner space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Burrachi Realizzati</span>
          </span>
          <span className="text-[11px] text-amber-300 font-mono font-black bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/40 shrink-0 whitespace-nowrap">
            +{currentHonorsBurrachi} pt onori
          </span>
        </div>

        <div className={`grid ${allowSemipulito ? 'grid-cols-3' : 'grid-cols-2'} gap-2 sm:gap-2.5`}>
          
          {/* Burraco Pulito (200 pt) */}
          <div className="min-w-0 overflow-hidden p-2 sm:p-3 rounded-2xl bg-gradient-to-b from-emerald-900/80 to-emerald-950 border border-amber-400/50 flex flex-col items-center justify-between text-center shadow-md">
            <div className="w-full min-w-0">
              <span className="text-[11px] sm:text-xs font-black text-amber-300 flex items-center justify-center gap-1 whitespace-nowrap truncate">
                <span aria-hidden="true">💎</span>
                <span>Pulito</span>
              </span>
              <span className="text-[10px] text-amber-200/80 font-bold block mt-0.5">+200 pt</span>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2 mt-2.5 w-full justify-center">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setCurrentData(p => ({ ...p, burracoPulito: Math.max(0, p.burracoPulito - 1) }));
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white flex items-center justify-center active:scale-90 cursor-pointer font-bold border border-emerald-700/60 shadow-sm touch-manipulation"
                title="Rimuovi 1 burraco pulito"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <span className="min-w-[20px] sm:min-w-[24px] text-center font-black text-base sm:text-lg text-white">
                {currentData.burracoPulito}
              </span>
              
              <button
                type="button"
                onClick={() => {
                  sound.playBurracoChime();
                  setCurrentData(p => ({ ...p, burracoPulito: p.burracoPulito + 1 }));
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl gold-gradient text-emerald-950 flex items-center justify-center active:scale-90 cursor-pointer font-black shadow-md touch-manipulation"
                title="Aggiungi 1 burraco pulito (+200)"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Burraco Semipulito (150 pt) */}
          {allowSemipulito && (
            <div className="min-w-0 overflow-hidden p-2 sm:p-3 rounded-2xl bg-gradient-to-b from-emerald-900/80 to-emerald-950 border border-emerald-400/50 flex flex-col items-center justify-between text-center shadow-md">
              <div className="w-full min-w-0">
                <span className="text-[11px] sm:text-xs font-black text-emerald-300 flex items-center justify-center gap-1 whitespace-nowrap truncate">
                  <span aria-hidden="true">🃏</span>
                  <span>Semipulito</span>
                </span>
                <span className="text-[10px] text-emerald-200/80 font-bold block mt-0.5">+150 pt</span>
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2 mt-2.5 w-full justify-center">
                <button
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setCurrentData(p => ({ ...p, burracoSemipulito: Math.max(0, p.burracoSemipulito - 1) }));
                  }}
                  className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white flex items-center justify-center active:scale-90 cursor-pointer font-bold border border-emerald-700/60 shadow-sm touch-manipulation"
                  title="Rimuovi 1 burraco semipulito"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <span className="min-w-[20px] sm:min-w-[24px] text-center font-black text-base sm:text-lg text-white">
                  {currentData.burracoSemipulito}
                </span>
                
                <button
                  type="button"
                  onClick={() => {
                    sound.playBurracoChime();
                    setCurrentData(p => ({ ...p, burracoSemipulito: p.burracoSemipulito + 1 }));
                  }}
                  className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-emerald-950 flex items-center justify-center active:scale-90 cursor-pointer font-black shadow-md touch-manipulation"
                  title="Aggiungi 1 burraco semipulito (+150)"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* Burraco Sporco (100 pt) */}
          <div className="min-w-0 overflow-hidden p-2 sm:p-3 rounded-2xl bg-gradient-to-b from-emerald-900/80 to-emerald-950 border border-amber-600/50 flex flex-col items-center justify-between text-center shadow-md">
            <div className="w-full min-w-0">
              <span className="text-[11px] sm:text-xs font-black text-amber-200 flex items-center justify-center gap-1 whitespace-nowrap truncate">
                <span aria-hidden="true">♠</span>
                <span>Sporco</span>
              </span>
              <span className="text-[10px] text-amber-300/80 font-bold block mt-0.5">+100 pt</span>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2 mt-2.5 w-full justify-center">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setCurrentData(p => ({ ...p, burracoSporco: Math.max(0, p.burracoSporco - 1) }));
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-white flex items-center justify-center active:scale-90 cursor-pointer font-bold border border-emerald-700/60 shadow-sm touch-manipulation"
                title="Rimuovi 1 burraco sporco"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <span className="min-w-[20px] sm:min-w-[24px] text-center font-black text-base sm:text-lg text-white">
                {currentData.burracoSporco}
              </span>
              
              <button
                type="button"
                onClick={() => {
                  sound.playBurracoChime();
                  setCurrentData(p => ({ ...p, burracoSporco: p.burracoSporco + 1 }));
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-gradient-to-br from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-emerald-950 flex items-center justify-center active:scale-90 cursor-pointer font-black shadow-md touch-manipulation"
                title="Aggiungi 1 burraco sporco (+100)"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
