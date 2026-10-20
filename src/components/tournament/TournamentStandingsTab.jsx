import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function TournamentStandingsTab({
  standings = [],
  onGoToSchedule
}) {
  return (
    <div className="space-y-4">
      {/* PODIO DELLE PRIME 3 SQUADRE (se ci sono almeno 3 squadre) */}
      {standings.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 pt-1 text-center items-end">
          
          {/* 2° Posto (Argento) */}
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-500/40 shadow-md">
            <span className="text-xl sm:text-2xl block mb-0.5">🥈</span>
            <span className="text-xs font-black text-slate-200 block truncate">
              {standings[1]?.name}
            </span>
            <span className="text-[10px] text-emerald-300/70 block truncate mb-1">
              {(standings[1]?.players || []).join(' & ')}
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-300 block">
              {standings[1]?.tournamentPoints} <span className="text-[10px] text-slate-300 font-normal">pt</span>
            </span>
            <span className="text-[9px] text-slate-400 block font-bold">2° POSTO</span>
          </div>

          {/* 1° Posto (Oro - più alto e in evidenza) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/20 via-emerald-950/90 to-emerald-950/90 border-2 border-amber-400 shadow-xl ring-2 ring-amber-400/30">
            <span className="text-2xl sm:text-3xl block mb-0.5">👑</span>
            <span className="text-xs sm:text-sm font-black text-white block truncate">
              {standings[0]?.name}
            </span>
            <span className="text-[10px] text-amber-200/80 block truncate mb-1">
              {(standings[0]?.players || []).join(' & ')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 block">
              {standings[0]?.tournamentPoints} <span className="text-xs text-amber-200 font-bold">pt</span>
            </span>
            <span className="text-[10px] text-amber-300 block font-black uppercase tracking-wider">
              1° IN CLASSIFICA
            </span>
          </div>

          {/* 3° Posto (Bronzo) */}
          <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-700/40 shadow-md">
            <span className="text-xl sm:text-2xl block mb-0.5">🥉</span>
            <span className="text-xs font-black text-amber-300/90 block truncate">
              {standings[2]?.name}
            </span>
            <span className="text-[10px] text-emerald-300/70 block truncate mb-1">
              {(standings[2]?.players || []).join(' & ')}
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-300 block">
              {standings[2]?.tournamentPoints} <span className="text-[10px] text-slate-300 font-normal">pt</span>
            </span>
            <span className="text-[9px] text-amber-500/80 block font-bold">3° POSTO</span>
          </div>

        </div>
      )}

      {/* TABELLA CLASSIFICA COMPLETA */}
      <div className="rounded-2xl border border-emerald-700/50 overflow-hidden shadow-lg bg-emerald-950/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-900/80 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-300 border-b border-emerald-700/60">
                <th className="py-2.5 px-3 text-center w-10">Pos</th>
                <th className="py-2.5 px-3">Squadra & Giocatori</th>
                <th className="py-2.5 px-3 text-center font-black text-amber-300">PT</th>
                <th className="py-2.5 px-2 text-center">G</th>
                <th className="py-2.5 px-2 text-center text-emerald-300">V</th>
                <th className="py-2.5 px-2 text-center text-slate-400">N</th>
                <th className="py-2.5 px-2 text-center text-rose-300">P</th>
                <th className="py-2.5 px-2 text-right hidden sm:table-cell">PF</th>
                <th className="py-2.5 px-2 text-right hidden sm:table-cell">PS</th>
                <th className="py-2.5 px-3 text-right font-bold">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-800/40">
              {standings.map((team, idx) => (
                <tr 
                  key={team.id}
                  className={`transition-colors ${
                    idx === 0 
                      ? 'bg-amber-400/10 font-bold' 
                      : idx % 2 === 0 ? 'bg-emerald-950/40' : 'bg-transparent'
                  } hover:bg-emerald-800/30`}
                >
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                      idx === 0 
                        ? 'bg-amber-400 text-emerald-950 shadow-xs' 
                        : idx === 1 ? 'bg-slate-300 text-slate-950' 
                        : idx === 2 ? 'bg-amber-700 text-white' 
                        : 'text-emerald-300 bg-emerald-900/60'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white text-xs sm:text-sm">
                      {team.name}
                    </div>
                    <div className="text-[11px] text-emerald-300/80">
                      {(team.players || []).join(' & ')}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-base sm:text-lg font-black text-amber-300">
                      {team.tournamentPoints}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-semibold text-emerald-100">{team.played}</td>
                  <td className="py-2.5 px-2 text-center font-bold text-emerald-400">{team.won}</td>
                  <td className="py-2.5 px-2 text-center font-medium text-slate-400">{team.drawn}</td>
                  <td className="py-2.5 px-2 text-center font-medium text-rose-400">{team.lost}</td>
                  <td className="py-2.5 px-2 text-right hidden sm:table-cell text-emerald-200">{team.pointsFor}</td>
                  <td className="py-2.5 px-2 text-right hidden sm:table-cell text-rose-300/80">{team.pointsAgainst}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`font-mono font-bold ${
                      team.pointDifference > 0 
                        ? 'text-emerald-400' 
                        : team.pointDifference < 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {team.pointDifference > 0 ? `+${team.pointDifference}` : team.pointDifference}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-[11px] text-emerald-300/80 flex items-center justify-between">
        <span>Legenda: <strong>PT</strong> Punti Torneo (V=3, N=1, P=0) • <strong>Diff</strong> Differenza punti Burraco</span>
        {onGoToSchedule && (
          <button
            type="button"
            onClick={onGoToSchedule}
            className="text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Vedi Incontri</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
