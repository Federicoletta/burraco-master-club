import React, { Component } from 'react';
import { RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';

export default class BurracoErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('BurracoErrorBoundary ha catturato un errore:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    // Pulisce eventuali chiavi di lock orfane di Firestore
    if (typeof localStorage !== 'undefined') {
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('firestore_') || k.startsWith('firebase:'))) {
            if (k.includes('tab_manager') || k.includes('lease') || k.includes('heartbeat')) {
              keysToRemove.push(k);
            }
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
      } catch {}
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleResumeLastGame = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        const historyKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('burraco_history')) historyKeys.push(k);
        }
        for (const hk of historyKeys) {
          const raw = localStorage.getItem(hk);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const pending = list.find(g => g && !g.isFinished && Array.isArray(g.rounds) && g.rounds.length > 0);
              if (pending) {
                localStorage.setItem('burraco_active_game_v1', JSON.stringify(pending));
                break;
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleResetTable = () => {
    try {
      localStorage.removeItem('burraco_active_game_v1');
    } catch (e) {
      console.error(e);
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || String(this.state.error || 'Errore sconosciuto');

      return (
        <div className="min-h-screen felt-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl club-card-solid border-2 border-[var(--accent-gold)]/55 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto shadow-xl">
              <span className="font-display text-3xl font-bold">♠</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/40 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Interfaccia Interrotta</span>
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-bold text-white m-0">
              Si è verificato un imprevisto
            </h2>

            <p className="text-xs sm:text-sm club-text-muted leading-relaxed">
              Il tavolo di gioco ha riscontrato un&apos;anomalia. Nessun dato dello storico o dei partecipanti è andato perduto.
            </p>

            <div className="p-3 rounded-xl bg-black/50 border border-rose-500/30 text-left text-[11px] font-mono text-rose-300 break-words max-h-28 overflow-y-auto">
              {errorMsg}
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full min-h-[46px] px-4 rounded-xl gold-gradient font-bold text-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Ricarica Tavolo</span>
              </button>

              <button
                type="button"
                onClick={this.handleResumeLastGame}
                className="w-full min-h-[44px] px-4 rounded-xl club-btn-secondary club-text-gold font-bold text-xs active:scale-95 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <span>Ripristina Ultima Partita in Sospeso</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetTable}
                className="w-full min-h-[44px] px-4 rounded-xl club-btn-secondary club-text-muted font-bold text-xs active:scale-95 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Inizia Nuovo Tavolo Pulito</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}