import React, { useState } from 'react';
import { X, Cloud, CloudCheck, ExternalLink, QrCode, Copy, Check, Smartphone, Users } from 'lucide-react';

export default function CloudSyncModal({
  isOpen,
  onClose,
  activeGame,
  cloudStatus, // 'connected' | 'offline' | 'pending'
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.origin + (activeGame?.id ? `?game=${activeGame.id}` : '');

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg felt-card rounded-2xl border border-amber-500/40 p-4 sm:p-6 my-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-emerald-950 font-black shadow-md">
              <Cloud className="w-5 h-5 text-emerald-950" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white m-0">Database Cloud Firestore</h2>
              <p className="text-xs text-emerald-300/80 m-0">Sincronizzazione in tempo reale tra tutti i telefoni</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-4 text-xs sm:text-sm">
          
          {/* Box Stato Connessione */}
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="font-bold text-white block">Progetto Cloud Collegato:</span>
                <span className="text-emerald-300/80 text-xs font-mono">burraco-score-fedec</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-900/90 text-emerald-200 border border-emerald-500/40">
              Pronto & Attivo
            </span>
          </div>

          {/* Condividi Tavolo con gli altri giocatori */}
          {activeGame && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-amber-500/30 space-y-2.5">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                <span>Collega gli altri telefoni a questo tavolo</span>
              </span>
              <p className="text-xs text-emerald-300/90">
                Invia questo link ai tuoi amici al tavolo: tutti vedranno il tabellone aggiornarsi in tempo reale non appena inserisci una mano!
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="flex-1 px-3 py-2 rounded-lg bg-emerald-900/80 border border-emerald-700/60 text-white font-mono text-xs focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-lg gold-gradient text-emerald-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer hover:brightness-110 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5 text-emerald-950" />}
                  <span>{copied ? 'Copiato!' : 'Copia Link'}</span>
                </button>
              </div>

              <div className="text-[11px] text-emerald-400/80 pt-1 flex items-center justify-between">
                <span>Codice Tavolo: <strong className="text-amber-300 font-mono">{activeGame.id}</strong></span>
              </div>
            </div>
          )}

          {/* Unisciti a un altro Tavolo */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-700/40 space-y-2">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">
              Oppure unisciti al tavolo di un amico:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Incolla link o codice tavolo..."
                id="joinTableInput"
                className="flex-1 px-3 py-2 rounded-lg bg-emerald-900/60 border border-emerald-700/60 text-white text-xs placeholder:text-emerald-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => {
                  const val = document.getElementById('joinTableInput')?.value?.trim();
                  if (!val) return;
                  let targetId = val;
                  if (targetId.includes('game=')) {
                    targetId = targetId.split('game=')[1].split('&')[0];
                  }
                  window.location.href = window.location.origin + '?game=' + targetId;
                }}
                className="px-3 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-amber-300 border border-emerald-600/50 font-bold text-xs cursor-pointer transition-colors shrink-0"
              >
                Collegati
              </button>
            </div>
          </div>

        </div>

        <div className="mt-4 pt-3 border-t border-emerald-700/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl gold-gradient text-emerald-950 font-bold text-xs shadow-md transition-all cursor-pointer hover:brightness-110"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
}
