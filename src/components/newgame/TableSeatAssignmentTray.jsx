import React, { useState, useMemo } from 'react';
import { User, Plus, Check, Star, Sparkles, X } from 'lucide-react';
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

  // Identifica lo slot attivo
  const slotMeta = useMemo(() => {
    switch (activeSlot) {
      case 'p1A':
        return {
          label: mode === 'pairs' ? 'Coppia 1 • Sud (Tu / Caposquadra)' : 'Giocatore 1 (Tu / Primo)',
          team: 'team1',
          badgeText: 'Coppia 1',
          color: 'amber'
        };
      case 'p1B':
        return {
          label: 'Coppia 1 • Nord (Compagno di Fronte)',
          team: 'team1',
          badgeText: 'Coppia 1',
          color: 'amber'
        };
      case 'p2A':
        return {
          label: mode === 'pairs' ? 'Coppia 2 • Ovest (Avversario Sinistra)' : 'Giocatore 2 (Avversario)',
          team: 'team2',
          badgeText: mode === 'pairs' ? 'Coppia 2' : 'Avversario',
          color: 'blue'
        };
      case 'p2B':
        return {
          label: 'Coppia 2 • Est (Avversario Destra)',
          team: 'team2',
          badgeText: 'Coppia 2',
          color: 'blue'
        };
      case 'p3A':
        return {
          label: 'Giocatore 3 • Destra',
          team: 'team3',
          badgeText: 'Giocatore 3',
          color: 'rose'
        };
      default:
        return {
          label: 'Seleziona un posto al tavolo',
          team: 'team1',
          badgeText: 'Tavolo',
          color: 'emerald'
        };
    }
  }, [activeSlot, mode]);

  // Controlla dove è seduto ciascun nome (case-insensitive)
  const getPlayerSeat = (name) => {
    if (!name) return null;
    const clean = name.trim().toLowerCase();
    if (p1A?.trim().toLowerCase() === clean) return { slot: 'p1A', team: 'Coppia 1', color: 'amber' };
    if (p1B?.trim().toLowerCase() === clean) return { slot: 'p1B', team: 'Coppia 1', color: 'amber' };
    if (p2A?.trim().toLowerCase() === clean) return { slot: 'p2A', team: mode === 'pairs' ? 'Coppia 2' : 'G2', color: 'blue' };
    if (p2B?.trim().toLowerCase() === clean) return { slot: 'p2B', team: 'Coppia 2', color: 'blue' };
    if (p3A?.trim().toLowerCase() === clean) return { slot: 'p3A', team: 'G3', color: 'rose' };
    return null;
  };

  // Assegna il giocatore allo slot attivo
  const assignToActiveSlot = (name) => {
    if (!name) return;
    const cleanName = name.trim();
    if (!cleanName) return;

    try { sound.playCardDeal(); } catch {}

    // Rimuovi prima se presente altrove
    const lower = cleanName.toLowerCase();
    if (p1A?.trim().toLowerCase() === lower && activeSlot !== 'p1A') setP1A('');
    if (p1B?.trim().toLowerCase() === lower && activeSlot !== 'p1B') setP1B('');
    if (p2A?.trim().toLowerCase() === lower && activeSlot !== 'p2A') setP2A('');
    if (p2B?.trim().toLowerCase() === lower && activeSlot !== 'p2B') setP2B('');
    if (p3A?.trim().toLowerCase() === lower && activeSlot !== 'p3A') setP3A('');

    // Assegna allo slot attivo
    switch (activeSlot) {
      case 'p1A': setP1A(cleanName); break;
      case 'p1B': setP1B(cleanName); break;
      case 'p2A': setP2A(cleanName); break;
      case 'p2B': setP2B(cleanName); break;
      case 'p3A': setP3A(cleanName); break;
      default: break;
    }

    setTypedName('');

    // Avanza automaticamente allo slot successivo
    if (onAdvanceSlot) {
      onAdvanceSlot(activeSlot);
    }
  };

  // Toggle giocatore (assegna o rimuovi)
  const handleToggle = (name) => {
    const seat = getPlayerSeat(name);
    if (seat) {
      // È già seduto: rimuovilo
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
      // Non è seduto: assegna allo slot attivo!
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

  // Amici del Club esclusi me stesso
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

  // Giocatori recenti memorizzati (esclusi me e gli amici già presenti)
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
    <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-[#0b2819] to-[#071c11] border border-amber-500/30 shadow-lg">
      
      {/* 1. Barra Indicatore Posto Attivo */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
          </span>
          <span className="text-xs font-bold text-emerald-200">
            Assegna posto:
          </span>
          <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg shadow-xs ${
            slotMeta.color === 'amber' 
              ? 'bg-amber-400 text-emerald-950 border border-amber-300' 
              : slotMeta.color === 'blue'
              ? 'bg-sky-400 text-slate-950 border border-sky-300'
              : 'bg-rose-400 text-slate-950 border border-rose-300'
          }`}>
            {slotMeta.label}
          </span>
        </div>
      </div>

      {/* 2. Campo Digitazione Veloce con Tasto Invio / + */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Digita nome giocatore o tocca un chip sotto..."
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleInputSubmit();
              }
            }}
            className="w-full px-3.5 py-2 pl-9 rounded-xl bg-[#071d12] border border-emerald-600/70 text-white text-xs sm:text-sm placeholder-emerald-400/50 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner"
          />
          <User className="w-4 h-4 text-emerald-400/60 absolute left-3 top-2.5 pointer-events-none" />
          {typedName && (
            <button
              type="button"
              onClick={() => setTypedName('')}
              className="absolute right-2.5 top-2.5 text-emerald-400/60 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleInputSubmit}
          disabled={!typedName.trim()}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
            typedName.trim()
              ? 'gold-gradient text-emerald-950 active:scale-95 hover:brightness-110'
              : 'bg-emerald-950/60 text-emerald-400/40 border border-emerald-800/40 cursor-not-allowed'
          }`}
          title="Assegna al posto attivo"
        >
          <Plus className="w-4 h-4 text-emerald-950" />
          <span>Assegna</span>
        </button>
      </div>

      {/* 3. Chip Rapidi (Tu, Amici Club, Giocatori Recenti) */}
      {hasAnyChips && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tocca un amico per farlo sedere:</span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            
            {/* Chip TU (Account Attivo) */}
            {currentUser && (
              <button
                type="button"
                onClick={() => handleToggle(myName)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border ${
                  mySeat
                    ? mySeat.color === 'amber'
                      ? 'bg-amber-400 text-emerald-950 border-amber-300 font-black shadow-sm'
                      : 'bg-sky-400 text-slate-950 border-sky-300 font-black shadow-sm'
                    : 'bg-[#0a2618] hover:bg-[#113a25] text-emerald-200 border-emerald-600/70 hover:border-amber-400'
                }`}
                title={mySeat ? `Seduto in ${mySeat.team}. Tocca per liberare.` : 'Siediti al tavolo'}
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-5 h-5 rounded-full border border-emerald-400 object-cover" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-emerald-400 text-emerald-950 font-black text-[10px] flex items-center justify-center">
                    {(myName || 'T').slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span>{myName} (Tu)</span>
                {mySeat ? (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-white font-extrabold flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" />
                    <span>{mySeat.team}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-bold">+ Siediti</span>
                )}
              </button>
            )}

            {/* Chips Amici Club */}
            {friendsClean.map(f => {
              const seat = getPlayerSeat(f.name);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleToggle(f.name)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border ${
                    seat
                      ? seat.color === 'amber'
                        ? 'bg-amber-400 text-emerald-950 border-amber-300 font-black shadow-sm'
                        : 'bg-sky-400 text-slate-950 border-sky-300 font-black shadow-sm'
                      : 'bg-[#0a2618] hover:bg-[#113a25] text-emerald-200 border-emerald-600/70 hover:border-emerald-400'
                  }`}
                  title={seat ? `Seduto in ${seat.team}. Tocca per liberare.` : `Assegna ${f.name} al tavolo`}
                >
                  {f.photoURL ? (
                    <img src={f.photoURL} alt="" className="w-5 h-5 rounded-full object-cover border border-emerald-500/40" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-emerald-800 text-emerald-200 font-bold text-[10px] flex items-center justify-center">
                      {f.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span>{f.name}</span>
                  {f.isCloseFriend && <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                  {seat ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-white font-extrabold flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" />
                      <span>{seat.team}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-400/70 font-bold">+</span>
                  )}
                </button>
              );
            })}

            {/* Chips Giocatori Recenti Locali */}
            {storedPlayersClean.map(name => {
              const seat = getPlayerSeat(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleToggle(name)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border ${
                    seat
                      ? seat.color === 'amber'
                        ? 'bg-amber-400 text-emerald-950 border-amber-300 font-black shadow-sm'
                        : 'bg-sky-400 text-slate-950 border-sky-300 font-black shadow-sm'
                      : 'bg-[#0a2618] hover:bg-[#113a25] text-emerald-300 border-emerald-700/50 hover:border-emerald-400'
                  }`}
                  title={seat ? `Seduto in ${seat.team}. Tocca per liberare.` : `Assegna ${name} al tavolo`}
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-900 text-emerald-300 font-bold text-[10px] flex items-center justify-center">
                    {name.slice(0, 1).toUpperCase()}
                  </span>
                  <span>{name}</span>
                  {seat ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 text-white font-extrabold flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" />
                      <span>{seat.team}</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-400/70 font-bold">+</span>
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
