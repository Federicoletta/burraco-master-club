import React, { useState, useMemo } from 'react';
import { X, Users, ArrowLeftRight, Check, AlertCircle } from 'lucide-react';
import { useAlert } from '../context/confirmContextStore';
import { useModalEscape } from '../hooks/useModalEscape';
import TeamFormCard from './teams/TeamFormCard';
import QuickAssignRoster from './teams/QuickAssignRoster';

function getInitialTargetField(activeGame, isPairs) {
  if (!activeGame.team1?.players?.[0]) return 't1P1';
  if (isPairs && !activeGame.team1?.players?.[1]) return 't1P2';
  if (!activeGame.team2?.players?.[0]) return 't2P1';
  if (isPairs && !activeGame.team2?.players?.[1]) return 't2P2';
  return 't1P1';
}

function EditTeamsModalContent({
  onClose,
  activeGame,
  tablePlayers = [],
  currentUser = null,
  friendsList = [],
  onSave
}) {
  const isTrio = activeGame?.mode === 'trio';
  const isPairs = !isTrio && (activeGame?.mode === 'pairs' || ((activeGame?.team1?.players?.length || 0) > 1));

  const [t1Name, setT1Name] = useState(() => activeGame.team1?.name || (isTrio ? 'Giocatore 1' : 'Coppia 1'));
  const [t1P1, setT1P1] = useState(() => activeGame.team1?.players?.[0] || '');
  const [t1P2, setT1P2] = useState(() => activeGame.team1?.players?.[1] || '');

  const [t2Name, setT2Name] = useState(() => activeGame.team2?.name || (isTrio ? 'Giocatore 2' : 'Coppia 2'));
  const [t2P1, setT2P1] = useState(() => activeGame.team2?.players?.[0] || '');
  const [t2P2, setT2P2] = useState(() => activeGame.team2?.players?.[1] || '');

  const [t3Name, setT3Name] = useState(() => (isTrio ? (activeGame.team3?.name || 'Giocatore 3') : ''));
  const [t3P1, setT3P1] = useState(() => (isTrio ? (activeGame.team3?.players?.[0] || '') : ''));

  const [activeTargetField, setActiveTargetField] = useState(() => getInitialTargetField(activeGame, isPairs));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const customAlert = useAlert();

  const onlineTablePlayers = useMemo(() => {
    const list = [];
    const seenEmails = new Set();
    const seenNames = new Set();

    if (currentUser) {
      const myName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Tu';
      list.push({
        uid: currentUser.uid,
        displayName: myName,
        email: currentUser.email || '',
        photoURL: currentUser.photoURL,
        isMe: true
      });
      if (currentUser.email) seenEmails.add(currentUser.email.toLowerCase());
      seenNames.add(myName.toLowerCase());
    }

    if (Array.isArray(tablePlayers)) {
      tablePlayers.forEach(p => {
        const pEmail = (p.email || '').toLowerCase();
        const pName = p.displayName || (p.email ? p.email.split('@')[0] : 'Giocatore');
        if (pEmail && seenEmails.has(pEmail)) return;
        if (seenNames.has(pName.toLowerCase())) return;
        const isMe = currentUser && (p.uid === currentUser.uid || (pEmail && pEmail === currentUser.email?.toLowerCase()));
        list.push({
          uid: p.uid,
          displayName: pName,
          email: pEmail,
          photoURL: p.photoURL,
          isMe
        });
        if (pEmail) seenEmails.add(pEmail);
        seenNames.add(pName.toLowerCase());
      });
    }

    if (activeGame?.ownerName || activeGame?.ownerEmail) {
      const oName = activeGame.ownerName || activeGame.ownerEmail?.split('@')[0];
      const oEmail = (activeGame.ownerEmail || '').toLowerCase();
      if ((!oEmail || !seenEmails.has(oEmail)) && !seenNames.has(oName.toLowerCase())) {
        list.push({
          uid: activeGame.ownerUid,
          displayName: oName,
          email: oEmail,
          photoURL: null,
          isMe: currentUser && oEmail === currentUser.email?.toLowerCase()
        });
      }
    }

    return list;
  }, [tablePlayers, currentUser, activeGame]);

  const otherFriends = useMemo(() => {
    const onlineNames = new Set(onlineTablePlayers.map(p => p.displayName.toLowerCase()));
    return (friendsList || []).filter(f => {
      const name = (f.displayName || f.email?.split('@')[0] || '').toLowerCase();
      return name && !onlineNames.has(name);
    });
  }, [friendsList, onlineTablePlayers]);

  const allKnownPlayerNames = useMemo(() => {
    const set = new Set();
    onlineTablePlayers.forEach(p => set.add(p.displayName));
    otherFriends.forEach(f => set.add(f.displayName || f.email));
    return Array.from(set).filter(Boolean);
  }, [onlineTablePlayers, otherFriends]);

  const assignedMap = useMemo(() => {
    const map = {};
    if (t1P1.trim()) map[t1P1.trim().toLowerCase()] = 'Sq. 1';
    if (t1P2.trim()) map[t1P2.trim().toLowerCase()] = 'Sq. 1';
    if (t2P1.trim()) map[t2P1.trim().toLowerCase()] = 'Sq. 2';
    if (t2P2.trim()) map[t2P2.trim().toLowerCase()] = 'Sq. 2';
    if (t3P1.trim()) map[t3P1.trim().toLowerCase()] = 'Sq. 3';
    return map;
  }, [t1P1, t1P2, t2P1, t2P2, t3P1]);

  const handleSwapTeams = () => {
    setT1Name(t2Name);
    setT2Name(t1Name);
    setT1P1(t2P1);
    setT2P1(t1P1);
    setT1P2(t2P2);
    setT2P2(t1P2);
  };

  const handleSwapPartners = () => {
    const temp = t1P2;
    setT1P2(t2P2);
    setT2P2(temp);
  };

  const handleRotateTrio = () => {
    const n1 = t1Name, p1 = t1P1;
    setT1Name(t3Name); setT1P1(t3P1);
    setT3Name(t2Name); setT3P1(t2P1);
    setT2Name(n1); setT2P1(p1);
  };

  const handleAutoNameTeam = (teamIndex) => {
    if (teamIndex === 1) {
      const p = [t1P1.trim(), isPairs ? t1P2.trim() : null].filter(Boolean);
      if (p.length > 0) setT1Name(p.join(' & '));
    } else if (teamIndex === 2) {
      const p = [t2P1.trim(), isPairs ? t2P2.trim() : null].filter(Boolean);
      if (p.length > 0) setT2Name(p.join(' & '));
    } else if (teamIndex === 3) {
      if (t3P1.trim()) setT3Name(t3P1.trim());
    }
  };

  const handleAssignPlayer = (playerName) => {
    if (!playerName) return;

    if (activeTargetField === 't1P1') {
      setT1P1(playerName);
      setActiveTargetField(isPairs ? 't1P2' : 't2P1');
    } else if (activeTargetField === 't1P2') {
      setT1P2(playerName);
      setActiveTargetField('t2P1');
    } else if (activeTargetField === 't2P1') {
      setT2P1(playerName);
      setActiveTargetField(isPairs ? 't2P2' : (isTrio ? 't3P1' : 't1P1'));
    } else if (activeTargetField === 't2P2') {
      setT2P2(playerName);
      setActiveTargetField(isTrio ? 't3P1' : 't1P1');
    } else if (activeTargetField === 't3P1') {
      setT3P1(playerName);
      setActiveTargetField('t1P1');
    } else {
      setT1P1(playerName);
      setActiveTargetField('t1P2');
    }
  };

  const getTargetFieldLabel = () => {
    switch (activeTargetField) {
      case 't1P1': return 'Squadra 1 · Giocatore 1';
      case 't1P2': return 'Squadra 1 · Giocatore 2';
      case 't2P1': return 'Squadra 2 · Giocatore 1';
      case 't2P2': return 'Squadra 2 · Giocatore 2';
      case 't3P1': return 'Giocatore 3';
      default: return 'Seleziona una postazione';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const p1 = [t1P1.trim(), isPairs ? t1P2.trim() : null].filter(Boolean);
    const p2 = [t2P1.trim(), isPairs ? t2P2.trim() : null].filter(Boolean);
    const p3 = isTrio ? [t3P1.trim()].filter(Boolean) : [];

    const finalT1Name = t1Name.trim() || (p1.length > 0 ? (isPairs ? p1.join(' & ') : p1[0]) : (activeGame.team1?.name || 'Coppia 1'));
    const finalT2Name = t2Name.trim() || (p2.length > 0 ? (isPairs ? p2.join(' & ') : p2[0]) : (activeGame.team2?.name || 'Coppia 2'));
    const finalT3Name = isTrio ? (t3Name.trim() || (p3.length > 0 ? p3[0] : (activeGame.team3?.name || 'Giocatore 3'))) : '';

    if (!finalT1Name || !finalT2Name || (isTrio && !finalT3Name)) {
      customAlert({
        title: 'Nome o Giocatori Mancanti',
        message: 'Inserisci un nome squadra o almeno un giocatore per ciascuna postazione.',
        variant: 'warning'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedTeam1 = { ...activeGame.team1, name: finalT1Name, players: p1 };
      const updatedTeam2 = { ...activeGame.team2, name: finalT2Name, players: p2 };
      const updatedTeam3 = isTrio ? { ...(activeGame.team3 || {}), name: finalT3Name, players: p3 } : undefined;

      if (typeof onSave === 'function') {
        onSave(updatedTeam1, updatedTeam2, updatedTeam3);
      }
    } catch (err) {
      console.error('Errore durante il salvataggio delle squadre:', err);
    } finally {
      if (typeof onClose === 'function') {
        onClose();
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md overflow-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Modifica squadre e giocatori"
    >
      <datalist id="burraco-known-players">
        {allKnownPlayerNames.map(name => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div
        className="relative w-full max-w-2xl club-card-solid rounded-t-3xl sm:rounded-3xl max-h-[92dvh] flex flex-col overflow-hidden club-sheet-enter"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="w-10 h-1 rounded-full bg-white/25" />
        </div>

        <div className="px-4 sm:px-6 py-3.5 border-b club-divider flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-white m-0 truncate">Squadre & Giocatori</h2>
              <p className="text-xs club-text-subtle m-0 truncate">Assegna rapidamente i partecipanti</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-xl club-btn-secondary flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mx-4 sm:mx-6 mt-3 px-3.5 py-2 rounded-xl club-inset border border-[var(--accent-gold)]/45 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)] shrink-0" />
            <span className="club-text-muted shrink-0">Inserimento in:</span>
            <span className="font-bold club-text-gold truncate">{getTargetFieldLabel()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-3.5 flex-1 overflow-y-auto space-y-4">
          <div className={`grid grid-cols-1 ${isTrio ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
            <TeamFormCard
              variant="amber"
              symbol="♦"
              headerTitle={isTrio ? 'Giocatore 1' : 'Squadra 1'}
              nameLabel={isTrio ? 'Nome Visualizzato' : 'Nome Squadra'}
              namePlaceholder="Es. Coppia 1"
              teamName={t1Name}
              onTeamNameChange={setT1Name}
              onAutoName={() => handleAutoNameTeam(1)}
              autoTitle="Imposta nome dai giocatori"
              isPairs={isPairs}
              p1Value={t1P1}
              onP1Change={setT1P1}
              p1FieldKey="t1P1"
              p1AlreadySelected={[t1P2, t2P1, t2P2, t3P1]}
              p2Value={t1P2}
              onP2Change={setT1P2}
              p2FieldKey="t1P2"
              p2AlreadySelected={[t1P1, t2P1, t2P2, t3P1]}
              activeTargetField={activeTargetField}
              onSelectField={setActiveTargetField}
              currentUser={currentUser}
              friendsList={friendsList}
            />

            <TeamFormCard
              variant="blue"
              symbol="♠"
              headerTitle={isTrio ? 'Giocatore 2' : 'Squadra 2'}
              nameLabel={isTrio ? 'Nome Visualizzato' : 'Nome Squadra'}
              namePlaceholder="Es. Coppia 2"
              teamName={t2Name}
              onTeamNameChange={setT2Name}
              onAutoName={() => handleAutoNameTeam(2)}
              autoTitle="Imposta nome dai giocatori"
              isPairs={isPairs}
              p1Value={t2P1}
              onP1Change={setT2P1}
              p1FieldKey="t2P1"
              p1AlreadySelected={[t1P1, t1P2, t2P2, t3P1]}
              p2Value={t2P2}
              onP2Change={setT2P2}
              p2FieldKey="t2P2"
              p2AlreadySelected={[t1P1, t1P2, t2P1, t3P1]}
              activeTargetField={activeTargetField}
              onSelectField={setActiveTargetField}
              currentUser={currentUser}
              friendsList={friendsList}
            />

            {isTrio && (
              <TeamFormCard
                variant="rose"
                symbol="♥"
                headerTitle="Giocatore 3"
                nameLabel="Nome Visualizzato"
                namePlaceholder="Es. Giocatore 3"
                teamName={t3Name}
                onTeamNameChange={setT3Name}
                onAutoName={() => handleAutoNameTeam(3)}
                autoTitle="Imposta nome del giocatore"
                isPairs={false}
                p1Value={t3P1}
                onP1Change={setT3P1}
                p1FieldKey="t3P1"
                p1AlreadySelected={[t1P1, t1P2, t2P1, t2P2]}
                activeTargetField={activeTargetField}
                onSelectField={setActiveTargetField}
                currentUser={currentUser}
                friendsList={friendsList}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {isTrio ? (
              <button
                type="button"
                onClick={handleRotateTrio}
                className="min-h-[40px] px-3.5 rounded-xl club-btn-secondary text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <ArrowLeftRight className="w-4 h-4 club-text-gold" />
                <span>Ruota Giocatori</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSwapTeams}
                  className="min-h-[40px] px-3.5 rounded-xl club-btn-secondary text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <ArrowLeftRight className="w-4 h-4 club-text-gold" />
                  <span>Inverti Squadre</span>
                </button>

                {isPairs && (
                  <button
                    type="button"
                    onClick={handleSwapPartners}
                    className="min-h-[40px] px-3.5 rounded-xl club-btn-secondary text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-emerald-300" />
                    <span>Scambia Compagni 2</span>
                  </button>
                )}
              </>
            )}
          </div>

          <QuickAssignRoster
            onlineTablePlayers={onlineTablePlayers}
            otherFriends={otherFriends}
            assignedMap={assignedMap}
            onAssignPlayer={handleAssignPlayer}
          />

          <div className="flex items-center gap-2 p-2.5 rounded-xl club-inset border club-divider text-xs club-text-muted">
            <AlertCircle className="w-4 h-4 club-text-gold shrink-0" />
            <span>
              I punti delle <strong className="text-white">{activeGame.rounds?.length || 0} mani</strong> già registrate restano invariati.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t club-divider shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 rounded-xl club-btn-secondary font-bold text-xs cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`min-h-[44px] px-5 rounded-xl gold-gradient font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Salvataggio...' : 'Salva Modifiche'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditTeamsModal(props) {
  useModalEscape(props.isOpen, props.onClose);

  if (!props.isOpen || !props.activeGame) return null;

  return <EditTeamsModalContent key={props.activeGame.id} {...props} />;
}
