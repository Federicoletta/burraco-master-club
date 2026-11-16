import React, { useState } from 'react';
import { ArrowRight, Share2, Check, Award, Crown } from 'lucide-react';
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
      {/* BARRA FORMULA & CONDIVISIONE */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl club-inset">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-9 h-9 rounded-xl club-card club-text-gold flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {isFibur ? 'FIBUR Victory Points (20-0)' : 'Formula Classica (3-1-0)'}
            </div>
            <div className="text-[11px] club-text-subtle truncate">
              {isFibur
                ? 'Scala federale da 10-10 a 20-0 su scarto punti'
                : '3 pt vittoria · 1 pt pareggio · 0 pt sconfitta'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="min-h-[40px] px-3.5 rounded-xl gold-gradient font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
          title="Condividi classifica"
        >
          {copied ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copiata' : 'Condividi'}</span>
        </button>
      </div>

      {/* PODIO PROPORZIONATO (1° a larghezza piena su mobile, 2°-1°-3° su desktop) */}
      {standings.length >= 3 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 items-end">
          {/* 1° Posto */}
          <div className="col-span-2 sm:col-span-1 sm:order-2 p-4 rounded-2xl club-card border-amber-400/75 text-center">
            <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider club-text-gold mb-1">
              <Crown className="w-3.5 h-3.5" />
              <span>1° In Classifica</span>
            </div>
            <div className="text-sm sm:text-base font-bold text-white truncate">
              {standings[0]?.name}
            </div>
            {(standings[0]?.players || []).length > 0 && (
              <div className="text-xs club-text-muted truncate mb-2">
                {(standings[0]?.players || []).join(' & ')}
              </div>
            )}
            <div className="font-mono-num text-3xl font-bold club-text-gold">
              {standings[0]?.tournamentPoints}
              <span className="text-xs font-sans font-semibold ml-1">{pointsLabel}</span>
            </div>
          </div>

          {/* 2° Posto */}
          <div className="sm:order-1 p-3.5 rounded-2xl club-inset border-slate-300/35 text-center">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              2° Posto
            </span>
            <div className="text-xs sm:text-sm font-bold text-white truncate">
              {standings[1]?.name}
            </div>
            {(standings[1]?.players || []).length > 0 && (
              <div className="text-[11px] club-text-subtle truncate mb-1.5">
                {(standings[1]?.players || []).join(' & ')}
              </div>
            )}
            <div className="font-mono-num text-xl font-bold text-slate-200">
              {standings[1]?.tournamentPoints}
              <span className="text-[11px] font-sans font-medium ml-1 club-text-subtle">{pointsLabel}</span>
            </div>
          </div>

          {/* 3° Posto */}
          <div className="sm:order-3 p-3.5 rounded-2xl club-inset border-amber-600/40 text-center">
            <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider block mb-1">
              3° Posto
            </span>
            <div className="text-xs sm:text-sm font-bold text-white truncate">
              {standings[2]?.name}
            </div>
            {(standings[2]?.players || []).length > 0 && (
              <div className="text-[11px] club-text-subtle truncate mb-1.5">
                {(standings[2]?.players || []).join(' & ')}
              </div>
            )}
            <div className="font-mono-num text-xl font-bold text-amber-300">
              {standings[2]?.tournamentPoints}
              <span className="text-[11px] font-sans font-medium ml-1 club-text-subtle">{pointsLabel}</span>
            </div>
          </div>
        </div>
      )}

      {/* CLASSIFICA MOBILE A SCHEDE (< sm) */}
      <div className="sm:hidden space-y-2">
        {standings.map((team, idx) => (
          <div
            key={team.id}
            className={`p-3.5 rounded-2xl border transition-colors ${
              idx === 0 ? 'club-card border-amber-400/60' : 'club-inset'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <span className={`w-7 h-7 rounded-lg font-mono-num text-xs font-bold flex items-center justify-center shrink-0 ${
                  idx === 0
                    ? 'gold-gradient'
                    : idx === 1
                      ? 'bg-slate-300 text-slate-950'
                      : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'club-card club-text-muted'
                }`}>
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white leading-snug">
                    {team.name}
                  </div>
                  {team.players && team.players.length > 0 && (
                    <div className="text-xs club-text-muted truncate mt-0.5">
                      {team.players.join(' & ')}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono-num text-xl font-bold club-text-gold block leading-none">
                  {team.tournamentPoints}
                </span>
                <span className="text-[10px] font-semibold club-text-subtle uppercase">
                  {pointsLabel}
                </span>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t club-divider flex items-center justify-between text-xs font-mono-num">
              <div className="flex items-center gap-2.5">
                <span className="club-text-subtle">
                  G <strong className="text-white">{team.played}</strong>
                </span>
                <span className="text-emerald-300 font-semibold">{team.won}V</span>
                <span className="club-text-muted">{team.drawn}N</span>
                <span className="text-rose-300">{team.lost}P</span>
              </div>
              <div className={`font-bold ${
                team.pointDifference > 0
                  ? 'club-text-gold'
                  : team.pointDifference < 0
                    ? 'text-rose-300'
                    : 'club-text-subtle'
              }`}>
                Diff {team.pointDifference > 0 ? `+${team.pointDifference.toLocaleString('it-IT')}` : team.pointDifference.toLocaleString('it-IT')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TABELLA DESKTOP / TABLET (>= sm) */}
      <div className="hidden sm:block rounded-2xl club-inset overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-black/25 text-[11px] font-bold uppercase tracking-wider club-text-muted border-b club-divider">
                <th className="py-3 px-3 text-center w-12">Pos</th>
                <th className="py-3 px-3">Coppia e Giocatori</th>
                <th className="py-3 px-3 text-center club-text-gold">{pointsLabel}</th>
                <th className="py-3 px-2 text-center">G</th>
                <th className="py-3 px-2 text-center text-emerald-300">V</th>
                <th className="py-3 px-2 text-center">N</th>
                <th className="py-3 px-2 text-center text-rose-300">P</th>
                <th className="py-3 px-2 text-right">PF</th>
                <th className="py-3 px-2 text-right">PS</th>
                <th className="py-3 px-3 text-right">Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y club-divider">
              {standings.map((team, idx) => (
                <tr
                  key={team.id}
                  className={`${idx === 0 ? 'bg-amber-400/10' : ''} hover:bg-white/5 transition-colors`}
                >
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg font-mono-num text-xs font-bold ${
                      idx === 0
                        ? 'gold-gradient'
                        : idx === 1
                          ? 'bg-slate-300 text-slate-950'
                          : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'club-card club-text-muted'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-white text-sm">{team.name}</div>
                    {team.players && team.players.length > 0 && (
                      <div className="text-[11px] club-text-subtle">{team.players.join(' & ')}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-mono-num text-base font-bold club-text-gold">
                      {team.tournamentPoints}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center font-mono-num font-semibold text-white">{team.played}</td>
                  <td className="py-3 px-2 text-center font-mono-num font-bold text-emerald-300">{team.won}</td>
                  <td className="py-3 px-2 text-center font-mono-num club-text-muted">{team.drawn}</td>
                  <td className="py-3 px-2 text-center font-mono-num text-rose-300">{team.lost}</td>
                  <td className="py-3 px-2 text-right font-mono-num club-text-muted">
                    {team.pointsFor.toLocaleString('it-IT')}
                  </td>
                  <td className="py-3 px-2 text-right font-mono-num text-rose-300/80">
                    {team.pointsAgainst.toLocaleString('it-IT')}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`font-mono-num font-bold ${
                      team.pointDifference > 0
                        ? 'club-text-gold'
                        : team.pointDifference < 0
                          ? 'text-rose-300'
                          : 'club-text-subtle'
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

      {/* LEGENDA E RIMANDO CALENDARIO */}
      <div className="p-3 rounded-xl club-inset text-xs club-text-subtle flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong className="text-white">{pointsLabel}</strong> {isFibur ? 'Victory Points FIBUR (su 20)' : 'Punti Torneo (3-1-0)'} · <strong className="text-white">Diff</strong> Differenza punti
        </span>
        {onGoToSchedule && (
          <button
            type="button"
            onClick={onGoToSchedule}
            className="min-h-[36px] club-text-gold hover:underline font-bold flex items-center gap-1 cursor-pointer ml-auto"
          >
            <span>Vedi Incontri</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
