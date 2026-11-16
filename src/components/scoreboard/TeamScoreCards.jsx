import React from 'react';
import { Edit2 } from 'lucide-react';

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

  return (
    <div className={`grid grid-cols-1 ${isTrio ? 'sm:grid-cols-3' : 'md:grid-cols-2'} gap-2.5 sm:gap-3.5`}>
      
      {/* CARD SQUADRA 1 (TEMA ORO / AMBRA) */}
      <div className={`relative flex flex-col justify-between min-w-0 overflow-hidden p-3.5 sm:p-4 rounded-2xl border border-t-4 border-t-amber-400 felt-card transition-all duration-300 ${
        leader === 'team1' 
          ? 'border-amber-400/80 ring-2 ring-amber-400/30 shadow-xl shadow-amber-950/30' 
          : 'hover:border-amber-500/40 shadow-md'
      }`}>
        <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1.5 min-w-0">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-start gap-1.5 min-w-0 break-words">
                <span className="text-sm text-amber-300 shrink-0 leading-none mt-0.5">♦</span>
                <span className="min-w-0 break-words">{activeGame.team1?.name || 'Squadra 1'}</span>
              </span>
              {onOpenEditTeams && (
                <button
                  type="button"
                  onClick={onOpenEditTeams}
                  className="p-1 rounded-md text-emerald-400/70 hover:text-amber-300 hover:bg-emerald-900/60 transition-colors cursor-pointer shrink-0"
                  title="Modifica squadra e giocatori"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
            {activeGame.team1?.players && activeGame.team1.players.length > 0 && (
              <div className="text-xs text-emerald-300 font-medium mt-1 flex flex-wrap gap-1">
                {activeGame.team1.players.map((p) => {
                  const tInfo = titlesMap[p];
                  return (
                    <span 
                      key={p} 
                      className="inline-flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-md border border-white/15 text-[11px] shadow-sm"
                      title={tInfo ? `${tInfo.title} (${tInfo.rank})` : p}
                    >
                      {tInfo && <span>{tInfo.icon}</span>}
                      <span className="font-semibold text-emerald-100">{p}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Badge Leader Integrato nella Card */}
          {leader === 'team1' && diff !== 0 && (
            <div className="px-2.5 py-1 rounded-full gold-gradient text-emerald-950 text-[10px] sm:text-[11px] font-black tracking-wide uppercase shadow-md flex items-center gap-1 border border-amber-200/50 shrink-0 animate-in fade-in">
              <span>👑</span>
              <span>In Vantaggio</span>
              <span className="bg-emerald-950/20 px-1.5 py-0.2 rounded-full font-black text-[9px] sm:text-[10px]">(+{diff} pt)</span>
            </div>
          )}
        </div>

        {/* Punteggio Gigante */}
        <div className="my-2 flex items-baseline justify-between">
          <div className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md">
            {totalTeam1.toLocaleString('it-IT')}
            <span className="text-sm font-normal text-amber-300/80 ml-1.5">pt</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-white/70 block">Traguardo: {targetScore}</span>
            <span className="text-xs font-bold text-amber-300">
              {targetScore - totalTeam1 > 0 
                ? `Mancano ${targetScore - totalTeam1} pt` 
                : 'Raggiunto! 🎉'}
            </span>
          </div>
        </div>

        {/* Barra di Progresso */}
        <div className="w-full bg-black/40 rounded-full h-2.5 p-0.5 border border-white/10 overflow-hidden shadow-inner">
          <div 
            className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-200 h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${t1Percent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] sm:text-[11px] text-white/70 mt-1 font-medium">
          <span>Progresso vittoria</span>
          <span className="font-bold text-amber-300">{t1Percent}%</span>
        </div>
      </div>

      {/* CARD SQUADRA 2 (TEMA BLU NOTTE / ZAFFIRO) */}
      <div className={`relative flex flex-col justify-between min-w-0 overflow-hidden p-3.5 sm:p-4 rounded-2xl border border-t-4 border-t-blue-400 felt-card transition-all duration-300 ${
        leader === 'team2' 
          ? 'border-blue-400/80 ring-2 ring-blue-400/30 shadow-xl shadow-blue-950/30' 
          : 'hover:border-blue-500/40 shadow-md'
      }`}>
        <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1.5 min-w-0">
              <span className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-start gap-1.5 min-w-0 break-words">
                <span className="text-sm text-blue-400 shrink-0 leading-none mt-0.5">♠</span>
                <span className="min-w-0 break-words">{activeGame.team2?.name || 'Squadra 2'}</span>
              </span>
              {onOpenEditTeams && (
                <button
                  type="button"
                  onClick={onOpenEditTeams}
                  className="p-1 rounded-md text-emerald-400/70 hover:text-blue-300 hover:bg-emerald-900/60 transition-colors cursor-pointer shrink-0"
                  title="Modifica squadra e giocatori"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
            </div>
            {activeGame.team2?.players && activeGame.team2.players.length > 0 && (
              <div className="text-xs text-emerald-300 font-medium mt-1 flex flex-wrap gap-1">
                {activeGame.team2.players.map((p) => {
                  const tInfo = titlesMap[p];
                  return (
                    <span 
                      key={p} 
                      className="inline-flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-md border border-white/15 text-[11px] shadow-sm"
                      title={tInfo ? `${tInfo.title} (${tInfo.rank})` : p}
                    >
                      {tInfo && <span>{tInfo.icon}</span>}
                      <span className="font-semibold text-emerald-100">{p}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Badge Leader Integrato nella Card */}
          {leader === 'team2' && diff !== 0 && (
            <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 text-slate-950 text-[10px] sm:text-[11px] font-black tracking-wide uppercase shadow-md flex items-center gap-1 border border-blue-200/50 shrink-0 animate-in fade-in">
              <span>👑</span>
              <span>In Vantaggio</span>
              <span className="bg-slate-950/20 px-1.5 py-0.2 rounded-full font-black text-[9px] sm:text-[10px]">(+{Math.abs(diff)} pt)</span>
            </div>
          )}
        </div>

        {/* Punteggio Gigante */}
        <div className="my-2 flex items-baseline justify-between">
          <div className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md">
            {totalTeam2.toLocaleString('it-IT')}
            <span className="text-sm font-normal text-blue-300/80 ml-1.5">pt</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-white/70 block">Traguardo: {targetScore}</span>
            <span className="text-xs font-bold text-blue-300">
              {targetScore - totalTeam2 > 0 
                ? `Mancano ${targetScore - totalTeam2} pt` 
                : 'Raggiunto! 🎉'}
            </span>
          </div>
        </div>

        {/* Barra di Progresso */}
        <div className="w-full bg-black/40 rounded-full h-2.5 p-0.5 border border-white/10 overflow-hidden shadow-inner">
          <div 
            className="bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-300 h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${t2Percent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] sm:text-[11px] text-white/70 mt-1 font-medium">
          <span>Progresso vittoria</span>
          <span className="font-bold text-blue-300">{t2Percent}%</span>
        </div>
      </div>

      {/* CARD SQUADRA 3 (TEMA RUBINO / ROSA - SOLO SE A 3) */}
      {isTrio && (
        <div className={`relative flex flex-col justify-between min-w-0 overflow-hidden p-3.5 sm:p-4 rounded-2xl border border-t-4 border-t-rose-400 felt-card transition-all duration-300 ${
          leader === 'team3' 
            ? 'border-rose-400/80 ring-2 ring-rose-400/30 shadow-xl shadow-rose-950/30' 
            : 'hover:border-rose-500/40 shadow-md'
        }`}>
          <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-1.5 min-w-0">
                <span className="text-xs font-black text-rose-300 uppercase tracking-wider flex items-start gap-1.5 min-w-0 break-words">
                  <span className="text-sm text-rose-400 shrink-0 leading-none mt-0.5">♥</span>
                  <span className="min-w-0 break-words">{activeGame.team3?.name || 'Giocatore 3'}</span>
                </span>
                {onOpenEditTeams && (
                  <button
                    type="button"
                    onClick={onOpenEditTeams}
                    className="p-1 rounded-md text-emerald-400/70 hover:text-rose-300 hover:bg-emerald-900/60 transition-colors cursor-pointer shrink-0"
                    title="Modifica squadra e giocatori"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              {activeGame.team3?.players && activeGame.team3.players.length > 0 && (
                <div className="text-xs text-emerald-300 font-medium mt-1 flex flex-wrap gap-1">
                  {activeGame.team3.players.map((p) => {
                    const tInfo = titlesMap[p];
                    return (
                      <span 
                        key={p} 
                        className="inline-flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-md border border-white/15 text-[11px] shadow-sm"
                        title={tInfo ? `${tInfo.title} (${tInfo.rank})` : p}
                      >
                        {tInfo && <span>{tInfo.icon}</span>}
                        <span className="font-semibold text-emerald-100">{p}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Badge Leader Integrato nella Card */}
            {leader === 'team3' && diff !== 0 && (
              <div className="px-2.5 py-1 rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 text-slate-950 text-[10px] sm:text-[11px] font-black tracking-wide uppercase shadow-md flex items-center gap-1 border border-rose-200/50 shrink-0 animate-in fade-in">
                <span>👑</span>
                <span>In Vantaggio</span>
                <span className="bg-slate-950/20 px-1.5 py-0.2 rounded-full font-black text-[9px] sm:text-[10px]">(+{Math.abs(diff)} pt)</span>
              </div>
            )}
          </div>

          {/* Punteggio Gigante */}
          <div className="my-2 flex items-baseline justify-between">
            <div className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md">
              {totalTeam3.toLocaleString('it-IT')}
              <span className="text-sm font-normal text-rose-300/80 ml-1.5">pt</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-white/70 block">Traguardo: {targetScore}</span>
              <span className="text-xs font-bold text-rose-300">
                {targetScore - totalTeam3 > 0 
                  ? `Mancano ${targetScore - totalTeam3} pt` 
                  : 'Raggiunto! 🎉'}
              </span>
            </div>
          </div>

          {/* Barra di Progresso */}
          <div className="w-full bg-black/40 rounded-full h-2.5 p-0.5 border border-white/10 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-rose-500 via-pink-400 to-rose-300 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${t3Percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] sm:text-[11px] text-white/70 mt-1 font-medium">
            <span>Progresso vittoria</span>
            <span className="font-bold text-rose-300">{t3Percent}%</span>
          </div>
        </div>
      )}

    </div>
  );
}