import React from 'react';
import { Plus } from 'lucide-react';

export default function QuickAssignRoster({
  onlineTablePlayers = [],
  otherFriends = [],
  assignedMap = {},
  onAssignPlayer
}) {
  return (
    <div className="space-y-2.5">
      {onlineTablePlayers.length > 0 && (
        <div className="p-3 rounded-2xl club-inset border club-border text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-xs">
            <span className="flex items-center gap-2 text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Al Tavolo ({onlineTablePlayers.length})</span>
            </span>
            <span className="text-[11px] club-text-subtle font-normal">Tocca per inserire</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {onlineTablePlayers.map(p => {
              const assignedTo = assignedMap[p.displayName.toLowerCase()];
              return (
                <button
                  key={p.uid || p.displayName}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onAssignPlayer(p.displayName)}
                  className={`min-h-[38px] px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    assignedTo ? 'club-btn-secondary' : 'gold-gradient'
                  }`}
                >
                  {p.photoURL ? (
                    <img src={p.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-black/25 font-black text-[10px] flex items-center justify-center">
                      {p.displayName.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span>{p.displayName}</span>
                  {assignedTo ? (
                    <span className="text-[10px] club-text-gold font-bold">({assignedTo})</span>
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {otherFriends.length > 0 && (
        <div className="p-3 rounded-2xl club-inset border club-divider text-xs space-y-2">
          <div className="club-text-gold font-bold text-xs">
            Amici Burraco Club
          </div>
          <div className="flex flex-wrap gap-2">
            {otherFriends.map(f => {
              const name = f.displayName || f.email;
              const assignedTo = assignedMap[name.toLowerCase()];
              return (
                <button
                  key={f.uid || name}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onAssignPlayer(name)}
                  className="min-h-[38px] px-3 rounded-xl club-btn-secondary text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {f.photoURL ? (
                    <img src={f.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <span className="w-5 h-5 rounded-full gold-gradient font-black text-[10px] flex items-center justify-center">
                      {name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span>{name}</span>
                  {assignedTo ? (
                    <span className="text-[10px] club-text-gold font-bold">({assignedTo})</span>
                  ) : (
                    <Plus className="w-3.5 h-3.5 club-text-gold" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
