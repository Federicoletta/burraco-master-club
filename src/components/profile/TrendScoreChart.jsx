import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

/**
 * TrendScoreChart - Grafico vettoriale responsivo per l'andamento cronologico dei punteggi
 * Disegna una curva cubica Bezier morbida con area sfumata e punti interattivi.
 */
export default function TrendScoreChart({ scores = [] }) {
  const [activePoint, setActivePoint] = useState(null);

  // Consideriamo le ultime 15 mani/partite per massima leggibilità
  const displayScores = scores && scores.length > 0 ? scores.slice(-15) : [];

  if (displayScores.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-center text-xs text-emerald-300/60">
        Gioca la tua prima smazzata per visualizzare la curva di andamento dei punti.
      </div>
    );
  }

  const min = Math.min(0, ...displayScores);
  const max = Math.max(100, ...displayScores);
  const range = (max - min) || 1;

  const width = 500;
  const height = 150;
  const padLeft = 35;
  const padRight = 35;
  const padTop = 25;
  const padBottom = 30;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const points = displayScores.map((val, idx) => {
    const x = padLeft + (displayScores.length > 1 ? (idx / (displayScores.length - 1)) * plotWidth : plotWidth / 2);
    const y = padTop + (1 - ((val - min) / range)) * plotHeight;
    return { x, y, val, handIndex: idx + 1 };
  });

  // Costruzione curva Bezier
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

  // Linea dello zero (in caso di punteggi negativi)
  const hasNegative = min < 0;
  const zeroY = hasNegative ? padTop + (1 - ((0 - min) / range)) * plotHeight : null;

  return (
    <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-700/50 shadow-inner space-y-2">
      <div className="flex items-center justify-between text-xs pb-1 border-b border-emerald-800/50">
        <span className="font-bold text-white flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          <span>Rendimento Ultime Mani</span>
        </span>
        <span className="text-[11px] text-emerald-400/80">
          {activePoint 
            ? `Mano ${activePoint.handIndex}: ${activePoint.val > 0 ? '+' : ''}${activePoint.val} pt` 
            : `${displayScores.length} mani mostrate`}
        </span>
      </div>

      <div className="w-full bg-emerald-950/90 rounded-xl p-1.5 border border-emerald-800/60 overflow-hidden relative">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-32 sm:h-36 overflow-visible"
        >
          <defs>
            <linearGradient id="scoreTrendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glowPoint" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Griglia orizzontale discreta */}
          <line x1={padLeft} y1={padTop} x2={width - padRight} y2={padTop} stroke="#064e3b" strokeDasharray="3 3" opacity="0.6" />
          <line x1={padLeft} y1={padTop + plotHeight / 2} x2={width - padRight} y2={padTop + plotHeight / 2} stroke="#064e3b" strokeDasharray="3 3" opacity="0.6" />
          <line x1={padLeft} y1={bottomY} x2={width - padRight} y2={bottomY} stroke="#064e3b" strokeDasharray="3 3" opacity="0.6" />

          {/* Linea 0 se ci sono negativi */}
          {hasNegative && zeroY && (
            <line 
              x1={padLeft} 
              y1={zeroY} 
              x2={width - padRight} 
              y2={zeroY} 
              stroke="#f43f5e" 
              strokeWidth="1.5" 
              strokeDasharray="4 2" 
              opacity="0.8" 
            />
          )}

          {/* Area sfumata */}
          <path d={areaD} fill="url(#scoreTrendGradient)" />

          {/* Linea curva principale */}
          <path
            d={pathD}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Punti dati interattivi */}
          {points.map((p, idx) => {
            const isHovered = activePoint?.handIndex === p.handIndex;
            return (
              <g 
                key={idx} 
                className="cursor-pointer transition-transform duration-100"
                onMouseEnter={() => setActivePoint(p)}
                onMouseLeave={() => setActivePoint(null)}
                onClick={() => setActivePoint(p)}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill={p.val >= 0 ? '#10b981' : '#f43f5e'}
                  stroke="#fbbf24"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  filter={isHovered ? 'url(#glowPoint)' : undefined}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
