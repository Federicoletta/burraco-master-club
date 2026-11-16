import React, { useState } from 'react';
import { X, BookOpen, Award, CheckCircle2, Sparkles } from 'lucide-react';
import { useModalEscape } from '../hooks/useModalEscape';

export default function RulesModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('scores');
  useModalEscape(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md overflow-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Regolamento ufficiale del Burraco"
    >
      <div
        className="relative w-full max-w-2xl club-card-solid rounded-t-3xl sm:rounded-3xl max-h-[92dvh] flex flex-col overflow-hidden club-sheet-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <span className="w-10 h-1 rounded-full bg-white/25" />
        </div>

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b club-divider flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl font-bold text-white m-0 truncate">
                Regolamento del Burraco
              </h2>
              <p className="text-xs club-text-subtle m-0 truncate">
                Valori carte, onori, Burraco a 3 e FAQ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-xl club-btn-secondary flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Chiudi regolamento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6 pt-3 shrink-0">
          <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl club-tab-bar">
            <button
              type="button"
              onClick={() => setActiveTab('scores')}
              className={`min-h-[40px] px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
                activeTab === 'scores' ? 'gold-gradient' : 'club-text-muted hover:bg-white/5'
              }`}
            >
              Carte
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('trio')}
              className={`min-h-[40px] px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
                activeTab === 'trio' ? 'gold-gradient' : 'club-text-muted hover:bg-white/5'
              }`}
            >
              A 3 FIBUR
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('basics')}
              className={`min-h-[40px] px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
                activeTab === 'basics' ? 'gold-gradient' : 'club-text-muted hover:bg-white/5'
              }`}
            >
              Regole
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className={`min-h-[40px] px-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer truncate ${
                activeTab === 'faq' ? 'gold-gradient' : 'club-text-muted hover:bg-white/5'
              }`}
            >
              FAQ
            </button>
          </div>
        </div>

        {/* Contenuto */}
        <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1 min-h-0 space-y-4 text-xs sm:text-sm">
          {activeTab === 'scores' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-2.5">
                <span className="text-xs font-extrabold club-text-gold uppercase tracking-wider block">
                  Onori & Punti Smazzata
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-black/20 border club-divider flex justify-between items-center gap-2">
                    <div>
                      <span className="font-bold text-white block">Burraco Pulito</span>
                      <span className="text-[11px] club-text-subtle">7+ carte senza matte</span>
                    </div>
                    <span className="font-mono-num text-sm font-bold club-text-gold shrink-0">+200 pt</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/20 border club-divider flex justify-between items-center gap-2">
                    <div>
                      <span className="font-bold text-white block">Burraco Semipulito</span>
                      <span className="text-[11px] club-text-subtle">8+ carte (7 pure + matta agli estremi)</span>
                    </div>
                    <span className="font-mono-num text-sm font-bold text-sky-300 shrink-0">+150 pt</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/20 border club-divider flex justify-between items-center gap-2">
                    <div>
                      <span className="font-bold text-white block">Burraco Sporco</span>
                      <span className="text-[11px] club-text-subtle">7+ carte con Jolly o Pinella</span>
                    </div>
                    <span className="font-mono-num text-sm font-bold text-orange-300 shrink-0">+100 pt</span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/20 border club-divider flex justify-between items-center gap-2">
                    <div>
                      <span className="font-bold text-white block">Chiusura Smazzata</span>
                      <span className="text-[11px] club-text-subtle">Scarto finale dopo pozzetto</span>
                    </div>
                    <span className="font-mono-num text-sm font-bold club-text-gold shrink-0">+100 pt</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/45 border border-rose-500/35 text-xs text-rose-200 space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span>Pozzetto non preso:</span>
                    <span className="font-mono-num text-rose-300">-100 pt</span>
                  </div>
                  <div className="flex justify-between items-center font-bold">
                    <span>Pozzetto preso ma non giocato:</span>
                    <span className="font-mono-num text-rose-300">-100 pt</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold club-text-gold uppercase tracking-wider">
                    Valore Singole Carte
                  </span>
                  <span className="text-[11px] club-text-subtle">
                    + calate · - in mano
                  </span>
                </div>

                <div className="divide-y divide-[var(--border-subtle)] text-xs">
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-white">🃏 Jolly</span>
                    <span className="font-mono-num font-bold text-purple-300">30 pt</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-white">2️⃣ Pinelle (2 di qualsiasi seme)</span>
                    <span className="font-mono-num font-bold club-text-gold">20 pt</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-white">🅰️ Assi (A)</span>
                    <span className="font-mono-num font-bold text-sky-300">15 pt</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-white">👑 Figure & Alte (8, 9, 10, J, Q, K)</span>
                    <span className="font-mono-num font-bold text-emerald-300">10 pt</span>
                  </div>
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="font-semibold text-white">🎴 Carte Basse (3, 4, 5, 6, 7)</span>
                    <span className="font-mono-num font-bold club-text-muted">5 pt</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trio' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl club-inset border border-[var(--accent-gold)]/45 space-y-1.5">
                <h4 className="font-bold club-text-gold text-xs sm:text-sm m-0 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Regolamento Ufficiale FIBUR (1 contro 2)</span>
                </h4>
                <p className="text-xs club-text-muted leading-relaxed m-0">
                  Nel Burraco a 3 ciascuno compete individualmente, ma ogni mano si gioca <strong className="text-white">1 contro 2</strong> in base a chi conquista il primo pozzetto.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-2">
                <h4 className="font-bold club-text-gold text-xs sm:text-sm m-0 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. I Due Pozzetti (18 e 11 Carte)</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-xs club-text-muted m-0">
                  <li>Si preparano <strong className="text-white">due pozzetti disuguali</strong>: uno da <strong className="text-white">18 carte</strong> (sopra) e uno da <strong className="text-white">11 carte</strong> (sotto).</li>
                  <li>Ciascun giocatore riceve <strong className="text-white">11 carte</strong> iniziali.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-2">
                <h4 className="font-bold club-text-gold text-xs sm:text-sm m-0 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>2. Ruoli: Solitario vs Coppia</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-xs club-text-muted m-0">
                  <li><strong className="text-white">Il primo</strong> che finisce le carte prende il <strong className="text-white">pozzetto da 18 carte</strong> e gioca da <strong className="text-white">Solitario</strong>.</li>
                  <li><strong className="text-white">Gli altri due</strong> diventano <strong className="text-white">Coppia</strong> per la mano, condividono i giochi e prendono il pozzetto da <strong className="text-white">11 carte</strong>.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-2">
                <h4 className="font-bold club-text-gold text-xs sm:text-sm m-0 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>3. Divisione Punti & Traguardo</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-xs club-text-muted m-0">
                  <li>Il Solitario incassa il <strong className="text-white">100%</strong> dei propri punti; i punti della Coppia sono <strong className="text-white">divisi a metà (50%)</strong>.</li>
                  <li>Traguardo federale consigliato: <strong className="text-white">2505 pt</strong>.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'basics' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-2">
                <h4 className="font-bold club-text-gold text-xs sm:text-sm m-0 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Distribuzione & Svolgimento</span>
                </h4>
                <ul className="list-disc pl-4 space-y-1.5 text-xs club-text-muted m-0">
                  <li>2 mazzi francesi da 54 carte (inclusi 4 Jolly).</li>
                  <li>11 carte a testa, più 2 pozzetti a croce da 11 carte.</li>
                  <li>Si pesca dal tallone o si raccoglie l&apos;intero monte degli scarti.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-2">
                <h4 className="font-bold club-text-gold text-xs sm:text-sm m-0 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I 4 Requisiti per Chiudere</span>
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-xs club-text-muted m-0">
                  <li>Aver preso il <strong className="text-white">pozzetto</strong>.</li>
                  <li>Aver realizzato almeno <strong className="text-white">un Burraco</strong> (7+ carte).</li>
                  <li>Aver calato o legato tutte le carte in mano.</li>
                  <li>Scartare l&apos;ultima carta (non può essere Jolly o Pinella).</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-1">
                <span className="font-bold club-text-gold text-xs block">
                  D: Si può pescare una sola carta dagli scarti?
                </span>
                <p className="text-xs club-text-muted m-0">
                  No, scegliendo il monte degli scarti si raccolgono tutte le carte presenti.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-1">
                <span className="font-bold club-text-gold text-xs block">
                  D: Pozzetto con scarto o al volo?
                </span>
                <p className="text-xs club-text-muted m-0">
                  Con scarto si gioca al turno successivo; al volo (senza scarto) si continua immediatamente nello stesso turno.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl club-inset border club-divider space-y-1">
                <span className="font-bold club-text-gold text-xs block">
                  D: Cosa succede se finisce il tallone?
                </span>
                <p className="text-xs club-text-muted m-0">
                  Con sole 2 carte rimaste nel tallone la mano termina senza bonus chiusura (+100).
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-3.5 border-t club-divider flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-5 rounded-xl gold-gradient font-bold text-xs cursor-pointer active:scale-95"
          >
            Chiudi Regolamento
          </button>
        </div>
      </div>
    </div>
  );
}
