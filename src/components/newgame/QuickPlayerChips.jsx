import React from 'react';
import { Check, X } from 'lucide-react';

export default function QuickPlayerChips({
  currentUser,
  friendsList = [],
  mode = 'pairs',
  p1A = '',
  p1B = '',
  p2A = '',
  p2B = '',
  p3A = '',
  onTogglePlayer
}) {
  const hasGoogleSection = Boolean(currentUser || (friendsList && friendsList.length > 0));

  if (!hasGoogleSection) return null;

  // Determina dove è assegnato un giocatore
  const getAssignment = (name) => {
    if (!name) return null;
    const lower = name.trim().toLowerCase();
    if (p1A?.trim().toLowerCase() === lower || p1B?.trim().toLowerCase() === lower) {
      return { team: 1, label: mode === 'pairs' ? 'Coppia 1' : 'G1', color: 'amber' };
    }
    if (p2A?.trim().toLowerCase() === lower || p2B?.trim().toLowerCase() === lower) {
      return { team: 2, label: mode === 'pairs' ? 'Coppia 2' : 'G2', color: 'blue' };
    }
    if (p3A?.trim().toLowerCase() === lower) {
      return { team: 3, label: 'G3', color: 'rose' };
    }
    return null;
  };

  const myName = currentUser ? (currentUser.displayName || currentUser.email?.split('@')[0] || 'Tu').trim() : '';
  const myAssignment = getAssignment(myName);

  return (
    <div className="space-y-2 p-3 rounded-xl bg-black/30 border border-emerald-700/40">
      
      {/* Intestazione Assegnazione Rapida */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-amber-300 font-bold flex items-center gap-1.5">
          <span>🪑</span>
          <span>Tavolo Rapido (Tocca un amico per assegnarlo o rimuoverlo):</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1">
        
        {/* Chip Utente Attivo (Tu) */}
        {currentUser && (
          <button
            type="button"
            onClick={() => onTogglePlayer(myName)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 border ${
              myAssignment
                ? myAssignment.color === 'amber'
                  ? 'bg-amber-500/25 text-amber-200 border-amber-400 ring-1 ring-amber-400/50'
                  : 'bg-blue-500/25 text-blue-200 border-blue-400 ring-1 ring-blue-400/50'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-600/60 hover:border-emerald-400'
            }`}
            title={myAssignment ? `Assegnato a ${myAssignment.label}. Tocca per toglierti dal tavolo.` : 'Tocca per assegnarti al tavolo'}
          >
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="" className="w-5 h-5 rounded-full border border-emerald-400 object-cover" />
            ) : (
              <span className="w-5 h-5 rounded-full bg-emerald-400 text-emerald-950 font-black text-[10px] flex items-center justify-center">
                {(currentUser.displayName || 'T').slice(0, 1).toUpperCase()}
              </span>
            )}
            <span>{currentUser.displayName || 'Tu'} (Tu)</span>
            {myAssignment ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-white font-extrabold flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" />
                <span>{myAssignment.label}</span>
              </span>
            ) : (
              <span className="text-[11px] text-emerald-400/70 font-normal">+</span>
            )}
          </button>
        )}

        {/* Chips Amici (Amici Stretti ⭐ in evidenza) */}
        {(friendsList || []).map(f => {
          const friendName = (f.displayName || f.email || '').trim();
          if (!friendName) return null;
          const assignment = getAssignment(friendName);

          return (
            <button
              key={f.uid || f.email}
              type="button"
              onClick={() => onTogglePlayer(friendName)}
              className={`px-2.5 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 border ${
                assignment
                  ? assignment.color === 'amber'
                    ? 'bg-amber-500/25 text-amber-200 border-amber-400 font-bold ring-1 ring-amber-400/50'
                    : assignment.color === 'blue'
                    ? 'bg-blue-500/25 text-blue-200 border-blue-400 font-bold ring-1 ring-blue-400/50'
                    : 'bg-rose-500/25 text-rose-200 border-rose-400 font-bold ring-1 ring-rose-400/50'
                  : f.isCloseFriend
                  ? 'bg-emerald-950/80 text-amber-200 border-amber-400/60 hover:border-amber-400 hover:bg-emerald-900 font-semibold'
                  : 'bg-emerald-950/60 text-emerald-200/90 border-emerald-700/50 hover:border-emerald-500 hover:bg-emerald-900'
              }`}
              title={
                assignment
                  ? `Assegnato a ${assignment.label}. Tocca per togliere dal tavolo.`
                  : f.isCloseFriend
                  ? 'Amico Stretto ⭐ (entra subito senza invito). Tocca per assegnare.'
                  : 'Tocca per assegnare al tavolo'
              }
            >
              {f.photoURL ? (
                <img src={f.photoURL} alt="" className="w-5 h-5 rounded-full border border-amber-400 object-cover" />
              ) : (
                <span className="w-5 h-5 rounded-full bg-emerald-900 border border-amber-400 text-amber-300 font-black text-[10px] flex items-center justify-center">
                  {friendName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span>{friendName}</span>
              
              {f.isCloseFriend && !assignment && (
                <span className="text-amber-400 text-xs">⭐</span>
              )}

              {assignment ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-white font-extrabold flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" />
                  <span>{assignment.label}</span>
                </span>
              ) : (
                <span className="text-[11px] text-emerald-400/60 font-normal">+</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
