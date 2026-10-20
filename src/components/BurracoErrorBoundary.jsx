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
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-emerald-950/95 border-2 border-amber-500/50 shadow-2xl text-center backdrop-blur-xl space-y-4">
            
            {/* Icona decorativa */}
            <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto shadow-xl text-emerald-950">
              <span className="text-3xl font-black">♠</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Interfaccia Interrotta</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white">
              Si è verificato un imprevisto
            </h2>

            <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed">
              Il tavolo di gioco ha riscontrato un'anomalia. Nessun dato dello storico o dei partecipanti è andato perduto.
            </p>

            {/* Dettaglio tecnico errore per diagnosi rapida */}
            <div className="p-2.5 rounded-xl bg-black/60 border border-rose-500/30 text-left text-[11px] font-mono text-rose-300 break-words max-h-28 overflow-y-auto">
              {errorMsg}
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl gold-gradient text-emerald-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-95 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4 text-emerald-950" />
                <span>Ricarica Tavolo</span>
              </button>

              <button
                onClick={this.handleResetTable}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/50 font-bold text-xs shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-2 transition-all"
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