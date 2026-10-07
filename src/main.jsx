import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Burraco App ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleResetTable = () => {
    try {
      localStorage.removeItem('burraco_active_game_v1');
    } catch (e) {
      console.error(e);
    }
    this.setState({ hasError: false, error: null });
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || String(this.state.error || 'Errore sconosciuto');
      return (
        <div className="min-h-screen felt-bg flex items-center justify-center p-4">
          <div className="felt-card max-w-md w-full p-6 rounded-2xl border border-amber-500/40 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl gold-gradient flex items-center justify-center text-emerald-950 font-black text-2xl shadow-lg">
              ♠
            </div>
            <h2 className="text-xl font-black text-white">Si è verificato un imprevisto</h2>
            <p className="text-xs text-emerald-300/80 leading-relaxed">
              Il tavolo di gioco ha riscontrato un'anomalia. Nessun dato dello storico o dei partecipanti è andato perduto.
            </p>

            {/* Dettaglio tecnico errore per diagnosi immediata */}
            <div className="p-2.5 rounded-xl bg-black/60 border border-rose-500/30 text-left text-[11px] font-mono text-rose-300 break-words max-h-28 overflow-y-auto">
              {errorMsg}
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 rounded-xl gold-gradient hover:brightness-110 text-emerald-950 font-black text-sm shadow-md cursor-pointer transition-all active:scale-95"
              >
                Ricarica Tavolo
              </button>
              <button
                onClick={this.handleResetTable}
                className="w-full py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 font-bold text-xs shadow-sm cursor-pointer transition-all active:scale-95"
              >
                Inizia Nuovo Tavolo Pulito
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
