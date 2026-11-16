import React from 'react';
import { getPlayerTitle } from '../../utils/trophies';
import DeveloperBadge from '../DeveloperBadge';
import { isDeveloperAccount } from '../../utils/developer';
import { Users } from 'lucide-react';

export default function LeaderboardTab({
  sortBy = 'points',
  setSortBy,
  sortedFriendsStats = [],
  maxFriendsVal = 1,
  currentUser = null,
}) {
  return (
    <div className="space-y-3.5">
      {/* Selettore Metrica: Punti | Burrachi | Win Rate */}
      <div className="p-1 rounded-2xl club-tab-bar">
        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => setSortBy('points')}
            className={`min-h-[42px] px-2 rounded-xl font-bold text-xs transition-all cursor-pointer text-center ${
              sortBy === 'points'
                ? 'gold-gradient shadow-xs'
                : 'club-text-muted hover:bg-white/5'
            }`}
          >
            Punti
          </button>
          <button
            type="button"
            onClick={() => setSortBy('burrachi')}
            className={`min-h-[42px] px-2 rounded-xl font-bold text-xs transition-all cursor-pointer text-center ${
              sortBy === 'burrachi'
                ? 'gold-gradient shadow-xs'
                : 'club-text-muted hover:bg-white/5'
            }`}
          >
            Burrachi
          </button>
          <button
            type="button"
            onClick={() => setSortBy('winrate')}
            className={`min-h-[42px] px-2 rounded-xl font-bold text-xs transition-all cursor-pointer text-center ${
              sortBy === 'winrate'
                ? 'gold-gradient shadow-xs'
                : 'club-text-muted hover:bg-white/5'
            }`}
          >
            Win Rate
          </button>
        </div>
      </div>

      {/* LISTA CLASSIFICA AMICI CLUB */}
      <div className="space-y-2.5">
        {sortedFriendsStats.map((p, index) => {
          const titleInfo = getPlayerTitle(p);
          let currentVal = p.totalPoints;
          let primaryText = `${p.totalPoints.toLocaleString('it-IT')} pt`;
          let subText = `record +${p.bestHandScore}`;

          if (sortBy === 'burrachi') {
            currentVal = p.totalBurrachi;
            primaryText = `${p.totalBurrachi} burrachi`;
            subText = `${p.cleanBurrachi}P · ${p.semiCleanBurrachi}S · ${p.dirtyBurrachi}I`;
          } else if (sortBy === 'winrate') {
            currentVal = p.winRate;
            primaryText = `${p.winRate}%`;
            subText = `${p.gamesWon}V / ${p.gamesLost}P`;
          }

          const pct = currentVal > 0 && maxFriendsVal > 0 ? Math.round((currentVal / maxFriendsVal) * 100) : 0;

          return (
            <div
              key={p.uid || p.name}
              className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                p.isMe
                  ? 'club-card border-[var(--accent-gold)] ring-1 ring-[var(--accent-ring)]'
                  : 'club-inset border-[var(--border-subtle)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Posizione */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      index === 0
                        ? 'gold-gradient font-black'
                        : index === 1
                        ? 'bg-slate-200 text-slate-900 font-black'
                        : index === 2
                        ? 'bg-amber-800 text-amber-100 font-black'
                        : 'bg-black/30 border club-divider club-text-muted font-mono-num'
                    }`}
                  >
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                  </div>

                  {/* Avatar con eventuale stato online statico */}
                  <div className="relative shrink-0">
                    {p.photoURL ? (
                      <img
                        src={p.photoURL}
                        alt=""
                        className="w-9 h-9 rounded-full border border-[var(--accent-gold)] object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full gold-gradient font-black text-xs flex items-center justify-center">
                        {(p.name || 'G').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    {p.isOnline && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[var(--surface-card-solid)]"
                        title="Online adesso"
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-bold text-white m-0 truncate">
                        {p.name}
                      </h4>
                      {isDeveloperAccount(p, currentUser) && (
                        <DeveloperBadge size="xs" />
                      )}
                      {p.isMe && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-[var(--accent-gold)] text-[var(--accent-gold-ink)]">
                          Tu
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] club-text-subtle m-0 truncate">
                      {titleInfo.icon} {titleInfo.title}
                    </p>
                  </div>
                </div>

                {/* Valore Metrica Ordinata */}
                <div className="text-right shrink-0">
                  <div className="font-mono-num text-sm sm:text-base font-bold club-text-gold">
                    {primaryText}
                  </div>
                  <div className="font-mono-num text-[11px] club-text-subtle">
                    {subText}
                  </div>
                </div>
              </div>

              {/* Barra di Progressione */}
              <div className="h-1.5 w-full rounded-full bg-black/35 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    index === 0 ? 'gold-gradient' : 'bg-emerald-400/85'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Griglia Compatta Dati (3 Colonne Leggibili su Mobile) */}
              <div className="grid grid-cols-3 pt-2 border-t club-divider text-center divide-x divide-[var(--border-subtle)]">
                <div className="px-1">
                  <span className="text-[10px] uppercase tracking-wider club-text-subtle block">Punti</span>
                  <span className="font-mono-num text-xs font-bold text-white">
                    {p.totalPoints.toLocaleString('it-IT')}
                  </span>
                </div>
                <div className="px-1">
                  <span className="text-[10px] uppercase tracking-wider club-text-subtle block">Burrachi</span>
                  <span className="font-mono-num text-xs font-bold text-white">
                    {p.totalBurrachi} <span className="text-[10px] font-normal club-text-subtle">({p.cleanBurrachi}P)</span>
                  </span>
                </div>
                <div className="px-1">
                  <span className="text-[10px] uppercase tracking-wider club-text-subtle block">Vittorie</span>
                  <span className="font-mono-num text-xs font-bold club-text-gold">
                    {p.winRate}% <span className="text-[10px] font-normal club-text-subtle">({p.gamesWon}/{p.gamesPlayed})</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {sortedFriendsStats.length <= 1 && (
          <div className="p-4 rounded-2xl club-inset border club-divider text-center space-y-1.5">
            <p className="text-xs club-text-gold font-bold m-0 flex items-center justify-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>Espandi il tuo Burraco Club</span>
            </p>
            <p className="text-xs club-text-subtle m-0 leading-relaxed">
              Aggiungi amici con account Google nella scheda <strong className="text-white">Amici</strong> per sfidarli e scalare insieme la classifica.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
