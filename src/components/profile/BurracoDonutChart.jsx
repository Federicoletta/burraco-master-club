import React from 'react';
import { PieChart } from 'lucide-react';

/**
 * BurracoDonutChart - Grafico a ciambella vettoriale (SVG) sincronizzato con i 4 temi del club
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
      <div className="p-4 rounded-2xl club-inset border club-divider flex flex-col items-center justify-center text-center min-h-[170px]">
        <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
          <PieChart className="w-4 h-4 club-text-gold" />
          <span>Tipologia Burrachi</span>
        </span>
        <p className="text-xs club-text-subtle m-0">Nessun burraco registrato finora.</p>
      </div>
    );
  }

  const cleanPct = Math.round((cleanCount / total) * 100);
  const semiPct = Math.round((semiCleanCount / total) * 100);
  const dirtyPct = 100 - cleanPct - semiPct;

  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  const cleanStroke = (cleanCount / total) * circumference;
  const semiStroke = (semiCleanCount / total) * circumference;
  const dirtyStroke = (dirtyCount / total) * circumference;

  const cleanOffset = 0;
  const semiOffset = -cleanStroke;
  const dirtyOffset = -(cleanStroke + semiStroke);

  return (
    <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-2.5">
      <div className="flex items-center justify-between text-xs pb-2 border-b club-divider">
        <span className="font-bold text-white flex items-center gap-1.5">
          <PieChart className="w-4 h-4 club-text-gold" />
          <span>Tipologia Burrachi</span>
        </span>
        <span className="font-mono-num text-xs font-bold club-text-gold">
          {total} totali
        </span>
      </div>

      <div className="flex items-center justify-around gap-3 pt-1">
        <div className="relative w-28 h-28 sm:w-30 sm:h-30 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="var(--grid-stroke)"
              strokeWidth="12"
            />
            {cleanCount > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#f4d27a"
                strokeWidth="12"
                strokeDasharray={`${cleanStroke} ${circumference}`}
                strokeDashoffset={cleanOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
            {semiCleanCount > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#34d399"
                strokeWidth="12"
                strokeDasharray={`${semiStroke} ${circumference}`}
                strokeDashoffset={semiOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
            {dirtyCount > 0 && (
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke="#fb923c"
                strokeWidth="12"
                strokeDasharray={`${dirtyStroke} ${circumference}`}
                strokeDashoffset={dirtyOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="font-mono-num text-lg font-bold text-white leading-none">
              {total}
            </span>
            <span className="text-[10px] uppercase font-bold club-text-gold tracking-wider mt-0.5">
              Burrachi
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 min-w-0 flex-1 justify-center">
          <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-black/20 border club-divider">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f4d27a] shrink-0" />
              <span className="font-semibold text-white truncate">Puliti (+200)</span>
            </div>
            <span className="font-mono-num font-bold text-white shrink-0 ml-1">
              {cleanCount} <small className="club-text-subtle font-normal">({cleanPct}%)</small>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-black/20 border club-divider">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="font-semibold text-white truncate">Semipuliti (+150)</span>
            </div>
            <span className="font-mono-num font-bold text-white shrink-0 ml-1">
              {semiCleanCount} <small className="club-text-subtle font-normal">({semiPct}%)</small>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-black/20 border club-divider">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 shrink-0" />
              <span className="font-semibold text-white truncate">Sporchi (+100)</span>
            </div>
            <span className="font-mono-num font-bold text-white shrink-0 ml-1">
              {dirtyCount} <small className="club-text-subtle font-normal">({dirtyPct}%)</small>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
