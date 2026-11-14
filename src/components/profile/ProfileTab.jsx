import React from 'react';
import { Mail, ShieldCheck, Award, CheckCircle2, Lock, Flame } from 'lucide-react';
import DeveloperBadge, { isDeveloperAccount } from '../DeveloperBadge';
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
  wonCount = 0,
  winRate = 0,
  totalScore = 0,
  totalBurrachi = 0,
  cleanBurrachi = 0,
  semiCleanBurrachi = 0,
  dirtyBurrachi = 0,
  closures = 0,
  bestHandScore = 0,
  avgPointsPerHand = 0,
  scoresHistory = []
}) {
  const playerTitle = myTrophiesData?.titleInfo?.title || 'Maestro del Pozzetto';
  const playerIcon = myTrophiesData?.titleInfo?.icon || '🏆';

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      
      {/* 1. HERO CARD GIOCATORE (Luxury Dark Felt & Gold Accents) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-emerald-900/80 to-emerald-950/90 border border-amber-500/40 shadow-xl flex items-center gap-3.5 relative overflow-hidden">
        {/* Glow decorativo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 blur-2xl pointer-events-none rounded-full" />
        
        {/* Avatar Utente con cornice dorata */}
        <div className="relative shrink-0">
          {userPhoto ? (
            <img 
              src={userPhoto} 
              alt={userDisplayName} 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-amber-400 shadow-lg object-cover ring-2 ring-amber-400/20" 
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full gold-gradient text-emerald-950 font-black text-xl flex items-center justify-center border-2 border-amber-400 shadow-lg">
              {userDisplayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          {isDeveloperAccount(currentUser) && (
            <span className="absolute -bottom-1 -right-1 text-xs bg-emerald-950 rounded-full p-0.5 border border-amber-400">
              👑
            </span>
          )}
        </div>
        
        {/* Dettagli Giocatore */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-base sm:text-lg font-black text-white m-0 truncate">
              {userDisplayName}
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-300 border border-emerald-500/40">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Google Verificato</span>
            </span>
          </div>

          {/* Titolo Onorifico & Badge Vittorie */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/50 flex items-center gap-1 shadow-sm">
              <span>{playerIcon}</span>
              <span>{playerTitle}</span>
            </span>

            <span className="px-2.5 py-0.5 rounded-lg text-xs font-black gold-gradient text-emerald-950 shadow-sm flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-emerald-950 fill-current" />
              <span>{winRate}% Vittorie ({gamesCount} Partite)</span>
            </span>
          </div>

          {/* Email e Amici Online */}
          <div className="flex items-center justify-between gap-2 mt-1.5 text-[11px] text-emerald-300/80">
            <span className="truncate flex items-center gap-1">
              <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">{userEmail}</span>
            </span>
            {onlineCount > 0 && (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-300 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {onlineCount} {onlineCount === 1 ? 'amico online' : 'amici online'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. LE 3 METRICHE CHIAVE SINTETICHE */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-center shadow-inner">
          <span className="text-[10px] uppercase font-bold text-emerald-400/80 block">Punti Totali</span>
          <span className="text-sm sm:text-base font-black text-amber-300">
            {totalScore.toLocaleString('it-IT')} pt
          </span>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-center shadow-inner">
          <span className="text-[10px] uppercase font-bold text-emerald-400/80 block">Media / Smazzata</span>
          <span className="text-sm sm:text-base font-black text-white">
            +{avgPointsPerHand} pt
          </span>
        </div>
        <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-center shadow-inner">
          <span className="text-[10px] uppercase font-bold text-emerald-400/80 block">Record Mano</span>
          <span className="text-sm sm:text-base font-black text-emerald-300">
            +{bestHandScore} pt
          </span>
        </div>
      </div>

      {/* 3. GRAFICI INTEGRATI: CURVA RENDIMENTO & CIAMBELLA BURRACHI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Curva Andamento Mani */}
        <TrendScoreChart scores={scoresHistory} playerName={userDisplayName} />
        
        {/* Donut Chart Distribuzione Burrachi */}
        <BurracoDonutChart 
          cleanCount={cleanBurrachi} 
          semiCleanCount={semiCleanBurrachi} 
          dirtyCount={dirtyBurrachi} 
          totalCount={totalBurrachi} 
        />
      </div>

      {/* 4. ANTEPRIMA RAPIDA TROFEI CONQUISTATI */}
      {myTrophiesData && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/90 via-emerald-900/60 to-amber-950/40 border border-amber-500/40 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-black text-amber-300 uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Bacheca Trofei & Obiettivi</span>
            </div>
            <span className="font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/40 text-[11px]">
              {myTrophiesData.unlockedCount} / {myTrophiesData.totalCount} ({myTrophiesData.percentTotal}%)
            </span>
          </div>

          {/* Barra Avanzamento Trofei */}
          <div className="h-2 w-full bg-emerald-950 rounded-full border border-emerald-800/60 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-500"
              style={{ width: `${myTrophiesData.percentTotal}%` }}
            />
          </div>

          {/* Griglia Trofei a Card Compatte */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5">
            {myTrophiesData.list.slice(0, 6).map(t => (
              <div 
                key={t.id}
                className={`p-2 rounded-xl border transition-all ${
                  t.unlocked
                    ? 'bg-emerald-900/70 border-amber-400/60 shadow-sm'
                    : 'bg-emerald-950/60 border-emerald-800/40 opacity-55'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-base">{t.icon}</span>
                  {t.unlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Lock className="w-3 h-3 text-zinc-400" />
                  )}
                </div>
                <div className="text-[11px] font-bold text-white truncate">{t.name}</div>
                <div className="text-[9px] text-emerald-300/70 truncate mt-0.5">
                  {t.unlocked ? '✓ Conquistato' : `${t.current} / ${t.target}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
