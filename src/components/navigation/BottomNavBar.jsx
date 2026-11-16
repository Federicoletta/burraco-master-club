import React from 'react';
import {
  Users,
  Trophy,
  History,
  User
} from 'lucide-react';

/**
 * BottomNavBar - Dock di navigazione inferiore ergonomico, adattivo su tutti i 4 panni
 */
export default function BottomNavBar({
  activeTab = 'table',
  onSelectTab,
  hasActiveGame = false,
  hasActiveTournament = false,
  currentUser = null,
  notificationCount = 0,
  onlineFriendsCount = 0
}) {
  const tabs = [
    {
      id: 'table',
      label: hasActiveGame ? 'Partita' : 'Tavolo',
      icon: Users,
      indicator: hasActiveGame ? 'emerald' : null
    },
    {
      id: 'tournament',
      label: 'Torneo',
      icon: Trophy,
      indicator: hasActiveTournament ? 'gold' : null
    },
    {
      id: 'history',
      label: 'Storico',
      icon: History,
      indicator: null
    },
    {
      id: 'profile',
      label: currentUser ? (currentUser.displayName?.split(' ')[0] || 'Profilo') : 'Accedi',
      icon: User,
      customAvatar: currentUser?.photoURL ? (
        <img
          src={currentUser.photoURL}
          alt={currentUser.displayName || 'Avatar'}
          className="w-5 h-5 rounded-full object-cover border border-amber-400/80 shrink-0"
        />
      ) : null,
      countBadge: notificationCount > 0 ? notificationCount : null,
      indicator: notificationCount === 0 && onlineFriendsCount > 0 ? 'emerald' : null
    }
  ];

  return (
    <nav
      aria-label="Navigazione Principale"
      className="fixed left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.25rem)] max-w-md sm:max-w-lg select-none pointer-events-auto"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.65rem)'
      }}
    >
      <div className="p-1.5 rounded-2xl club-dock flex items-center justify-around gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab && onSelectTab(tab.id)}
              className={`relative flex-1 min-h-[46px] py-1.5 px-2 rounded-xl transition-all duration-150 flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                isActive
                  ? 'gold-gradient font-bold shadow-sm'
                  : 'club-text-muted hover:text-white hover:bg-white/5 active:scale-95'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {tab.customAvatar && !isActive ? (
                  tab.customAvatar
                ) : (
                  <IconComponent className={`w-[18px] h-[18px] sm:w-5 sm:h-5 ${isActive ? 'stroke-[2.4px]' : 'stroke-[1.9px]'}`} />
                )}

                {tab.countBadge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold tabular-nums flex items-center justify-center shadow-sm">
                    {tab.countBadge}
                  </span>
                )}

                {!tab.countBadge && tab.indicator && !isActive && (
                  <span
                    className={`absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full ring-2 ring-black/40 ${
                      tab.indicator === 'gold' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                )}
              </div>

              <span className={`text-[11px] truncate leading-tight tracking-tight ${
                isActive ? 'font-bold' : 'font-medium'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
