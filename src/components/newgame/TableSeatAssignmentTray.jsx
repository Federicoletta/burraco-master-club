import React, { useState, useMemo } from 'react';
import { User, Plus, Check, Star, X } from 'lucide-react';
import { sound } from '../../utils/soundEffects';

export default function TableSeatAssignmentTray({
  activeSlot = 'p1A',
  mode = 'pairs',
  p1A = '',
  setP1A,
  p1B = '',
  setP1B,
  p2A = '',
  setP2A,
  p2B = '',
  setP2B,
  p3A = '',
  setP3A,
  currentUser = null,
  friendsList = [],
  storedPlayers = [],
  onAdvanceSlot
}) {
  const [typedName, setTypedName] = useState('');

  const slotMeta = useMemo(() => {
    switch (activeSlot) {
      case 'p1A':
        return {
          label: mode === 'pairs' ? 'Coppia 1 · Sud' : 'Giocatore 1',
          color: 'amber'
        };
      case 'p1B':
        return {
          label: 'Coppia 1 · Nord',
          color: 'amber'
        };
      case 'p2A':
        return {
          label: mode === 'pairs' ? 'Coppia 2 · Ovest' : 'Giocatore 2',
          color: 'blue'
        };
      case 'p2B':
        return {
          label: 'Coppia 2 · Est',
          color: 'blue'
        };
      case 'p3A':
        return {
          label: 'Giocatore 3 · Destra',
          color: 'rose'
        };
      default:
        return {
          label: 'Seleziona un posto',
          color: 'amber'
        };
    }
  }, [activeSlot, mode]);

  const getPlayerSeat = (name) => {
    if (!name) return null;
    const clean = name.trim().toLowerCase();
    if (p1A?.trim().toLowerCase() === clean) return { slot: 'p1A', team: 'C1', color: 'amber' };
    if (p1B?.trim().toLowerCase() === clean) return { slot: 'p1B', team: 'C1', color: 'amber' };
    if (p2A?.trim().toLowerCase() === clean) return { slot: 'p2A', team: mode === 'pairs' ? 'C2' : 'G2', color: 'blue' };
    if (p2B?.trim().toLowerCase() === clean) return { slot: 'p2B', team: 'C2', color: 'blue' };
    if (p3A?.trim().toLowerCase() === clean) return { slot: 'p3A', team: 'G3', color: 'rose' };
    return null;
  };

  const assignToActiveSlot = (name) => {
    if (!name) return;
    const cleanName = name.trim();
    if (!cleanName) return;

    try { sound.playCardDeal(); } catch {}

    const lower = cleanName.toLowerCase();
    if (p1A?.trim().toLowerCase() === lower && activeSlot !== 'p1A') setP1A('');
    if (p1B?.trim().toLowerCase() === lower && activeSlot !== 'p1B') setP1B('');
    if (p2A?.trim().toLowerCase() === lower && activeSlot !== 'p2A') setP2A('');
    if (p2B?.trim().toLowerCase() === lower && activeSlot !== 'p2B') setP2B('');
    if (p3A?.trim().toLowerCase() === lower && activeSlot !== 'p3A') setP3A('');

    switch (activeSlot) {
      case 'p1A': setP1A(cleanName); break;
      case 'p1B': setP1B(cleanName); break;
      case 'p2A': setP2A(cleanName); break;
      case 'p2B': setP2B(cleanName); break;
      case 'p3A': setP3A(cleanName); break;
      default: break;
    }

    setTypedName('');

    if (onAdvanceSlot) {
      onAdvanceSlot(activeSlot);
    }
  };

  const handleToggle = (name) => {
    const seat = getPlayerSeat(name);
    if (seat) {
      try { sound.playTap(); } catch {}
      switch (seat.slot) {
        case 'p1A': setP1A(''); break;
        case 'p1B': setP1B(''); break;
        case 'p2A': setP2A(''); break;
        case 'p2B': setP2B(''); break;
        case 'p3A': setP3A(''); break;
        default: break;
      }
    } else {
      assignToActiveSlot(name);
    }
  };

  const handleInputSubmit = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!typedName.trim()) return;
    assignToActiveSlot(typedName.trim());
  };

  const myName = currentUser ? (currentUser.displayName || currentUser.email?.split('@')[0] || 'Tu').trim() : '';
  const mySeat = getPlayerSeat(myName);

  const friendsClean = useMemo(() => {
    const list = [];
    const seen = new Set();
    if (myName) seen.add(myName.toLowerCase());

    (friendsList || []).forEach(f => {
      const name = (f.displayName || f.email?.split('@')[0] || '').trim();
      if (!name || seen.has(name.toLowerCase())) return;
      seen.add(name.toLowerCase());
      list.push({
        id: f.uid || f.id || `f_${name}`,
        name,
        photoURL: f.photoURL,
        isCloseFriend: Boolean(f.isCloseFriend)
      });
    });
    return list;
  }, [friendsList, myName]);

  const storedPlayersClean = useMemo(() => {
    const seen = new Set();
    if (myName) seen.add(myName.toLowerCase());
    friendsClean.forEach(f => seen.add(f.name.toLowerCase()));

    return (storedPlayers || [])
      .map(p => String(p).trim())
      .filter(p => p && !seen.has(p.toLowerCase()));
  }, [storedPlayers, myName, friendsClean]);

  const hasAnyChips = Boolean(myName || friendsClean.length > 0 || storedPlayersClean.length > 0);

  return (
    <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl club-inset border club-border">
      {/* Indicatore Posto Attivo */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)] shrink-0" />
        <span className="text-xs font-semibold club-text-muted">Assegna a:</span>
        <span
          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-lg ${
            slotMeta.color === 'amber'
              ? 'gold-gradient'
              : slotMeta.color === 'blue'
              ? 'bg-sky-400 text-slate-950'
              : 'bg-rose-400 text-slate-950'
          }`}
        >
          {slotMeta.label}
        </span>
      </div>

      {/* Campo Digitazione Veloce */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <User className="w-4 h-4 club-text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Digita nome giocatore..."
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleInputSubmit();
              }
            }}
            className="w-full min-h-[44px] pl-10 pr-9 rounded-xl club-input text-sm"
          />
          {typedName && (
            <button
              type="button"
              onClick={() => setTypedName('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center club-text-subtle hover:text-white cursor-pointer"
              aria-label="Cancella testo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleInputSubmit}
          disabled={!typedName.trim()}
          className={`min-h-[44px] px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            typedName.trim()
              ? 'gold-gradient active:scale-95'
              : 'club-btn-secondary club-text-subtle opacity-45 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Assegna</span>
        </button>
      </div>

      {/* Chip Rapidi Amici & Recenti */}
      {hasAnyChips && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-bold club-text-subtle uppercase tracking-wider">
            Tocca un nome per sedere
          </div>

          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
            {currentUser && (
              <button
                type="button"
                onClick={() => handleToggle(myName)}
                className={`min-h-[38px] px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                  mySeat
                    ? mySeat.color === 'amber'
                      ? 'gold-gradient border-[var(--accent-gold)]'
                      : 'bg-sky-400 text-slate-950 border-sky-300 font-black'
                    : 'club-btn-secondary'
                }`}
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-black/25 font-black text-[10px] flex items-center justify-center">
                    {(myName || 'T').slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span>{myName}</span>
                {mySeat && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold opacity-80">
                    <Check className="w-3 h-3" /> {mySeat.team}
                  </span>
                )}
              </button>
            )}

            {friendsClean.map(f => {
              const seat = getPlayerSeat(f.name);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleToggle(f.name)}
                  className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                    seat
                      ? seat.color === 'amber'
                        ? 'gold-gradient border-[var(--accent-gold)] font-bold'
                        : seat.color === 'rose'
                        ? 'bg-rose-400 text-slate-950 border-rose-300 font-bold'
                        : 'bg-sky-400 text-slate-950 border-sky-300 font-bold'
                      : 'club-btn-secondary'
                  }`}
                >
                  {f.photoURL ? (
                    <img src={f.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-black/25 font-bold text-[10px] flex items-center justify-center">
                      {f.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span>{f.name}</span>
                  {f.isCloseFriend && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                  {seat && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold opacity-80">
                      <Check className="w-3 h-3" /> {seat.team}
                    </span>
                  )}
                </button>
              );
            })}

            {storedPlayersClean.map(name => {
              const seat = getPlayerSeat(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleToggle(name)}
                  className={`min-h-[38px] px-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border ${
                    seat
                      ? seat.color === 'amber'
                        ? 'gold-gradient border-[var(--accent-gold)] font-bold'
                        : seat.color === 'rose'
                        ? 'bg-rose-400 text-slate-950 border-rose-300 font-bold'
                        : 'bg-sky-400 text-slate-950 border-sky-300 font-bold'
                      : 'club-btn-secondary'
                  }`}
                >
                  <span>{name}</span>
                  {seat && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold opacity-80">
                      <Check className="w-3 h-3" /> {seat.team}
                    </span>
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
