import React from 'react';
import { Mail, ShieldCheck, Award, CheckCircle2, Lock } from 'lucide-react';
import DeveloperBadge, { isDeveloperAccount } from '../DeveloperBadge';

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
}) {
  return (
    <div className="space-y-3.5 animate-in fade-in duration-150">
      {/* Scheda Utente con Avatar Google */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/80 border border-emerald-600/40 flex items-center gap-3.5 shadow-md">
        {userPhoto ? (
          <img 
            src={userPhoto} 
            alt={userDisplayName} 
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-amber-400 shadow-md shrink-0 object-cover" 
          />
        ) : (
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-900 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-bold text-lg sm:text-xl shrink-0 shadow-md">
            {userDisplayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm sm:text-base font-black text-white m-0 truncate">
              {userDisplayName}
            </h3>
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" title="Account Google Verificato" />
            {isDeveloperAccount(currentUser) && (
              <DeveloperBadge size="sm" />
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-emerald-300/80 truncate flex items-center gap-1 mt-0.5">
            <Mail className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{userEmail}</span>
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {isDeveloperAccount(currentUser) ? (
              <DeveloperBadge />
            ) : (
              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                Membro Ufficiale Club
              </span>
            )}
            {myTrophiesData?.titleInfo && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900/90 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <span>{myTrophiesData.titleInfo.icon}</span>
                <span>{myTrophiesData.titleInfo.title}</span>
              </span>
            )}
            {onlineCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {onlineCount} {onlineCount === 1 ? 'amico online' : 'amici online'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Statistiche Personali Rapide */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-center">
          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-400/80 block">Partite</span>
          <span className="text-base sm:text-lg font-black text-white">{gamesCount}</span>
        </div>
        <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-center">
          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-400/80 block">Vittorie</span>
          <span className="text-base sm:text-lg font-black text-amber-300">{wonCount} <small className="text-[10px] font-normal">({winRate}%)</small></span>
        </div>
        <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-center">
          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-400/80 block">Punti Totali</span>
          <span className="text-base sm:text-lg font-black text-emerald-200">{totalScore.toLocaleString('it-IT')}</span>
        </div>
      </div>

      {/* Burrachi, Chiusure e Record */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-center">
          <span className="text-[10px] font-bold text-amber-300/80 block">Burrachi</span>
          <span className="text-xs sm:text-sm font-black text-amber-200">{totalBurrachi}</span>
          <span className="text-[9px] text-emerald-300/60 block mt-0.5">
            {cleanBurrachi}P / {semiCleanBurrachi}S / {dirtyBurrachi}Sp
          </span>
        </div>
        <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-center">
          <span className="text-[10px] font-bold text-emerald-400/80 block">Chiusure</span>
          <span className="text-xs sm:text-sm font-black text-white">{closures}</span>
          <span className="text-[9px] text-emerald-300/60 block mt-0.5">volte</span>
        </div>
        <div className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 text-center">
          <span className="text-[10px] font-bold text-emerald-400/80 block">Record Mano</span>
          <span className="text-xs sm:text-sm font-black text-emerald-300">+{bestHandScore}</span>
          <span className="text-[9px] text-emerald-300/60 block mt-0.5">punti max</span>
        </div>
      </div>

      {/* BACHECA TROFEI PERSONALE */}
      {myTrophiesData && (
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/90 via-emerald-900/60 to-amber-950/40 border border-amber-500/40 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-400" />
              <span>I Tuoi Trofei Sbloccati</span>
            </div>
            <span className="text-xs font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/40">
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

          {/* Griglia Trofei */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {myTrophiesData.list.map(t => (
              <div 
                key={t.id}
                className={`p-2.5 rounded-xl border transition-all ${
                  t.unlocked
                    ? 'bg-emerald-900/70 border-amber-400/60 shadow-sm'
                    : 'bg-emerald-950/60 border-emerald-800/40 opacity-55'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-lg">{t.icon}</span>
                  {t.unlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Lock className="w-3 h-3 text-zinc-400" />
                  )}
                </div>
                <div className="text-xs font-bold text-white truncate">{t.name}</div>
                <div className="text-[10px] text-emerald-300/70 line-clamp-2 leading-tight mt-0.5">
                  {t.description}
                </div>
                <div className="text-[9px] font-mono font-bold mt-1.5 text-amber-300/90">
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