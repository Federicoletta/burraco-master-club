import React, { useState, useRef } from 'react';
import { useAlert, useConfirm } from '../context/confirmContextStore';
import { useModalEscape } from '../hooks/useModalEscape';
import {
  X,
  History,
  Download,
  Upload,
  Cloud,
  RefreshCw,
  Search
} from 'lucide-react';
import {
  exportBackupData,
  importBackupData,
  getGamesHistory,
  getHistoryKey,
  getOutboxQueue,
  safeSetItem
} from '../utils/storage';
import { loadCloudGamesHistory } from '../services/firebase';
import HistoryGameDetail from './history/HistoryGameDetail';
import HistoryGameCard from './history/HistoryGameCard';

const formatDate = (dateVal) => {
  if (!dateVal) return 'Oggi';
  try {
    const d = dateVal?.toDate ? dateVal.toDate() : new Date(dateVal);
    return isNaN(d.getTime()) ? 'Data recente' : d.toLocaleDateString('it-IT');
  } catch {
    return 'Data recente';
  }
};

export default function HistoryModal({
  isOpen,
  onClose,
  isPage = false,
  gamesHistory = [],
  activeGame,
  currentUser = null,
  onEndGame,
  onResumeGame,
  onDeleteGame,
  onDataImported,
  onAddRound,
  onEditRound
}) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);
  const customAlert = useAlert();
  const customConfirm = useConfirm();
  useModalEscape(Boolean(isOpen && !isPage), onClose);

  const handleDeleteGameWithConfirm = async (game) => {
    if (!game || !onDeleteGame) return;
    const title = `${game.team1?.name || 'Sq. 1'} vs ${game.team2?.name || 'Sq. 2'}`;
    const dateStr = formatDate(game.createdAt);
    const ok = await customConfirm({
      title: "Elimina Partita dall'Archivio",
      message: `Vuoi davvero eliminare definitivamente la partita "${title}" del ${dateStr}? L'operazione cancellerà la partita anche dal Cloud e non potrà essere annullata.`,
      confirmText: "Elimina Definitivamente",
      variant: "danger"
    });
    if (ok) {
      if (selectedGame && selectedGame.id === game.id) {
        setSelectedGame(null);
      }
      onDeleteGame(game.id);
    }
  };

  const allDisplayGames = React.useMemo(() => {
    const list = Array.isArray(gamesHistory) ? [...gamesHistory] : [];
    if (activeGame && activeGame.rounds && activeGame.rounds.length > 0) {
      const idx = list.findIndex(g => g.id === activeGame.id);
      if (idx >= 0) {
        list[idx] = { ...activeGame };
      } else {
        list.unshift({ ...activeGame });
      }
    }
    return list;
  }, [gamesHistory, activeGame]);

  const filteredGames = React.useMemo(() => {
    return allDisplayGames.filter(game => {
      if (!game) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const hayStack = [
        ...(game.team1?.players || []),
        ...(game.team2?.players || []),
        ...(game.team3?.players || []),
        game.team1?.name || '',
        game.team2?.name || '',
        game.team3?.name || ''
      ].join(' ').toLowerCase();
      return hayStack.includes(q);
    });
  }, [allDisplayGames, searchQuery]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const cloudGames = await loadCloudGamesHistory(currentUser);
      if (Array.isArray(cloudGames)) {
        const userKey = currentUser ? currentUser.uid : 'guest';
        const localGames = getGamesHistory(userKey);
        const outboxIds = new Set((getOutboxQueue() || []).map(g => g?.id).filter(Boolean));
        const map = new Map();

        if (currentUser?.uid) {
          localGames.forEach(g => {
            if (g?.id && (outboxIds.has(g.id) || g.id === activeGame?.id)) {
              map.set(g.id, g);
            }
          });
        } else {
          localGames.forEach(g => { if (g && g.id) map.set(g.id, g); });
        }

        cloudGames.forEach(g => {
          if (g && g.id) {
            const localMatch = map.get(g.id);
            if (!localMatch || (g.rounds?.length || 0) >= (localMatch.rounds?.length || 0)) {
              map.set(g.id, g);
            }
          }
        });
        const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        safeSetItem(getHistoryKey(userKey), JSON.stringify(merged));
        if (onDataImported) {
          onDataImported(merged, Boolean(currentUser?.uid));
        }
      }
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 2500);
    } catch (err) {
      console.warn('Errore sync:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const userKey = currentUser ? currentUser.uid : 'guest';
      const ok = importBackupData(event.target.result, userKey);
      if (ok) {
        customAlert({
          title: 'Ripristino Completato',
          message: 'Tutti i dati e lo storico partite sono stati ripristinati con successo!',
          variant: 'success'
        });
        if (onDataImported) onDataImported();
      } else {
        customAlert({
          title: 'Errore Ripristino',
          message: 'Il formato del file di backup selezionato non è valido.',
          variant: 'danger'
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  const cardContent = (
    <div
      className={`relative w-full ${
        isPage
          ? 'max-w-3xl mx-auto club-card rounded-3xl'
          : 'max-w-2xl club-card-solid rounded-t-3xl sm:rounded-3xl max-h-[92dvh] sm:max-h-[88dvh] club-sheet-enter'
      } flex flex-col overflow-hidden`}
      onClick={isPage ? undefined : (e) => e.stopPropagation()}
    >
      {!isPage && (
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="w-10 h-1 rounded-full club-handle" />
        </div>
      )}

      {/* Header */}
      <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b club-divider flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg sm:text-xl font-bold club-text-primary m-0 truncate">
                {selectedGame ? 'Dettaglio Partita' : 'Storico Partite'}
              </h2>
            </div>
            <p className="text-xs club-text-subtle m-0 truncate flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 club-success-text shrink-0" />
              <span>
                {selectedGame
                  ? `Match del ${formatDate(selectedGame.createdAt)}`
                  : `${allDisplayGames.length} partite salvate in archivio`}
              </span>
            </p>
          </div>
        </div>

        {!isPage && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-xl club-btn-secondary flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Chiudi storico"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Barra di Ricerca */}
      {!selectedGame && allDisplayGames.length > 0 && (
        <div className="px-4 sm:px-6 pt-3.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 club-text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cerca per giocatore o squadra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-4 rounded-xl club-input text-sm"
            />
          </div>
        </div>
      )}

      {/* CONTENUTO */}
      <div className={`px-4 sm:px-6 py-4 ${isPage ? '' : 'overflow-y-auto flex-1 min-h-0'}`}>
        {selectedGame ? (
          <HistoryGameDetail
            selectedGame={selectedGame}
            activeGame={activeGame}
            onBack={() => setSelectedGame(null)}
            onClose={onClose}
            onEndGame={onEndGame}
            onResumeGame={onResumeGame}
            onDeleteGameWithConfirm={handleDeleteGameWithConfirm}
            onEditRound={onEditRound}
            onAddRound={onAddRound}
          />
        ) : allDisplayGames.length === 0 ? (
          <div className="text-center py-12 px-4 club-inset rounded-2xl border club-divider space-y-1.5">
            <p className="text-sm font-bold club-text-primary m-0">Nessuna partita in archivio</p>
            <p className="text-xs club-text-subtle m-0 max-w-sm mx-auto leading-relaxed">
              Le partite con almeno una mano registrata appariranno automaticamente qui e saranno sincronizzate nel Cloud.
            </p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="text-center py-10 club-inset rounded-2xl border club-divider text-xs club-text-muted">
            Nessuna partita trovata per &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredGames.map(game => (
              <HistoryGameCard
                key={game.id}
                game={game}
                isActiveNow={Boolean(activeGame && activeGame.id === game.id)}
                formatDate={formatDate}
                onSelect={setSelectedGame}
                onDelete={handleDeleteGameWithConfirm}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Sync & Backup */}
      <div className="px-4 sm:px-6 py-3.5 border-t club-divider space-y-2.5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="club-text-muted">
              Archivio sincronizzato su Firestore
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="min-h-[42px] px-3.5 rounded-xl club-btn-secondary text-xs font-bold flex items-center gap-2 cursor-pointer active:scale-95"
              title="Ricarica le partite salvate sul cloud"
            >
              <RefreshCw className={`w-4 h-4 club-text-gold ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{syncDone ? 'Aggiornato!' : isSyncing ? 'Sincronizzazione...' : 'Sincronizza'}</span>
            </button>

            {!isPage && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="min-h-[42px] px-5 rounded-xl gold-gradient font-bold text-xs cursor-pointer active:scale-95"
              >
                Chiudi
              </button>
            )}
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="min-h-[36px] px-3 text-xs club-text-subtle hover:underline cursor-pointer"
          >
            {showAdvanced ? 'Nascondi backup offline' : 'Backup manuale file JSON'}
          </button>

          {showAdvanced && (
            <div className="mt-2 p-2.5 rounded-xl club-inset border club-divider flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => exportBackupData(currentUser ? currentUser.uid : 'guest')}
                className="min-h-[40px] px-3.5 rounded-xl club-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 club-text-gold" />
                <span>Scarica JSON</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[40px] px-3.5 rounded-xl club-btn-secondary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-4 h-4 club-text-gold" />
                <span>Ripristina JSON</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isPage) {
    return cardContent;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md overflow-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Archivio partite"
    >
      {cardContent}
    </div>
  );
}
