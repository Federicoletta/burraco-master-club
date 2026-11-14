import React from 'react';
import { 
  Users, 
  Trophy, 
  History, 
  User, 
  Flame,
  Bell
} from 'lucide-react';

/**
 * BottomNavBar - Dock di navigazione inferiore moderno, flottante ad effetto vetro (Glassmorphism)
 * Ottimizzato sia per mobile con una mano sia per tablet/iPad.
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
      badge: hasActiveGame ? (
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-950" />
      ) : null
    },
    {
      id: 'tournament',
      label: 'Torneo',
      icon: Trophy,
      badge: hasActiveTournament ? (
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ring-2 ring-emerald-950" />
      ) : null
    },
    {
      id: 'history',
      label: 'Storico',
      icon: History,
      badge: null
    },
    {
      id: 'profile',
      label: currentUser ? (currentUser.displayName?.split(' ')[0] || 'Profilo') : 'Accedi',
      icon: User,
      customAvatar: currentUser?.photoURL ? (
        <img 
          src={currentUser.photoURL} 
          alt={currentUser.displayName || 'Avatar'} 
          className="w-5 h-5 rounded-full object-cover border border-amber-400 shrink-0" 
        />
      ) : null,
      badge: notificationCount > 0 ? (
        <span className="min-w-[15px] h-[15px] px-1 rounded-full bg-amber-400 text-emerald-950 text-[9px] font-black flex items-center justify-center border border-emerald-950">
          {notificationCount}
        </span>
      ) : onlineFriendsCount > 0 ? (
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-950" />
      ) : null
    }
  ];

  return (
    <nav 
      aria-label="Navigazione Principale"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.25rem)] max-w-md sm:max-w-lg select-none pointer-events-auto"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)'
      }}
    >
      <div className="p-1.5 sm:p-2 rounded-2xl bg-emerald-950/90 backdrop-blur-xl border border-emerald-500/40 shadow-2xl shadow-emerald-950/80 flex items-center justify-around gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab && onSelectTab(tab.id)}
              className={`relative flex-1 py-1.5 sm:py-2 px-2 rounded-xl transition-all duration-150 flex flex-col items-center justify-center gap-0.5 cursor-pointer touch-manipulation ${
                isActive
                  ? 'gold-gradient text-emerald-950 font-black shadow-md shadow-amber-400/25 scale-[1.02]'
                  : 'text-emerald-300/75 hover:text-white hover:bg-emerald-900/50 active:scale-95'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {tab.customAvatar && !isActive ? (
                  tab.customAvatar
                ) : (
                  <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                )}

                {/* Badge di notifica o stato attivo */}
                {tab.badge && (
                  <span className="absolute -top-1 -right-2">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className={`text-[10px] sm:text-[11px] truncate leading-tight tracking-wide ${
                isActive ? 'font-black' : 'font-medium'
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
