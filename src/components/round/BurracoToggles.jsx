import React from 'react';
import { Check, Plus, Minus, Trophy, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
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
      {/* 1. CHIUSURA (+100 PT) */}
      <button
        type="button"
        onClick={onToggleChiusura}
        className={`w-full min-h-[54px] p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left active:scale-[0.99] ${
          currentData.chiusura
            ? 'gold-gradient border-amber-300'
            : 'club-inset hover:border-amber-400/50 club-text-primary'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            currentData.chiusura ? 'bg-black/20' : 'club-card club-text-gold'
          }`}>
            <Trophy className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-bold text-sm">Chiusura Smazzata</span>
              <span className={`font-mono-num text-xs font-bold ${
                currentData.chiusura ? 'opacity-85' : 'club-text-gold'
              }`}>
                +100 pt
              </span>
            </div>
            <p className={`text-xs m-0 ${currentData.chiusura ? 'opacity-80 font-medium' : 'club-text-subtle'}`}>
              {currentData.chiusura ? 'Chiusura assegnata a questa squadra' : 'Tocca se ha chiuso la mano'}
            </p>
          </div>
        </div>

        <div className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ${
          currentData.chiusura
            ? 'bg-black/25 border-black/30'
            : 'border-white/20 text-transparent'
        }`}>
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </div>
      </button>

      {/* 2. STATO DEL POZZETTO */}
      <div className="p-3.5 rounded-2xl club-inset space-y-2.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold club-text-muted uppercase tracking-wider text-[11px]">
            Stato del Pozzetto
          </span>
          <span className="font-semibold">
            {currentData.pozzetto === 'preso_giocato' ? (
              <span className="club-success-text">Preso (0 pt)</span>
            ) : (
              <span className="club-danger-text font-mono-num">-100 pt penalità</span>
            )}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setCurrentData(p => ({ ...p, pozzetto: 'preso_giocato' }));
            }}
            className={`min-h-[52px] py-2 px-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              currentData.pozzetto === 'preso_giocato'
                ? 'bg-emerald-500/20 border-emerald-500/75 club-success-text font-bold'
                : 'border-[var(--border-subtle)] club-text-muted hover:opacity-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-[11px] truncate max-w-full">Preso</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setCurrentData(p => ({ ...p, pozzetto: 'non_preso' }));
            }}
            className={`min-h-[52px] py-2 px-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              currentData.pozzetto === 'non_preso'
                ? 'club-danger-inset club-danger-text font-bold'
                : 'border-[var(--border-subtle)] club-text-muted'
            }`}
          >
            <XCircle className="w-4 h-4 shrink-0" />
            <span className="text-[11px] truncate max-w-full">Non Preso</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setCurrentData(p => ({ ...p, pozzetto: 'preso_non_giocato' }));
            }}
            className={`min-h-[52px] py-2 px-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
              currentData.pozzetto === 'preso_non_giocato'
                ? 'club-danger-inset club-danger-text font-bold'
                : 'border-[var(--border-subtle)] club-text-muted'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-[11px] truncate max-w-full">Non Giocato</span>
          </button>
        </div>
      </div>

      {/* 3. BURRACHI REALIZZATI */}
      <div className="p-3.5 rounded-2xl club-inset space-y-2.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-bold club-text-gold uppercase tracking-wider text-[11px]">
            Burrachi Realizzati
          </span>
          <span className="font-mono-num font-bold club-text-gold">
            +{currentHonorsBurrachi} pt
          </span>
        </div>

        <div className={`grid ${allowSemipulito ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
          {/* Pulito (+200) */}
          <div className="p-2.5 rounded-xl club-card flex flex-col items-center justify-between text-center gap-2">
            <div>
              <span className="text-xs font-bold club-team1 block">Pulito</span>
              <span className="text-[11px] font-mono-num club-text-subtle">+200 pt</span>
            </div>
            <div className="flex items-center justify-between gap-1 w-full">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setCurrentData(p => ({ ...p, burracoPulito: Math.max(0, p.burracoPulito - 1) }));
                }}
                className="w-10 h-10 rounded-xl club-btn-secondary flex items-center justify-center active:scale-90 cursor-pointer shrink-0"
                aria-label="Rimuovi burraco pulito"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-mono-num font-bold text-base club-text-primary">
                {currentData.burracoPulito}
              </span>
              <button
                type="button"
                onClick={() => {
                  sound.playBurracoChime();
                  setCurrentData(p => ({ ...p, burracoPulito: p.burracoPulito + 1 }));
                }}
                className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center active:scale-90 cursor-pointer shrink-0"
                aria-label="Aggiungi burraco pulito"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Semipulito (+150) */}
          {allowSemipulito && (
            <div className="p-2.5 rounded-xl club-card flex flex-col items-center justify-between text-center gap-2">
              <div>
                <span className="text-xs font-bold club-success-text block">Semipulito</span>
                <span className="text-[11px] font-mono-num club-text-subtle">+150 pt</span>
              </div>
              <div className="flex items-center justify-between gap-1 w-full">
                <button
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setCurrentData(p => ({ ...p, burracoSemipulito: Math.max(0, p.burracoSemipulito - 1) }));
                  }}
                  className="w-10 h-10 rounded-xl club-btn-secondary flex items-center justify-center active:scale-90 cursor-pointer shrink-0"
                  aria-label="Rimuovi burraco semipulito"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono-num font-bold text-base club-text-primary">
                  {currentData.burracoSemipulito}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playBurracoChime();
                    setCurrentData(p => ({ ...p, burracoSemipulito: p.burracoSemipulito + 1 }));
                  }}
                  className="w-10 h-10 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 flex items-center justify-center active:scale-90 cursor-pointer shrink-0"
                  aria-label="Aggiungi burraco semipulito"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}

          {/* Sporco (+100) */}
          <div className="p-2.5 rounded-xl club-card flex flex-col items-center justify-between text-center gap-2">
            <div>
              <span className="text-xs font-bold club-text-primary block">Sporco</span>
              <span className="text-[11px] font-mono-num club-text-subtle">+100 pt</span>
            </div>
            <div className="flex items-center justify-between gap-1 w-full">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setCurrentData(p => ({ ...p, burracoSporco: Math.max(0, p.burracoSporco - 1) }));
                }}
                className="w-10 h-10 rounded-xl club-btn-secondary flex items-center justify-center active:scale-90 cursor-pointer shrink-0"
                aria-label="Rimuovi burraco sporco"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-mono-num font-bold text-base club-text-primary">
                {currentData.burracoSporco}
              </span>
              <button
                type="button"
                onClick={() => {
                  sound.playBurracoChime();
                  setCurrentData(p => ({ ...p, burracoSporco: p.burracoSporco + 1 }));
                }}
                className="w-10 h-10 rounded-xl bg-amber-500/85 hover:bg-amber-400 text-slate-950 flex items-center justify-center active:scale-90 cursor-pointer shrink-0"
                aria-label="Aggiungi burraco sporco"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
