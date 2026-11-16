import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

/**
 * TrendScoreChart - Grafico vettoriale responsivo per l'andamento cronologico dei punteggi
 */
export default function TrendScoreChart({ scores = [] }) {
  const [activePoint, setActivePoint] = useState(null);

  const displayScores = scores && scores.length > 0 ? scores.slice(-15) : [];

  if (displayScores.length === 0) {
    return (
      <div className="p-4 rounded-2xl club-inset border club-divider flex flex-col items-center justify-center text-center min-h-[170px]">
        <span className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
          <TrendingUp className="w-4 h-4 club-text-gold" />
          <span>Rendimento Ultime Mani</span>
        </span>
        <p className="text-xs club-text-subtle m-0">
          Gioca la tua prima smazzata per visualizzare la curva dei punti.
        </p>
      </div>
    );
  }

  const min = Math.min(0, ...displayScores);
  const max = Math.max(100, ...displayScores);
  const range = (max - min) || 1;

  const width = 500;
  const height = 150;
  const padLeft = 32;
  const padRight = 32;
  const padTop = 24;
  const padBottom = 26;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const points = displayScores.map((val, idx) => {
    const x = padLeft + (displayScores.length > 1 ? (idx / (displayScores.length - 1)) * plotWidth : plotWidth / 2);
    const y = padTop + (1 - ((val - min) / range)) * plotHeight;
    return { x, y, val, handIndex: idx + 1 };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }

  const bottomY = padTop + plotHeight;
  const areaD = `${pathD} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;

  const hasNegative = min < 0;
  const zeroY = hasNegative ? padTop + (1 - ((0 - min) / range)) * plotHeight : null;

  return (
    <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-2.5">
      <div className="flex items-center justify-between text-xs pb-2 border-b club-divider">
        <span className="font-bold text-white flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 club-text-gold" />
          <span>Rendimento Ultime Mani</span>
        </span>
        <span className="font-mono-num text-[11px] club-text-gold font-semibold">
          {activePoint
            ? `Mano ${activePoint.handIndex}: ${activePoint.val > 0 ? '+' : ''}${activePoint.val} pt`
            : `${displayScores.length} mani`}
        </span>
      </div>

      <div className="w-full rounded-xl bg-black/25 p-1.5 border club-divider overflow-hidden relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-32 sm:h-36 overflow-visible"
        >
          <defs>
            <linearGradient id="scoreTrendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <line x1={padLeft} y1={padTop} x2={width - padRight} y2={padTop} stroke="var(--grid-stroke)" strokeDasharray="3 3" />
          <line x1={padLeft} y1={padTop + plotHeight / 2} x2={width - padRight} y2={padTop + plotHeight / 2} stroke="var(--grid-stroke)" strokeDasharray="3 3" />
          <line x1={padLeft} y1={bottomY} x2={width - padRight} y2={bottomY} stroke="var(--grid-stroke)" strokeDasharray="3 3" />

          {hasNegative && zeroY && (
            <line
              x1={padLeft}
              y1={zeroY}
              x2={width - padRight}
              y2={zeroY}
              stroke="#f43f5e"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              opacity="0.85"
            />
          )}

          <path d={areaD} fill="url(#scoreTrendGradient)" />

          <path
            d={pathD}
            fill="none"
            stroke="var(--accent-gold)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p, idx) => {
            const isHovered = activePoint?.handIndex === p.handIndex;
            return (
              <g
                key={idx}
                className="cursor-pointer"
                onMouseEnter={() => setActivePoint(p)}
                onMouseLeave={() => setActivePoint(null)}
                onClick={() => setActivePoint(p)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={10}
                  fill="transparent"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill={p.val >= 0 ? '#34d399' : '#f43f5e'}
                  stroke="var(--accent-gold)"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
