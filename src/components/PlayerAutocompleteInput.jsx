import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, X } from 'lucide-react';

export default function PlayerAutocompleteInput({
  value = '',
  onChange,
  placeholder = 'Nome giocatore (opzionale)',
  currentUser = null,
  friendsList = [],
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

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, []);

  const selectedNormalized = useMemo(() => {
    return (alreadySelected || [])
      .map(s => (s || '').trim().toLowerCase())
      .filter(s => s && s !== value.trim().toLowerCase());
  }, [alreadySelected, value]);

  const suggestions = useMemo(() => {
    const query = (value || '').trim().toLowerCase();
    const results = [];
    const seenNames = new Set();

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

    (friendsList || []).forEach(f => {
      const name = (f.displayName || '').trim();
      const email = (f.email || '').trim().toLowerCase();
      if (!name && !email) return;
      if (seenNames.has(name.toLowerCase())) return;
      if (selectedNormalized.includes(name.toLowerCase())) return;

      const matches = !query || name.toLowerCase().includes(query) || email.includes(query);
      if (matches) {
        results.push({
          type: 'friend',
          name: name || email,
          email: f.email,
          photoURL: f.photoURL,
          uid: f.uid,
          isCloseFriend: Boolean(f.isCloseFriend)
        });
        seenNames.add((name || email).toLowerCase());
      }
    });

    return results;
  }, [value, currentUser, friendsList, selectedNormalized]);

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

      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange('');
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 club-text-subtle hover:text-white transition-colors cursor-pointer"
          title="Cancella"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {isOpen && suggestions.length > 0 && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl club-card-solid border-amber-400/60 overflow-hidden"
        >
          <div className="px-3 py-1.5 border-b club-divider flex items-center justify-between text-[11px] club-text-muted font-semibold">
            <span>Amici disponibili</span>
            <span className="font-mono-num club-text-gold">{suggestions.length}</span>
          </div>

          <div
            className="max-h-52 overflow-y-auto divide-y club-divider p-1 touch-pan-y overscroll-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {suggestions.map((item, idx) => {
              const isSelected = value.trim().toLowerCase() === item.name.toLowerCase();
              return (
                <button
                  key={`${item.type}_${item.name}_${idx}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full min-h-[44px] p-2 rounded-xl flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400/15 text-white'
                      : 'hover:bg-white/5 text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.photoURL ? (
                      <img
                        src={item.photoURL}
                        alt=""
                        className="w-7 h-7 rounded-full border border-amber-400/70 object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full gold-gradient font-bold text-xs flex items-center justify-center shrink-0">
                        {item.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-xs text-white truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] club-text-gold font-medium shrink-0">
                          {item.type === 'me'
                            ? '· Tu'
                            : item.isCloseFriend
                              ? '· ★ Stretto'
                              : ''}
                        </span>
                      </div>
                      {item.email && (
                        <div className="text-[11px] club-text-subtle truncate">
                          {item.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 club-text-gold shrink-0" />
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
