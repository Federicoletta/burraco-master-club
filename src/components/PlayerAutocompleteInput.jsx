import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Sparkles, Check, X } from 'lucide-react';

export default function PlayerAutocompleteInput({
  value = '',
  onChange,
  placeholder = 'Nome giocatore (opzionale)',
  currentUser = null,
  friendsList = [],
  availablePlayers = [],
  alreadySelected = [],
  className = '',
  onFocus,
  onClick,
  onBlur,
  autoFocus = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Chiusura al click esterno
  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, []);

  // Normalizza gli elementi già selezionati per confronto case-insensitive
  const selectedNormalized = useMemo(() => {
    return (alreadySelected || [])
      .map(s => (s || '').trim().toLowerCase())
      .filter(s => s && s !== value.trim().toLowerCase());
  }, [alreadySelected, value]);

  // Filtra e prepara i suggerimenti disponibili
  const suggestions = useMemo(() => {
    const query = (value || '').trim().toLowerCase();
    const results = [];
    const seenNames = new Set();

    // 0. Me stesso (Utente loggato con account Google) - Massima priorità in cima!
    if (currentUser) {
      const myName = (currentUser.displayName || currentUser.email?.split('@')[0] || 'Tu').trim();
      const myEmail = (currentUser.email || '').trim().toLowerCase();
      const isAlreadyPicked = selectedNormalized.includes(myName.toLowerCase());

      const matchesQuery = !query || 
        myName.toLowerCase().includes(query) || 
        myEmail.includes(query) || 
        query === 'tu' || 
        query === 'io' || 
        query === 'me';

      if (!isAlreadyPicked && matchesQuery) {
        results.push({
          type: 'me',
          name: myName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          uid: currentUser.uid,
          isMe: true
        });
        seenNames.add(myName.toLowerCase());
      }
    }

    // 1. Amici Google / Club
    (friendsList || []).forEach(f => {
      const name = (f.displayName || '').trim();
      const email = (f.email || '').trim().toLowerCase();
      if (!name && !email) return;
      if (seenNames.has(name.toLowerCase())) return;
      
      // Escludi se già selezionato in un altro slot
      if (selectedNormalized.includes(name.toLowerCase())) return;

      // Se vuoto: mostra tutti i disponibili
      const matches = !query || name.toLowerCase().includes(query) || email.includes(query);
      if (matches) {
        results.push({
          type: 'friend',
          name: name || email,
          email: f.email,
          photoURL: f.photoURL,
          uid: f.uid
        });
        seenNames.add((name || email).toLowerCase());
      }
    });

    // 2. Ospiti / Giocatori Locali
    (availablePlayers || []).forEach(pName => {
      const name = (pName || '').trim();
      if (!name) return;
      if (seenNames.has(name.toLowerCase())) return;
      if (selectedNormalized.includes(name.toLowerCase())) return;

      const matches = !query || name.toLowerCase().includes(query);
      if (matches) {
        results.push({
          type: 'guest',
          name,
          email: null,
          photoURL: null
        });
        seenNames.add(name.toLowerCase());
      }
    });

    return results;
  }, [value, currentUser, friendsList, availablePlayers, selectedNormalized]);

  const handleSelect = (item) => {
    onChange(item.name);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={(e) => {
          setIsOpen(true);
          if (onFocus) onFocus(e);
        }}
        onClick={(e) => {
          setIsOpen(true);
          if (onClick) onClick(e);
        }}
        onBlur={onBlur}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className={`${className} ${value ? 'pr-8' : ''}`}
        autoComplete="off"
      />

      {/* Tasto Cancella Testo */}
      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange('');
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-emerald-400/60 hover:text-white transition-colors cursor-pointer"
          title="Cancella"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Menù a tendina dei suggerimenti */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl bg-gradient-to-b from-emerald-950 via-zinc-950 to-emerald-950 border-2 border-amber-400/80 shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          
          <div className="px-2.5 py-1.5 bg-emerald-950/90 border-b border-emerald-800/60 flex items-center justify-between text-[10px] text-emerald-300/80 font-bold uppercase tracking-wider">
            <span>Scegli Compagno:</span>
            <span className="text-amber-400 font-semibold normal-case text-[10px]">
              {suggestions.length} {suggestions.length === 1 ? 'disponibile' : 'disponibili'}
            </span>
          </div>

          <div className="max-h-52 overflow-y-auto divide-y divide-emerald-800/40 p-1">
            {suggestions.map((item, idx) => {
              const isSelected = value.trim().toLowerCase() === item.name.toLowerCase();
              return (
                <button
                  key={`${item.type}_${item.name}_${idx}`}
                  type="button"
                  onPointerDown={(e) => {
                    // Previene perdita focus prima del click
                    e.preventDefault();
                    handleSelect(item);
                  }}
                  className={`w-full p-2 rounded-lg flex items-center justify-between gap-2.5 text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-amber-400/20 text-white' 
                      : 'hover:bg-emerald-900/60 text-emerald-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.type === 'me' ? (
                      item.photoURL ? (
                        <img
                          src={item.photoURL}
                          alt=""
                          className="w-7 h-7 rounded-full border-2 border-emerald-400 ring-2 ring-emerald-500/40 object-cover shrink-0 shadow-md"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-emerald-400 text-emerald-950 font-black text-xs flex items-center justify-center shrink-0 shadow-md ring-2 ring-emerald-500/40">
                          {item.name.slice(0, 1).toUpperCase()}
                        </div>
                      )
                    ) : item.type === 'friend' ? (
                      item.photoURL ? (
                        <img
                          src={item.photoURL}
                          alt=""
                          className="w-7 h-7 rounded-full border border-amber-400 object-cover shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-amber-400 text-emerald-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                          {item.name.slice(0, 1).toUpperCase()}
                        </div>
                      )
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-emerald-900 border border-emerald-700/80 text-emerald-300 flex items-center justify-center text-xs shrink-0 shadow-sm">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-white truncate max-w-[170px] sm:max-w-[220px]">
                          {item.name}
                        </span>
                        {item.type === 'me' ? (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 flex items-center gap-0.5 shrink-0">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Tu (Account)</span>
                          </span>
                        ) : item.type === 'friend' ? (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-0.5 shrink-0">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            <span>Amico Club</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 shrink-0">
                            Ospite
                          </span>
                        )}
                      </div>
                      {item.email && (
                        <div className="text-[10px] text-emerald-400/70 truncate">
                          {item.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-amber-400 stroke-[3] shrink-0" />
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
