import React, { useState } from 'react';
import { ArrowRight, Share2, Check, Trophy, Award } from 'lucide-react';
import { formatStandingsForSharing } from '../../utils/tournament';
import { sound } from '../../utils/soundEffects';

export default function TournamentStandingsTab({
  tournament,
  standings = [],
  onGoToSchedule
}) {
  const [copied, setCopied] = useState(false);
  const isFibur = tournament?.scoringSystem !== 'classic';
  const pointsLabel = isFibur ? 'VP' : 'PT';

  const handleShare = () => {
    if (!tournament) return;
    const text = formatStandingsForSharing(tournament, standings);

    if (navigator.share) {
      navigator.share({
        title: `Classifica Torneo ${tournament.name}`,
        text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      sound.playTap();
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* BARRA AZIONI CLASSIFICA: CONDIVISIONE & FORMULA */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl felt-card border border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 text-amber-400" />
          </span>
          <div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Formula: {isFibur ? 'FIBUR Victory Points (20-0)' : 'Classico (3-1-0)'}</span>
            </div>
            <div className="text-[10px] text-white/70">
              {isFibur 
                ? 'Punteggio da 10-10 a 20-0 in base allo scarto smazzata'
                : '3 pt vittoria, 1 pt pareggio, 0 pt sconfitta'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="px-3 py-1.5 rounded-xl gold-gradient text-emerald-950 font-black text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer shrink-0"
          title="Condividi o copia la classifica per WhatsApp"
        >
          {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />}
          <span>{copied ? 'Classifica Copiata!' : 'Condividi Classifica'}</span>
        </button>
      </div>

      {/* PODIO DELLE PRIME 3 SQUADRE (se ci sono almeno 3 squadre) */}
      {standings.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 pt-1 text-center items-end">
          
          {/* 2° Posto (Argento) */}
          <div className="p-3 rounded-2xl felt-card border border-slate-400/40 shadow-md">
            <span className="text-xl sm:text-2xl block mb-0.5">🥈</span>
            <span className="text-xs font-black text-slate-200 block truncate">
              {standings[1]?.name}
            </span>
            <span className="text-[10px] text-white/70 block truncate mb-1">
              {(standings[1]?.players || []).join(' & ')}
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-300 block">
              {standings[1]?.tournamentPoints} <span className="text-[10px] text-slate-300 font-normal">{pointsLabel}</span>
            </span>
            <span className="text-[9px] text-slate-400 block font-bold">2° POSTO</span>
          </div>

          {/* 1° Posto (Oro - più alto e in evidenza) */}
          <div className="p-3.5 rounded-2xl felt-card border-2 border-amber-400 shadow-xl ring-2 ring-amber-400/30">
            <span className="text-2xl sm:text-3xl block mb-0.5">👑</span>
            <span className="text-xs sm:text-sm font-black text-white block truncate">
              {standings[0]?.name}
            </span>
            <span className="text-[10px] text-amber-200/80 block truncate mb-1">
              {(standings[0]?.players || []).join(' & ')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-400 block">
              {standings[0]?.tournamentPoints} <span className="text-xs text-amber-200 font-bold">{pointsLabel}</span>
            </span>
            <span className="text-[10px] text-amber-300 block font-black uppercase tracking-wider">
              1° IN CLASSIFICA
            </span>
          </div>

          {/* 3° Posto (Bronzo) */}
          <div className="p-3 rounded-2xl felt-card border border-amber-700/50 shadow-md">
            <span className="text-xl sm:text-2xl block mb-0.5">🥉</span>
            <span className="text-xs font-black text-amber-300/90 block truncate">
              {standings[2]?.name}
            </span>
            <span className="text-[10px] text-white/70 block truncate mb-1">
              {(standings[2]?.players || []).join(' & ')}
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-300 block">
              {standings[2]?.tournamentPoints} <span className="text-[10px] text-slate-300 font-normal">{pointsLabel}</span>
            </span>
            <span className="text-[9px] text-amber-500/80 block font-bold">3° POSTO</span>
          </div>

        </div>
      )}

      {/* TABELLA CLASSIFICA COMPLETA */}
      <div className="rounded-2xl border border-white/10 overflow-hidden shadow-lg felt-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-black/40 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/80 border-b border-white/10">
                <th className="py-2.5 px-3 text-center w-10">Pos</th>
                <th className="py-2.5 px-3">Squadra & Giocatori</th>
                <th className="py-2.5 px-3 text-center font-black text-amber-300">{pointsLabel}</th>
                <th className="py-2.5 px-2 text-center">G</th>
                <th className="py-2.5 px-2 text-center text-amber-400">V</th>
                <th className="py-2.5 px-2 text-center text-slate-400">N</th>
                <th className="py-2.5 px-2 text-center text-rose-300">P</th>
                <th className="py-2.5 px-2 text-right hidden sm:table-cell">PF</th>
                <th className="py-2.5 px-2 text-right hidden sm:table-cell">PS</th>
                <th className="py-2.5 px-3 text-right font-bold">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {standings.map((team, idx) => (
                <tr 
                  key={team.id}
                  className={`transition-colors ${
                    idx === 0 
                      ? 'bg-amber-400/10 font-bold' 
                      : idx % 2 === 0 ? 'bg-black/20' : 'bg-transparent'
                  } hover:bg-white/10`}
                >
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                      idx === 0 
                        ? 'bg-amber-400 text-emerald-950 shadow-xs' 
                        : idx === 1 ? 'bg-slate-300 text-slate-950' 
                        : idx === 2 ? 'bg-amber-700 text-white' 
                        : 'text-white/80 bg-black/40 border border-white/10'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-white text-xs sm:text-sm">
                      {team.name}
                    </div>
                    {team.players && team.players.length > 0 && (
                      <div className="text-[11px] text-white/70">
                        {team.players.join(' & ')}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-base sm:text-lg font-black text-amber-300">
                      {team.tournamentPoints}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-semibold text-white/90">{team.played}</td>
                  <td className="py-2.5 px-2 text-center font-bold text-amber-400">{team.won}</td>
                  <td className="py-2.5 px-2 text-center font-medium text-slate-400">{team.drawn}</td>
                  <td className="py-2.5 px-2 text-center font-medium text-rose-400">{team.lost}</td>
                  <td className="py-2.5 px-2 text-right hidden sm:table-cell text-white/90">
                    {team.pointsFor.toLocaleString('it-IT')}
                  </td>
                  <td className="py-2.5 px-2 text-right hidden sm:table-cell text-rose-300/80">
                    {team.pointsAgainst.toLocaleString('it-IT')}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`font-mono font-bold ${
                      team.pointDifference > 0 
                        ? 'text-amber-400' 
                        : team.pointDifference < 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {team.pointDifference > 0 ? `+${team.pointDifference.toLocaleString('it-IT')}` : team.pointDifference.toLocaleString('it-IT')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-3 rounded-xl felt-card border border-white/10 text-[11px] text-white/70 flex flex-wrap items-center justify-between gap-2">
        <span>
          Legenda: <strong>{pointsLabel}</strong> {isFibur ? 'Victory Points FIBUR (su 20)' : 'Punti Torneo (V=3, N=1, P=0)'} • <strong>Diff</strong> Differenza Match Points
        </span>
        {onGoToSchedule && (
          <button
            type="button"
            onClick={onGoToSchedule}
            className="text-amber-400 hover:underline font-bold flex items-center gap-1 cursor-pointer ml-auto"
          >
            <span>Vedi Calendario Incontri</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
