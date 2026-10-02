import React, { useState } from 'react';
import { TrendingUp, Trophy, Sparkles, Award } from 'lucide-react';

export default function StatsCharts({ stats, selectedPlayerName, onSelectPlayer }) {
  const [activePlayer, setActivePlayer] = useState(
    selectedPlayerName || (stats && stats.length > 0 ? stats[0].name : '')
  );

  // Se cambia selectedPlayerName dall'esterno, sincronizza
  React.useEffect(() => {
    if (selectedPlayerName) {
      setActivePlayer(selectedPlayerName);
    }
  }, [selectedPlayerName]);

  const handleSelect = (name) => {
    setActivePlayer(name);
    if (onSelectPlayer) onSelectPlayer(name);
  };

  if (!stats || stats.length === 0) {
    return (
      <div className="p-8 text-center text-emerald-300/70 text-xs">
        Nessun dato statistico disponibile per generare i grafici.
      </div>
    );
  }

  const currentPlayerObj = stats.find(s => s.name === activePlayer) || stats[0];

  return (
    <div className="space-y-3.5">
      
      {/* Selettore Giocatore Orizzontale a Scorrimento */}
      <div>
        <div className="flex items-center justify-between text-xs text-emerald-300/90 mb-1.5 px-0.5">
          <span className="font-semibold flex items-center gap-1.5 text-white">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Seleziona Giocatore:</span>
          </span>
          <span className="text-[11px] text-emerald-400/80">
            {stats.length} partecipanti
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {stats.map(p => {
            const isSelected = p.name === currentPlayerObj.name;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => handleSelect(p.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-400 text-emerald-950 shadow-md font-black'
                    : 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60'
                }`}
              >
                <span>{p.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isSelected ? 'bg-emerald-950 text-amber-300' : 'bg-emerald-900/90 text-emerald-400'
                }`}>
                  {p.totalPoints.toLocaleString('it-IT')} pt
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scheda Statistiche Rapide del Giocatore Selezionato */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60">
          <span className="text-[10px] text-emerald-400/80 block uppercase font-medium">Punti Totali</span>
          <span className="font-black text-amber-300 text-sm sm:text-base">
            {currentPlayerObj.totalPoints.toLocaleString('it-IT')} pt
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60">
          <span className="text-[10px] text-emerald-400/80 block uppercase font-medium">Media / Mano</span>
          <span className="font-extrabold text-white text-sm sm:text-base">
            {currentPlayerObj.avgPointsPerHand} pt
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60">
          <span className="text-[10px] text-emerald-400/80 block uppercase font-medium">Record Mano</span>
          <span className="font-extrabold text-amber-400 text-sm sm:text-base">
            +{currentPlayerObj.bestHandScore} pt
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60">
          <span className="text-[10px] text-emerald-400/80 block uppercase font-medium">Chiusure</span>
          <span className="font-extrabold text-emerald-300 text-sm sm:text-base">
            {currentPlayerObj.closures} volte
          </span>
        </div>
      </div>

      {/* Grafico SVG Responsivo Curva Andamento Morbida */}
      <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-700/50 shadow-lg space-y-2">
        <div className="flex items-center justify-between text-xs pb-1 border-b border-emerald-800/50">
          <span className="font-bold text-white flex items-center gap-1.5">
            <span>Andamento cronologico mani:</span>
            <strong className="text-amber-300">{currentPlayerObj.name}</strong>
          </span>
          <span className="text-[11px] text-emerald-400/80">
            {currentPlayerObj.scoresHistory?.length || 0} mani registrate
          </span>
        </div>

        {currentPlayerObj.scoresHistory && currentPlayerObj.scoresHistory.length > 1 ? (
          <div>
            <div className="w-full bg-emerald-950/90 rounded-xl p-2 sm:p-3 border border-emerald-800/60">
              <svg className="w-full h-44 sm:h-52 overflow-visible" viewBox="0 0 600 220">
                <defs>
                  <linearGradient id="trendGradModal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Linee guida orizzontali di riferimento */}
                <line x1="30" y1="45" x2="570" y2="45" stroke="#064e3b" strokeDasharray="3 3" />
                <line x1="30" y1="105" x2="570" y2="105" stroke="#064e3b" strokeDasharray="3 3" />
                <line x1="30" y1="165" x2="570" y2="165" stroke="#064e3b" strokeDasharray="3 3" />

                {(() => {
                  const scores = currentPlayerObj.scoresHistory;
                  const min = Math.min(0, ...scores);
                  const max = Math.max(100, ...scores);
                  const range = (max - min) || 1;

                  const padLeft = 45;
                  const padRight = 45;
                  const padTop = 35;
                  const padBottom = 42;
                  const plotWidth = 600 - padLeft - padRight;
                  const plotHeight = 220 - padTop - padBottom;

                  const points = scores.map((val, i) => {
                    const x = padLeft + (scores.length > 1 ? (i / (scores.length - 1)) * plotWidth : plotWidth / 2);
                    const y = padTop + (1 - ((val - min) / range)) * plotHeight;
                    return { x, y, val };
                  });

                  // Curva cubica morbida (Bezier) tra i punti
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
                    <>
                      {/* Linea di base 0 pt se ci sono mani negative */}
                      {hasNegative && (
                        <g>
                          <line
                            x1="25"
                            y1={zeroY}
                            x2="575"
                            y2={zeroY}
                            stroke="#f43f5e"
                            strokeWidth="1.5"
                            strokeDasharray="4 3"
                            opacity="0.75"
                          />
                          <text
                            x="38"
                            y={zeroY - 4}
                            fill="#f43f5e"
                            fontSize="9"
                            fontWeight="bold"
                          >
                            0 pt (Pareggio)
                          </text>
                        </g>
                      )}

                      {/* Sfumatura area sottostante */}
                      <path d={areaD} fill="url(#trendGradModal)" />

                      {/* Tracciato curva principale */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Punti e valori */}
                      {points.map((p, i) => {
                        const isNeg = p.val < 0;
                        const isMax = p.val === Math.max(...scores);
                        return (
                          <g key={i}>
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={isMax ? "5.5" : "4.5"}
                              fill={isNeg ? "#f43f5e" : "#fbbf24"}
                              stroke="#022c22"
                              strokeWidth="2.5"
                            />

                            <text
                              x={p.x}
                              y={isNeg ? p.y + 16 : p.y - 9}
                              fill={isNeg ? "#fca5a5" : isMax ? "#fef08a" : "#ffffff"}
                              fontSize="10"
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              {p.val > 0 ? `+${p.val}` : `${p.val}`} pt
                            </text>

                            <text
                              x={p.x}
                              y="210"
                              fill="#6ee7b7"
                              fontSize="9"
                              textAnchor="middle"
                              opacity="0.8"
                            >
                              Mano {i + 1}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>

              <div className="flex justify-between text-[10px] text-emerald-400/70 pt-2 border-t border-emerald-900/60 mt-1">
                <span>Inizio partita / Prima mano</span>
                <span>Ultime mani disputate ({currentPlayerObj.scoresHistory.length} totali)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-emerald-300/70 text-xs">
            Gioca almeno 2 mani con <strong>{currentPlayerObj.name}</strong> per visualizzare la curva di andamento!
          </div>
        )}
      </div>

    </div>
  );
}
