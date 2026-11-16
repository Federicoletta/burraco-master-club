import React from 'react';
import { Mail, ShieldCheck, Award, CheckCircle2, Lock, Flame } from 'lucide-react';
import DeveloperBadge from '../DeveloperBadge';
import { isDeveloperAccount } from '../../utils/developer';
import TrendScoreChart from './TrendScoreChart';
import BurracoDonutChart from './BurracoDonutChart';

export default function ProfileTab({
  currentUser,
  userDisplayName,
  userEmail,
  userPhoto,
  onlineCount = 0,
  myTrophiesData,
  gamesCount = 0,
  winRate = 0,
  totalScore = 0,
  totalBurrachi = 0,
  cleanBurrachi = 0,
  semiCleanBurrachi = 0,
  dirtyBurrachi = 0,
  bestHandScore = 0,
  avgPointsPerHand = 0,
  scoresHistory = []
}) {
  const playerTitle = myTrophiesData?.titleInfo?.title || 'Maestro del Pozzetto';
  const playerIcon = myTrophiesData?.titleInfo?.icon || '🏆';

  return (
    <div className="space-y-4">
      {/* 1. HERO CARD GIOCATORE */}
      <div className="p-4 sm:p-5 rounded-2xl club-inset border club-border flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userDisplayName}
                className="w-16 h-16 rounded-full border-2 border-[var(--accent-gold)] shadow-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full gold-gradient font-display font-bold text-2xl flex items-center justify-center border-2 border-[var(--accent-gold)] shadow-lg">
                {userDisplayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            {isDeveloperAccount(currentUser) && (
              <span className="absolute -bottom-1 -right-1 text-xs bg-[var(--surface-card-solid)] rounded-full p-0.5 border border-[var(--accent-gold)]">
                👑
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-lg sm:text-xl font-bold text-white m-0 truncate">
                {userDisplayName}
              </h3>
              {isDeveloperAccount(currentUser) && <DeveloperBadge size="xs" />}
            </div>

            <div className="flex items-center gap-2 text-xs club-text-gold font-semibold">
              <span>{playerIcon}</span>
              <span className="truncate">{playerTitle}</span>
              <span className="club-text-subtle">•</span>
              <span className="inline-flex items-center gap-1 club-text-muted font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Verificato</span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs club-text-subtle pt-0.5">
              <span className="truncate flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{userEmail}</span>
              </span>
              {onlineCount > 0 && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{onlineCount} online</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Win rate summary pill on right/bottom */}
        <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l club-divider sm:pl-4 shrink-0">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold club-text-gold uppercase tracking-wider">
            <Flame className="w-4 h-4 shrink-0" />
            <span>Vittorie</span>
          </div>
          <div className="font-mono-num text-xl sm:text-2xl font-bold text-white">
            {winRate}% <span className="text-xs font-medium club-text-subtle">({gamesCount} pt)</span>
          </div>
        </div>
      </div>

      {/* 2. METRICHE CHIAVE SINTETICHE */}
      <div className="grid grid-cols-3 rounded-2xl club-inset border club-divider divide-x divide-[var(--border-subtle)] overflow-hidden">
        <div className="p-3 text-center">
          <span className="text-[11px] uppercase tracking-wider font-bold club-text-subtle block">
            Punti Totali
          </span>
          <span className="font-mono-num text-base sm:text-lg font-bold club-text-gold mt-0.5 block">
            {totalScore.toLocaleString('it-IT')}
          </span>
        </div>
        <div className="p-3 text-center">
          <span className="text-[11px] uppercase tracking-wider font-bold club-text-subtle block">
            Media / Mano
          </span>
          <span className="font-mono-num text-base sm:text-lg font-bold text-white mt-0.5 block">
            +{avgPointsPerHand}
          </span>
        </div>
        <div className="p-3 text-center">
          <span className="text-[11px] uppercase tracking-wider font-bold club-text-subtle block">
            Record Mano
          </span>
          <span className="font-mono-num text-base sm:text-lg font-bold text-emerald-300 mt-0.5 block">
            +{bestHandScore}
          </span>
        </div>
      </div>

      {/* 3. GRAFICI INTEGRATI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <TrendScoreChart scores={scoresHistory} playerName={userDisplayName} />
        <BurracoDonutChart
          cleanCount={cleanBurrachi}
          semiCleanCount={semiCleanBurrachi}
          dirtyCount={dirtyBurrachi}
          totalCount={totalBurrachi}
        />
      </div>

      {/* 4. BACHECA TROFEI */}
      {myTrophiesData && (
        <div className="p-4 rounded-2xl club-inset border club-border space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold club-text-gold uppercase tracking-wider">
              <Award className="w-4 h-4 shrink-0" />
              <span>Bacheca Trofei</span>
            </div>
            <span className="font-mono-num text-xs font-bold club-text-gold">
              {myTrophiesData.unlockedCount}/{myTrophiesData.totalCount} ({myTrophiesData.percentTotal}%)
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-black/35 border club-divider overflow-hidden">
            <div
              className="h-full gold-gradient transition-all duration-500"
              style={{ width: `${myTrophiesData.percentTotal}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-0.5">
            {myTrophiesData.list.slice(0, 6).map(t => (
              <div
                key={t.id}
                className={`p-3 rounded-xl border transition-all ${
                  t.unlocked
                    ? 'club-card border-[var(--border-hairline)]'
                    : 'bg-black/20 border-[var(--border-subtle)] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-lg leading-none">{t.icon}</span>
                  {t.unlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 club-text-subtle shrink-0" />
                  )}
                </div>
                <div className="text-xs font-bold text-white truncate">{t.title}</div>
                <div className="text-[11px] club-text-subtle truncate mt-0.5 font-mono-num">
                  {t.unlocked ? 'Conquistato' : (t.progressText || `${t.progress}/${t.max}`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
