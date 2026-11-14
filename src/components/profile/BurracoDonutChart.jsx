import React from 'react';
import { PieChart } from 'lucide-react';

/**
 * BurracoDonutChart - Grafico a ciambella vettoriale (SVG) per la distribuzione dei Burrachi realizzati
 * Suddivide in: Puliti (Oro), Semipuliti (Smeraldo), Sporchi (Rame/Arancio)
 */
export default function BurracoDonutChart({
  cleanCount = 0,
  semiCleanCount = 0,
  dirtyCount = 0,
  totalCount = 0
}) {
  const total = totalCount || (cleanCount + semiCleanCount + dirtyCount);

  if (total === 0) {
    return (
      <div className="p-3 sm:p-4 rounded-2xl bg-emerald-950/70 border border-emerald-700/50 shadow-inner flex flex-col items-center justify-center text-center">
        <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
          <PieChart className="w-3.5 h-3.5 text-amber-400" />
          <span>Distribuzione Burrachi</span>
        </span>
        <p className="text-xs text-emerald-300/60">Nessun burraco registrato finora.</p>
      </div>
    );
  }

  const cleanPct = Math.round((cleanCount / total) * 100);
  const semiPct = Math.round((semiCleanCount / total) * 100);
  const dirtyPct = 100 - cleanPct - semiPct;

  // Calcolo delle lunghezze d'arco della circonferenza (r = 40, C = 2 * PI * 40 = 251.32)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  const cleanStroke = (cleanCount / total) * circumference;
  const semiStroke = (semiCleanCount / total) * circumference;
  const dirtyStroke = (dirtyCount / total) * circumference;

  const cleanOffset = 0;
  const semiOffset = -cleanStroke;
  const dirtyOffset = -(cleanStroke + semiStroke);

  return (
    <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-700/50 shadow-inner space-y-2.5">
      <div className="flex items-center justify-between text-xs pb-1 border-b border-emerald-800/50">
        <span className="font-bold text-white flex items-center gap-1.5">
          <PieChart className="w-3.5 h-3.5 text-amber-400" />
          <span>Tipologia Burrachi Realizzati</span>
        </span>
        <span className="text-[11px] font-black text-amber-300">
          {total} totali
        </span>
      </div>

      <div className="flex items-center justify-around gap-3 pt-1">
        {/* SVG Donut */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#064e3b"
              strokeWidth="12"
              opacity="0.5"
            />
            {/* Puliti (Gold) */}
            {cleanCount > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#fbbf24"
                strokeWidth="12"
                strokeDasharray={`${cleanStroke} ${circumference}`}
                strokeDashoffset={cleanOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
            {/* Semipuliti (Emerald) */}
            {semiCleanCount > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray={`${semiStroke} ${circumference}`}
                strokeDashoffset={semiOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
            {/* Sporchi (Copper / Orange) */}
            {dirtyCount > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#f97316"
                strokeWidth="12"
                strokeDasharray={`${dirtyStroke} ${circumference}`}
                strokeDashoffset={dirtyOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
          </svg>

          {/* Testo centrale ciambella */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-base sm:text-lg font-black text-white leading-none">
              {total}
            </span>
            <span className="text-[9px] uppercase font-bold text-amber-300/80 tracking-wider mt-0.5">
              Burrachi
            </span>
          </div>
        </div>

        {/* Legenda Dettagliata */}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1 justify-center">
          {/* Pulito */}
          <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-emerald-900/40 border border-amber-400/30">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
              <span className="font-bold text-amber-200 truncate text-[11px]">Puliti (+200)</span>
            </div>
            <span className="font-black text-white text-[11px] shrink-0 ml-1">
              {cleanCount} <small className="text-amber-300/70 font-normal">({cleanPct}%)</small>
            </span>
          </div>

          {/* Semipulito */}
          <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-emerald-900/40 border border-emerald-500/30">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="font-bold text-emerald-200 truncate text-[11px]">Semipuliti (+150)</span>
            </div>
            <span className="font-black text-white text-[11px] shrink-0 ml-1">
              {semiCleanCount} <small className="text-emerald-300/70 font-normal">({semiPct}%)</small>
            </span>
          </div>

          {/* Sporco */}
          <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-emerald-900/40 border border-orange-500/30">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
              <span className="font-bold text-orange-200 truncate text-[11px]">Sporchi (+100)</span>
            </div>
            <span className="font-black text-white text-[11px] shrink-0 ml-1">
              {dirtyCount} <small className="text-orange-300/70 font-normal">({dirtyPct}%)</small>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
