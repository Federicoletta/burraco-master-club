import React from 'react';
import { Edit2, Crown } from 'lucide-react';

export default function TeamScoreCards({
  activeGame,
  isTrio = false,
  totalTeam1 = 0,
  totalTeam2 = 0,
  totalTeam3 = 0,
  targetScore = 2505,
  leader = 'tie',
  diff = 0,
  t1Percent = 0,
  t2Percent = 0,
  t3Percent = 0,
  titlesMap = {},
  onOpenEditTeams = null,
}) {
  if (!activeGame) return null;

  const teams = [
    {
      key: 'team1',
      team: activeGame.team1,
      fallbackName: 'Squadra 1',
      total: totalTeam1,
      percent: t1Percent,
      suit: '♦',
      accentText: 'text-amber-300',
      barClass: 'bg-gradient-to-r from-amber-500 to-amber-300',
      activeRing: 'border-amber-400/75 ring-1 ring-amber-400/25',
      defaultBorder: 'hover:border-amber-400/45',
    },
    {
      key: 'team2',
      team: activeGame.team2,
      fallbackName: 'Squadra 2',
      total: totalTeam2,
      percent: t2Percent,
      suit: '♠',
      accentText: 'text-sky-300',
      barClass: 'bg-gradient-to-r from-sky-500 to-sky-300',
      activeRing: 'border-sky-400/75 ring-1 ring-sky-400/25',
      defaultBorder: 'hover:border-sky-400/45',
    },
    ...(isTrio
      ? [
          {
            key: 'team3',
            team: activeGame.team3,
            fallbackName: 'Giocatore 3',
            total: totalTeam3,
            percent: t3Percent,
            suit: '♥',
            accentText: 'text-rose-300',
            barClass: 'bg-gradient-to-r from-rose-500 to-rose-300',
            activeRing: 'border-rose-400/75 ring-1 ring-rose-400/25',
            defaultBorder: 'hover:border-rose-400/45',
          },
        ]
      : []),
  ];

  return (
    <div className={`grid grid-cols-1 ${isTrio ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
      {teams.map((item) => {
        const isLeading = leader === item.key && diff !== 0;
        const remaining = targetScore - item.total;
        const players = item.team?.players || [];

        return (
          <div
            key={item.key}
            className={`club-card relative flex flex-col justify-between min-w-0 p-4 rounded-2xl transition-all ${
              isLeading ? item.activeRing : item.defaultBorder
            }`}
          >
            {/* Intestazione Squadra */}
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`text-sm shrink-0 ${item.accentText}`}>{item.suit}</span>
                  <h3 className={`text-xs sm:text-sm font-bold uppercase tracking-wider truncate ${item.accentText}`}>
                    {item.team?.name || item.fallbackName}
                  </h3>
                  {onOpenEditTeams && (
                    <button
                      type="button"
                      onClick={onOpenEditTeams}
                      className="min-w-[38px] min-h-[38px] -my-2 -mr-1 rounded-xl flex items-center justify-center club-text-subtle hover:text-amber-300 hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                      aria-label={`Modifica nomi ${item.team?.name || item.fallbackName}`}
                      title="Modifica squadra e giocatori"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {players.length > 0 && (
                  <p className="text-xs club-text-muted mt-1 truncate">
                    {players.map((p, idx) => {
                      const tInfo = titlesMap[p];
                      return (
                        <span key={p} title={tInfo ? `${tInfo.title} (${tInfo.rank})` : p}>
                          {idx > 0 && <span className="club-text-subtle mx-1.5">·</span>}
                          {tInfo ? `${tInfo.icon} ` : ''}
                          {p}
                        </span>
                      );
                    })}
                  </p>
                )}
              </div>

              {isLeading && (
                <div className={`shrink-0 flex items-center gap-1 text-xs font-bold font-mono-num ${item.accentText}`}>
                  <Crown className="w-3.5 h-3.5 shrink-0" />
                  <span>+{Math.abs(diff)}</span>
                </div>
              )}
            </div>

            {/* Punteggio Tabulare Grande */}
            <div className="my-3 flex items-baseline justify-between gap-2">
              <div className="font-mono-num text-4xl sm:text-5xl font-bold tracking-tight text-white">
                {item.total.toLocaleString('it-IT')}
                <span className={`text-xs sm:text-sm font-sans font-semibold ml-1.5 ${item.accentText}`}>
                  pt
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] club-text-subtle block">
                  {remaining > 0 ? 'Mancano' : 'Traguardo'}
                </span>
                <span className={`text-xs font-mono-num font-bold ${item.accentText}`}>
                  {remaining > 0 ? `${remaining.toLocaleString('it-IT')} pt` : 'Raggiunto'}
                </span>
              </div>
            </div>

            {/* Barra Progresso Pulita */}
            <div className="space-y-1">
              <div className="w-full club-inset rounded-full h-2 overflow-hidden">
                <div
                  className={`${item.barClass} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] club-text-subtle">
                <span>Obiettivo {targetScore}</span>
                <span className={`font-mono-num font-semibold ${item.accentText}`}>
                  {item.percent}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}