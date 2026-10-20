import React from 'react';

export default function QuickPlayerChips({
  currentUser,
  friendsList = [],
  availablePlayers = [],
  onSelectPlayer
}) {
  const hasGoogleSection = Boolean(currentUser || (friendsList && friendsList.length > 0));
  const hasLocalSection = Boolean(availablePlayers && availablePlayers.length > 0);

  if (!hasGoogleSection && !hasLocalSection) return null;

  return (
    <div className="space-y-2">
      {/* 1. Tu & Amici Burraco Club con Account Google */}
      {hasGoogleSection && (
        <div className="text-xs">
          <span className="text-amber-300 font-bold mr-2 flex items-center gap-1 mb-1">
            <span>⭐ Amici Burraco Club (Google):</span>
          </span>
          <div className="inline-flex flex-wrap gap-1.5">
            {/* Chip Utente Attivo (Tu) */}
            {currentUser && (
              <button
                type="button"
                onClick={() => {
                  const myName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Tu';
                  onSelectPlayer(myName);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/90 text-emerald-200 border-2 border-emerald-400 text-[11px] font-bold hover:border-emerald-300 hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-4 h-4 rounded-full border border-emerald-400 object-cover" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-emerald-400 text-emerald-950 font-black text-[9px] flex items-center justify-center">
                    {(currentUser.displayName || 'T').slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span>{currentUser.displayName || 'Tu'} (Tu)</span>
              </button>
            )}

            {/* Chips Amici */}
            {(friendsList || []).map(f => {
              const friendName = f.displayName || f.email;
              return (
                <button
                  key={f.uid || f.email}
                  type="button"
                  onClick={() => onSelectPlayer(friendName)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/90 text-amber-200 border border-amber-400/50 text-[11px] font-semibold hover:border-amber-300 hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  {f.photoURL ? (
                    <img src={f.photoURL} alt="" className="w-4 h-4 rounded-full border border-amber-400 object-cover" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-amber-400 text-emerald-950 font-black text-[9px] flex items-center justify-center">
                      {friendName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span>{friendName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Giocatori Locali (Ospiti) */}
      {hasLocalSection && (
        <div className="text-xs">
          <span className="text-emerald-300/70 mr-2 block mb-1">Giocatori Locali (Ospiti):</span>
          <div className="inline-flex flex-wrap gap-1.5">
            {availablePlayers.slice(0, 12).map(name => (
              <button
                key={name}
                type="button"
                onClick={() => onSelectPlayer(name)}
                className="px-2 py-0.5 rounded-md bg-emerald-900/80 text-emerald-200 border border-emerald-700/40 text-[11px] hover:border-amber-400 hover:text-white transition-colors cursor-pointer"
              >
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
