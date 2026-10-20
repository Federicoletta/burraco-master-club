import React from 'react';
import { getPlayerTitle } from '../../utils/trophies';
import DeveloperBadge, { isDeveloperAccount } from '../DeveloperBadge';

export default function LeaderboardTab({
  rankingScope = 'friends',
  setRankingScope,
  sortBy = 'points',
  setSortBy,
  sortedFriendsStats = [],
  maxFriendsVal = 1,
  sortedLocalStats = [],
  maxLocalVal = 1,
  currentUser = null,
}) {
  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      
      {/* Selettore Ambito: ⭐ Amici Club (Cloud Live) vs 👥 Partecipanti Tavolo */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-emerald-950/90 border border-emerald-800/80 shadow-inner">
        <button
          type="button"
          onClick={() => setRankingScope('friends')}
          className={`min-h-[36px] py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] select-none ${
            rankingScope === 'friends'
              ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-emerald-950 shadow-md font-black'
              : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
          }`}
        >
          <span>⭐ Amici Club</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            rankingScope === 'friends' ? 'bg-emerald-950/30 text-emerald-950' : 'bg-emerald-900 text-emerald-300'
          }`}>
            {sortedFriendsStats.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setRankingScope('local')}
          className={`min-h-[36px] py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] select-none ${
            rankingScope === 'local'
              ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-emerald-950 shadow-md font-black'
              : 'text-emerald-300/80 hover:text-white hover:bg-emerald-900/40'
          }`}
        >
          <span>👥 Partecipanti Tavolo</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            rankingScope === 'local' ? 'bg-emerald-950/30 text-emerald-950' : 'bg-emerald-900 text-emerald-300'
          }`}>
            {sortedLocalStats.length}
          </span>
        </button>
      </div>

      {/* Selettore Metrica: Punti | Burrachi | % Vittorie */}
      <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-emerald-950/60 border border-emerald-800/50 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 pl-2 hidden xs:inline">
          Ordina per:
        </span>
        <div className="grid grid-cols-3 gap-1 flex-1">
          <button
            type="button"
            onClick={() => setSortBy('points')}
            className={`py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer text-center ${
              sortBy === 'points'
                ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                : 'text-emerald-200 hover:bg-emerald-900/60'
            }`}
          >
            🎯 Punti
          </button>
          <button
            type="button"
            onClick={() => setSortBy('burrachi')}
            className={`py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer text-center ${
              sortBy === 'burrachi'
                ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                : 'text-emerald-200 hover:bg-emerald-900/60'
            }`}
          >
            💎 Burrachi
          </button>
          <button
            type="button"
            onClick={() => setSortBy('winrate')}
            className={`py-1.5 px-2 rounded-lg font-bold text-xs transition-all cursor-pointer text-center ${
              sortBy === 'winrate'
                ? 'bg-amber-400 text-emerald-950 font-black shadow-xs'
                : 'text-emerald-200 hover:bg-emerald-900/60'
            }`}
          >
            🏆 Win Rate
          </button>
        </div>
      </div>

      {/* LISTA CLASSIFICA AMICI CLUB */}
      {rankingScope === 'friends' && (
        <div className="space-y-2.5">
          {sortedFriendsStats.map((p, index) => {
            const titleInfo = getPlayerTitle(p);
            let currentVal = p.totalPoints;
            let primaryText = `${p.totalPoints.toLocaleString('it-IT')} pt`;
            let subText = `record +${p.bestHandScore} pt`;

            if (sortBy === 'burrachi') {
              currentVal = p.totalBurrachi;
              primaryText = `${p.totalBurrachi} burrachi`;
              subText = `${p.cleanBurrachi}P • ${p.semiCleanBurrachi}S • ${p.dirtyBurrachi}I`;
            } else if (sortBy === 'winrate') {
              currentVal = p.winRate;
              primaryText = `${p.winRate}% vittorie`;
              subText = `${p.gamesWon}V / ${p.gamesLost}P (${p.gamesPlayed} tot)`;
            }

            const pct = currentVal > 0 && maxFriendsVal > 0 ? Math.round((currentVal / maxFriendsVal) * 100) : 0;

            return (
              <div 
                key={p.uid || p.name}
                className={`p-3 rounded-xl border transition-all space-y-2 shadow-sm ${
                  p.isMe
                    ? 'bg-gradient-to-r from-emerald-950/90 via-emerald-900/60 to-emerald-950/90 border-amber-500/60'
                    : 'bg-emerald-950/75 border-emerald-700/40 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Podio Rank Badge */}
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${
                      index === 0 
                        ? 'gold-gradient text-emerald-950 shadow-amber-500/20' 
                        : index === 1 
                        ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 font-bold' 
                        : index === 2 
                        ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 font-bold' 
                        : 'bg-emerald-900/80 border border-emerald-800 text-emerald-400 font-mono'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>

                    {/* Avatar con indicatore Online */}
                    <div className="relative shrink-0">
                      {p.photoURL ? (
                        <img 
                          src={p.photoURL} 
                          alt={p.name} 
                          className="w-8 h-8 rounded-full border border-amber-400/50 object-cover" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-800 border border-emerald-600 text-amber-300 font-bold flex items-center justify-center text-xs">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {p.isOnline && (
                        <span 
                          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-emerald-950" 
                          title="Online adesso"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-extrabold text-white m-0 truncate">
                          {p.displayName || p.name}
                        </h4>
                        {isDeveloperAccount(p, currentUser) && (
                          <DeveloperBadge size="xs" />
                        )}
                        {p.isMe && (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-emerald-950 font-black text-[9px]">
                            Tu
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-900/90 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                          <span>{titleInfo.icon}</span>
                          <span>{titleInfo.title}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-black text-amber-300">
                      {primaryText}
                    </div>
                    <div className="text-[10px] text-emerald-400/80">
                      {subText}
                    </div>
                  </div>
                </div>

                {/* Barra di Progressione */}
                <div className="h-1.5 w-full bg-emerald-950 rounded-full border border-emerald-800/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      index === 0
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                        : 'bg-gradient-to-r from-emerald-400 to-teal-300'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Chips Dettaglio */}
                <div className="flex flex-wrap items-center gap-1 text-[9px] pt-1 border-t border-emerald-900/60">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-200 border border-emerald-800/60">
                    🎯 <strong>{p.totalPoints.toLocaleString('it-IT')}</strong> pt
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-200 border border-emerald-800/60">
                    💎 <strong>{p.totalBurrachi}</strong> burr. ({p.cleanBurrachi}P · {p.semiCleanBurrachi}S · {p.dirtyBurrachi}I)
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-900/50 text-amber-300/90 border border-emerald-800/60">
                    🏆 <strong>{p.winRate}%</strong> ({p.gamesWon}V/{p.gamesLost}P)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LISTA CLASSIFICA PARTECIPANTI TAVOLO */}
      {rankingScope === 'local' && (
        <div>
          {sortedLocalStats.length === 0 ? (
            <div className="text-center py-10 text-emerald-300/70 text-xs">
              Nessuna partita registrata. Inizia una partita per vedere le statistiche dei partecipanti del tavolo!
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedLocalStats.map((p, index) => {
                const titleInfo = getPlayerTitle(p);
                let currentVal = p.totalPoints;
                let primaryText = `${p.totalPoints.toLocaleString('it-IT')} pt`;
                let subText = `med. ${p.avgPointsPerHand} pt/mano`;

                if (sortBy === 'burrachi') {
                  currentVal = p.totalBurrachi;
                  primaryText = `${p.totalBurrachi} burrachi`;
                  subText = `${p.cleanBurrachi}P • ${p.semiCleanBurrachi}S • ${p.dirtyBurrachi}I`;
                } else if (sortBy === 'winrate') {
                  currentVal = p.winRate;
                  primaryText = `${p.winRate}% vittorie`;
                  subText = `${p.gamesWon}V / ${p.gamesLost}P (${p.gamesPlayed} tot)`;
                }

                const pct = currentVal > 0 && maxLocalVal > 0 ? Math.round((currentVal / maxLocalVal) * 100) : 0;

                return (
                  <div 
                    key={p.name}
                    className="p-3 rounded-xl bg-emerald-950/75 border border-emerald-700/40 hover:border-amber-500/40 transition-all space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${
                          index === 0 
                            ? 'gold-gradient text-emerald-950 shadow-amber-500/20' 
                            : index === 1 
                            ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 font-bold' 
                            : index === 2 
                            ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 font-bold' 
                            : 'bg-emerald-900/80 border border-emerald-800 text-emerald-400 font-mono'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-extrabold text-white m-0 truncate">
                              {p.name}
                            </h4>
                            {isDeveloperAccount(p, currentUser) && (
                              <DeveloperBadge size="xs" />
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-900/90 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
                              <span>{titleInfo.icon}</span>
                              <span>{titleInfo.title}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs sm:text-sm font-black text-amber-300">
                          {primaryText}
                        </div>
                        <div className="text-[10px] text-emerald-400/80">
                          {subText}
                        </div>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-emerald-950 rounded-full border border-emerald-800/60 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          index === 0
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                            : 'bg-gradient-to-r from-emerald-400 to-teal-300'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}