# Burraco Master Club — Report Tecnico & Funzionale (Code & UX Review)

- **App deployata:** `https://burraco-score-fedec.web.app/`
- **Progetto Firebase:** `burraco-score-fedec` (Firestore DB dedicato `ai-studio-burracomasterclu-a4e14155-6eff-45bf-ae27-48e27385782f`)
- **Lingua / Target:** Italiano — Web App SPA / PWA mobile-first per segnapunti Burraco (2, 3, 4 giocatori), gestione multi-torneo FIBUR e Club social.

---

## 1. Stack e Architettura

### Stack tecnologico (`package.json`)
- **Core UI:** React `19.2.8` + React DOM `19.2.8` (JavaScript/JSX, **non** TypeScript).
- **Build & Bundling:** Vite `8.3.0` + `@vitejs/plugin-react` `6.1.1`.
  - Code-splitting manuale in `vite.config.js` (`vendor-firebase-firestore`, `vendor-firebase-auth`, `vendor-firebase-core`, `vendor-icons`, `vendor-confetti`) e `React.lazy` + `Suspense` per viste e modali secondarie.
  - Plugin custom `versionPlugin()` che emette `dist/version.json` con timestamp `__BUILD_TIME__` per il rilevamento aggiornamenti client-side.
- **Styling:** Tailwind CSS `4.3.3` (`@tailwindcss/vite`) + custom CSS properties in `src/index.css` per i 4 temi feltro (`[data-theme="..."]`).
- **Backend / Cloud:** Firebase JS SDK `12.19.0` (Firebase Authentication con Google Popup + Cloud Firestore + Firebase Hosting). Nessun backend Node/Express custom: l'app è una SPA client-only con regole di validazione lato Firestore (`firestore.rules`).
- **Librerie di supporto:** `lucide-react` `1.49.0` (icone), `canvas-confetti` `1.9.4` (celebrazioni), `qrcode` `1.5.4` (condivisione tavolo via QR).
- **Qualità e test:** `vitest` `5.0.5` (96 test unitari) + `oxlint` `1.81.0` (linting).
- **Routing:** Nessuna libreria di routing (no React Router). Navigazione SPA tramite stato React `activeNavTab` (`'table' | 'tournament' | 'history' | 'profile'`) in `src/App.jsx` e parametri URL (`?game=<id>` per join diretto al tavolo, `#backup=<base64>` per ripristino stateless).

### Gestione dello stato
Architettura a **Context annidati + Custom Hooks di dominio** (`src/App.jsx`):
```
ConfirmProvider
 └── SocialProvider      (useSocialClub: auth Google, amici, amici stretti, notifiche, club)
      └── TournamentProvider  (useTournament: torneo attivo, tornei in pausa, albo d'oro, sync cloud)
           └── GameProvider   (useBurracoGame: partita attiva, storico, outbox offline, listener live)
```
All'interno degli hook principali viene usato il pattern **mirror `useRef`** (`activeGameRef`, `currentUserRef`, ecc.) per evitare stale closure nelle callback asincrone e nei listener Firestore `onSnapshot`.

### Struttura delle cartelle e file principali
```text
/
├── index.html                        # Entry HTML, meta SEO/PWA, Google Fonts, script anti-FOUC tema
├── vite.config.js                    # Build Vite, manualChunks, versionPlugin, cleanup assets/aistudio
├── firebase.json                     # Firebase Hosting (SPA rewrite, Cache-Control)
├── firestore.rules                   # 509 righe di schema validation e ACL per 8 collezioni Firestore
├── firestore.indexes.json            # 5 indici compositi (games, tournaments, notifications)
├── public/
│   ├── manifest.json                 # Web App Manifest PWA
│   ├── sw.js                         # Service Worker manuale (burraco-cache-v5)
│   ├── favicon.svg                   # Icona vettoriale
│   └── audio/*.mp3                   # 5 tracce jazz di sottofondo
└── src/
    ├── main.jsx                      # Mount React, ErrorBoundary, registrazione SW, navigator.storage.persist()
    ├── App.jsx                       # Orchestratore viste tab, Header, BottomNavBar, AppModals
    ├── index.css                     # Token CSS temi, utility club-card / felt-bg / gold-gradient / safe-area
    ├── constants/
    │   └── burraco.js                # Valori carte, onori, traguardi default, calculateTeamRoundScore()
    ├── context/                      # ConfirmContext, SocialContext, TournamentContext, GameContext
    ├── hooks/
    │   ├── useBurracoGame.js         # Core engine partita (973 righe: lifecycle, rounds, rematch, torneo)
    │   ├── useGameOutbox.js          # Coda offline retry e stato sync ('synced' | 'syncing' | 'offline')
    │   ├── useGameCloudListeners.js  # Listener real-time Firestore, join via ?game=, recovery #backup=
    │   ├── useTournament.js          # Multi-torneo (attivo, pausa con data/nota, ripresa, storico, cloud)
    │   ├── useSocialClub.js          # Auth, amicizie, presenza live on-demand, inviti tavolo
    │   └── useModalEscape.js         # Chiusura modali con tasto ESC
    ├── services/
    │   ├── firebaseClient.js         # Init Firebase/Firestore (memoryLocalCache), sanitize, PIN hash, cache profili
    │   ├── gamesCloudService.js      # CRUD partite, indice PIN O(1), merge/safeguard round remoti
    │   ├── tournamentsCloudService.js# Sync/delete tornei su burraco_tournaments
    │   ├── authService.js            # Google Popup login/logout, sync profilo privato/pubblico
    │   ├── profilesService.js        # Directory pubblica zero-PII, batch fetch con TTL, careerStats
    │   └── social.js                 # Richieste amicizia, closeFriends, inviti partita, notifiche real-time
    ├── utils/
    │   ├── storageCore.js / storage.js # Wrapper localStorage, safeSetItem con auto-compattazione, rubrica nomi
    │   ├── outboxQueue.js            # Persistenza coda scritture fallite offline
    │   ├── ledger.js                 # Event-Sourcing append-only con hash FNV-1a 64-bit e merge CRDT
    │   ├── statelessGame.js          # Codifica/decodifica Base64 UTF-8 partita in URL #backup=...
    │   ├── backup.js                 # Export/Import completo JSON v2 (partite + tornei + giocatori)
    │   ├── tournament.js             # Round-Robin, tabella VP FIBUR, classifica, pausa/ripresa, share WhatsApp
    │   ├── playerStats.js            # Statistiche per giocatore e carriera utente autenticato
    │   ├── trophies.js               # 12 trofei con rarità e 10 titoli onorifici
    │   ├── theme.js                  # 4 temi feltro scuri e sync meta[name="theme-color"]
    │   ├── soundEffects.js           # Sintetizzatore SFX Web Audio API (100% offline)
    │   ├── backgroundMusic.js        # Player MP3 loop con GainNode Web Audio per controllo volume iOS/iPadOS
    │   ├── wakeLock.js               # Screen Wake Lock API con fallback video base64 silenzioso
    │   ├── versionCheck.js           # Polling /version.json per notifica aggiornamenti
    │   └── telemetry.js              # Metriche diagnostiche partita (durata, modalità inserimento, revert)
    └── components/
        ├── HomeLobby.jsx             # Schermata iniziale: avvio rapido, join PIN, ripeti ultima, banner torneo
        ├── NewGameModal.jsx          # Configurazione grafica del tavolo (posti, modalità, traguardo, semipulito)
        ├── ScoreBoard.jsx            # Tavolo live: TeamScoreCards, toolbar, TablePlayersBar, RoundsHistoryList
        ├── RoundCalculatorModal.jsx  # Calcolatore guidato + inserimento rapido + modalità Trio 1vs2
        ├── VictoryModal.jsx          # Schermata fine partita, confetti, VP FIBUR, rivincita, condivisione
        ├── HistoryModal.jsx          # Archivio partite, statistiche giocatori, export/import backup JSON
        ├── TournamentModal.jsx       # Dashboard Hub multi-torneo (Attivo, In Pausa, Albo d'Oro, Preset, Simulatore VP)
        ├── UserProfileModal.jsx      # Profilo carriera, trofei, classifica amici, rubrica/inviti club
        ├── CloudSyncModal.jsx        # PIN a 6 cifre, QR Code, link WhatsApp, link #backup= stateless, join tavolo
        ├── RulesModal.jsx            # Regolamento consultabile (Carte, A 3 FIBUR, Regole, FAQ)
        └── BurracoErrorBoundary.jsx  # Recovery UI su crash React (ricarica, ripristina ultima partita, reset)
```

---

## 2. Funzionalità Implementate

### Modalità di gioco supportate
| Modalità | Codice | Struttura | Note specifiche |
| :--- | :--- | :--- | :--- |
| **A Coppie (4 giocatori)** | `pairs` | 2 squadre (`team1`, `team2`) da 2 giocatori | Default di `NewGameModal` |
| **Singolo (2 giocatori)** | `singles` | 2 giocatori (`team1`, `team2`) 1 contro 1 | Stesso motore a 2 entità |
| **A Tre / Trio (3 giocatori)** | `trio` | 3 giocatori individuali (`team1`, `team2`, `team3`) | Regolamento FIBUR 1 contro 2: in ogni mano si seleziona il **Solitario** (rotazione suggerita automatica `(roundNumber - 1) % 3`) contro la **Coppia** temporanea, il cui punteggio viene diviso al 50% |

- **Traguardi punti (`DEFAULT_TARGET_SCORES`):** `1005` (Veloce), `1505` (Media), `2005` (Classica — default in `NewGameModal`), `2505` (etichettato "Predefinito", default in tornei/fallback), `3005` (Lunga) o **valore personalizzato** libero.
- **Opzione Burraco Semipulito (`allowSemipulito`):** toggle booleano per partita (default `true`) che mostra/nasconde il contatore Semipulito (+150 pt) nel calcolatore.

### Flusso completo di una partita
1. **Nuova partita (`HomeLobby` / `NewGameModal`):**
   - Scelta modalità (`pairs` / `singles` / `trio`), disposizione visuale dei posti al tavolo (`BurracoTableFormation`) con autocomplete da rubrica locale, amici del club e giocatori recenti, pulsante **"Ripeti ultima formazione"**, scelta traguardo e toggle Semipulito.
   - All'avvio (`handleStartGame`): se esisteva una partita aperta con almeno 1 mano, questa viene archiviata; vengono inizializzati il blocco Genesis del ledger CRDT, la proprietà (`ownerUid`, `playerUids`) e gli inviti automatici (gli *Amici Stretti* entrano subito in `playerUids`, gli altri ricevono notifica `game_invite`).
2. **Tavolo live (`ScoreBoard`):**
   - Header compatto con stato sincronizzazione (`Sincronizzato` / `Sync Cloud...` / `Offline`), card punteggi con barre di avanzamento verso il target, scarto punti, badge titolo onorifico giocatore, modifica nomi squadre in corsa (`EditTeamsModal`) e barra giocatori connessi al tavolo (`TablePlayersBar`).
3. **Inserimento smazzata (`RoundCalculatorModal`):**
   - **Calcolo Guidato:** selezione Chiusura (mutuamente esclusiva tra le due parti), stato Pozzetto (`preso_giocato`, `non_preso`, `preso_non_giocato`), contatori Burrachi (Puliti, Semipuliti se attivo, Sporchi), punti carte a terra e carte in mano tramite **input numerico diretto** oppure **Contatore Carte visuale (`CardCounterPad`)** per taglio di carta, con ricevuta riepilogativa live (`RoundReceiptSummary`).
   - **Totali Rapidi (`QuickEntryPad`):** inserimento diretto del punteggio netto (anche negativo) per ciascuna squadra/giocatore.
4. **Modifica e annullamento mano:**
   - Modifica di qualsiasi mano esistente dal foglio segnapunti (`RoundsHistoryList`, vista *Schede* o *Tabella*): riapre `RoundCalculatorModal` precompilato e sovrascrive la mano ricalcolando progressivi, totali e stato vittoria.
   - Eliminazione dell'ultima mano (`handleDeleteLastRound`) o di una specifica mano qualsiasi (`handleDeleteRound`), con conferma modale, rinumerazione sequenziale e registrazione evento `ROUND_REVERTED` nel ledger.
5. **Chiusura partita e Vittoria (`VictoryModal`):**
   - Trigger automatico quando almeno una squadra raggiunge `targetScore` (oppure chiusura anticipata manuale tramite `handleEndGame`).
   - Fanfara Web Audio + `canvas-confetti`, riepilogo podio (o calcolo VP FIBUR se partita di torneo), condivisione via Web Share API / appunti, **Rivincita** con gli stessi giocatori o **Archivia & Nuova Partita**.
   - Se la partita è collegata a un match di torneo (`tournamentMatchId`), il risultato aggiorna automaticamente calendario e classifica del torneo associato.
6. **Storico, Statistiche e Trofei (`HistoryModal`, `UserProfileModal`):**
   - Archivio partite (in corso e concluse) con ripresa, chiusura diretta, eliminazione e filtri.
   - Statistiche aggregate per singolo giocatore (`playerStats.js`: partite, vittorie, win rate, punti totali/medi, burrachi per tipo, chiusure, mano record) e carriera utente autenticato con **12 trofei** (`COMMON` → `LEGENDARY`) e **10 titoli onorifici** (`trophies.js`).
7. **Sezione Multi-Torneo (`TournamentModal`, `TournamentHub`, `TournamentWizard`):**
   - Dashboard sempre accessibile (anche a 0 tornei) con 4 preset rapidi 1-tap, simulatore live della tabella VP FIBUR e gestione simultanea di **Torneo In Corso**, **Tornei In Pausa** (con data prevista e note di ripresa, pausa manuale o automatica all'avvio di un nuovo torneo, possibilità di giocare partite libere senza perdere il torneo) e **Albo d'Oro** (tornei conclusi).
   - Calendario Round-Robin automatico (con gestione turno `RIPOSO` / `__bye__` per numero dispari di squadre), lancio diretto del tavolo dal calendario, classifica ordinata per VP FIBUR o sistema Classico (3-1-0) e condivisione WhatsApp.
8. **Club Social & Multi-dispositivo (`CloudSyncModal`, `UserProfileModal`):**
   - Login Google, join a un tavolo tramite **PIN a 6 cifre**, link `?game=` o **QR Code**, lista amici, flag *Amici Stretti*, stato presenza online (`lastSeen < 3 min`), notifiche toast real-time.

---

## 3. Logica di Calcolo Punteggi

### Tabella valori carte e onori (`src/constants/burraco.js`)
- **Carte:** Jolly = `30`, Pinella (2) = `20`, Asso (A) = `15`, Figure & Alte (8–K) = `10`, Basse (3–7) = `5`.
- **Onori e penalità:**
  - `BURRACO_PULITO`: **+200 pt**
  - `BURRACO_SEMIPULITO`: **+150 pt** (attivo se `allowSemipulito === true`)
  - `BURRACO_SPORCO` (impuro): **+100 pt**
  - `CHIUSURA`: **+100 pt** (esclusivo: attivarlo su una squadra disattiva automaticamente l'altra in `RoundCalculatorModal.handleChiusura`)
  - `POZZETTO_NON_PRESO`: **-100 pt**
  - `POZZETTO_PRESO_NON_GIOCATO`: **-100 pt** (`preso_giocato` = `0 pt`)

### Formula di calcolo della singola smazzata (`src/constants/burraco.js`)
```js
export function calculateTeamRoundScore(details) {
  if (!details) return 0;
  if (details.manualMode) {
    return Number(details.manualScore) || 0;
  }

  let honors = 0;
  honors += (details.burracoPulito || 0) * HONOR_POINTS.BURRACO_PULITO;
  honors += (details.burracoSemipulito || 0) * HONOR_POINTS.BURRACO_SEMIPULITO;
  honors += (details.burracoSporco || 0) * HONOR_POINTS.BURRACO_SPORCO;
  if (details.chiusura) honors += HONOR_POINTS.CHIUSURA;
  if (details.pozzetto === 'non_preso') honors += HONOR_POINTS.POZZETTO_NON_PRESO;
  else if (details.pozzetto === 'preso_non_giocato') honors += HONOR_POINTS.POZZETTO_PRESO_NON_GIOCATO;

  const terra = details.cardsOnTableDirect !== undefined && details.cardsOnTableDirect !== ''
    ? Math.max(0, Number(details.cardsOnTableDirect) || 0)
    : calculateCardsPoints(details.cardsOnTableCount);

  const mano = details.cardsInHandDirect !== undefined && details.cardsInHandDirect !== ''
    ? Math.max(0, Number(details.cardsInHandDirect) || 0)
    : calculateCardsPoints(details.cardsInHandCount);

  return honors + terra - mano;
}
```
> **Nota:** se il campo diretto (`cardsOnTableDirect` / `cardsInHandDirect`) è valorizzato, ha precedenza sul contatore analitico per carte ed è clampato a `>= 0`.

### Regola Trio (3 giocatori, 1 vs 2) (`src/components/round/roundUtils.js`)
In modalità guidata `trio`:
- Il **Solitario** riceve `loneScore = calculateTeamRoundScore(loneData)` (100%).
- La **Coppia** calcola `pairRawScore = calculateTeamRoundScore(pairData)` e a ciascuno dei due componenti viene assegnato:
  ```js
  const pairSplitScore = Math.round(pairRawScore / 2);
  ```
- In modalità `quick`, invece, si inseriscono i 3 totali individuali separatamente senza divisione automatica.

### Condizione di vittoria (`src/utils/gameHelpers.js`)
```js
const isTargetReached = isTrio
  ? (t1Total >= target || t2Total >= target || t3Total >= target)
  : (t1Total >= target || t2Total >= target);
```
A traguardo raggiunto vince chi ha il punteggio totale più alto (in caso di parità esatta `t1Total === t2Total`, la formula `t1Total >= t2Total ? 'team1' : 'team2'` assegna la vittoria a `team1`).

### Regolamento Tornei: FIBUR Victory Points (20–0) e Classico (`src/utils/tournament.js`)
- **FIBUR (`scoringSystem: 'fibur'`):** converte lo scarto `diff = Math.abs(s1 - s2)` in Victory Points (somma fissa = 20):

| Scarto `|s1 - s2|` | VP Vincitore | VP Perdente |
| :--- | :---: | :---: |
| `0 – 50` (o parità `s1 === s2`) | 10 | 10 |
| `51 – 150` | 11 | 9 |
| `151 – 300` | 12 | 8 |
| `301 – 500` | 13 | 7 |
| `501 – 750` | 14 | 6 |
| `751 – 1050` | 15 | 5 |
| `1051 – 1400` | 16 | 4 |
| `1401 – 1800` | 17 | 3 |
| `1801 – 2250` | 18 | 2 |
| `2251 – 2750` | 19 | 1 |
| `> 2750` | 20 | 0 |

- **Classico (`scoringSystem: 'classic'`):** Vittoria = `3 pt`, Pareggio = `1 pt`, Sconfitta = `0 pt`.
- **Criteri di spareggio in classifica:** 1) Punti Torneo (VP o Classici), 2) Differenza Punti Burraco (`PF - PS`), 3) Punti Fatti (`PF`), 4) Vittorie, 5) Ordine alfabetico.

---

## 4. Persistenza e Sincronizzazione

### Livelli di persistenza
1. **LocalStorage (`src/utils/storageCore.js`, `src/utils/tournament.js`):**
   - Chiavi principali: `burraco_active_game_v1`, `burraco_history_<uid|v1>`, `burraco_players_<uid|v1>`, `burraco_active_tournament_v1`, `burraco_paused_tournaments_v1`, `burraco_tournaments_history_v1`, `burraco_offline_outbox_v1`, `burraco_theme_v1`, `burraco_music_*`, `burraco_sfx_enabled`.
   - `safeSetItem()` gestisce `QuotaExceededError` tentando un'**auto-compattazione**: sugli array di storico con > 25 elementi, svuota `rounds: []` per gli elementi con indice `>= 20` preservando `roundsCount`.
   - All'avvio (`src/main.jsx`), richiede `navigator.storage.persist()` per ridurre il rischio di eviction su mobile.
2. **Cloud Firestore (`src/services/firebaseClient.js`, `gamesCloudService.js`, `tournamentsCloudService.js`):**
   - Inizializzato esplicitamente con **`memoryLocalCache()`** (senza persistenza IndexedDB di Firestore) e pulizia delle vecchie chiavi `firestore_*` / `firebase:*` al boot, per prevenire crash `QuotaExceededError` e deadlock multi-tab su iOS/Safari.
   - Collezioni protette da `firestore.rules`: `burraco_games`, `burraco_pins` (lookup O(1) via PIN a 6 cifre calcolato con hash deterministico da `game.id`), `burraco_tournaments`, `burraco_users` (PII privato solo owner), `burraco_public_profiles` (directory club zero-PII), `burraco_notifications`, `burraco_friends`, `burraco_meta`.
   - **Safeguard anti-sovrascrittura:** `syncGameToCloud(..., force = false)` controlla se il documento remoto ha più mani di quello locale prima di scrivere; le azioni esplicite dell'utente (salvataggio/modifica/cancellazione mano) usano `force = true`.
3. **Outbox Queue Offline (`src/utils/outboxQueue.js`, `src/hooks/useGameOutbox.js`):**
   - Ogni scrittura cloud fallita viene accodata in `burraco_offline_outbox_v1` (deduplicata per `game.id`) e ritentata automaticamente al ritorno online (`window.addEventListener('online')`) o al mount successivo.
4. **CRDT / Event-Sourcing Ledger (`src/utils/ledger.js`):**
   - Ogni partita mantiene una `ledgerChain` append-only di eventi (`GAME_CREATED`, `ROUND_ADDED`, `ROUND_REVERTED`, `TEAMS_UPDATED`, `GAME_FINISHED`, `TABLE_CLOSED`) collegati da hash FNV-1a esadecimale a 64-bit, con funzione `mergeChainsCRDT` per riconciliazione multi-dispositivo.
5. **Export/Import JSON & Stateless URL Backup:**
   - **Backup JSON v2 (`src/utils/backup.js`):** esporta/importa in un unico file `.json` partita attiva, storico partite, rubrica giocatori, torneo attivo, tornei in pausa e albo d'oro.
   - **Paracadute URL (`src/utils/statelessGame.js`):** serializza l'intera partita in Base64 UTF-8 dentro `#backup=<token>`, condivisibile via WhatsApp e ripristinabile senza cache né database (`useGameCloudListeners`).

### Cosa succede se si chiude o ricarica la pagina a metà partita?
- **Partita con almeno 1 mano registrata (`rounds.length > 0`) e non conclusa (`!isFinished && !tableClosed`):** viene ripristinata automaticamente da `burraco_active_game_v1` (`src/hooks/useBurracoGame.js`, righe 43–54) e riaggancia il listener Firestore live.
- **Partita appena creata con 0 mani (`rounds.length === 0`):** al ricaricamento (senza parametro `?game=` nell'URL), `useBurracoGame` svuota `burraco_active_game_v1` e riporta l'utente nella `HomeLobby`. La partita rimane comunque visibile in `gamesHistory` e riprendibile dall'Archivio.
- **Partita aperta tramite link `?game=<id>`:** ignora la cache `activeGame` iniziale e scarica/sottoscrive direttamente il documento Firestore da `burraco_games/<id>`.
- **Tornei in corso e in pausa:** persistono integralmente sia su `localStorage` che su `burraco_tournaments` (per utenti loggati) e sopravvivono al reload.

---

## 5. PWA, SEO e Offline

### Configurazione `index.html` e SEO
- Presenti: `<html lang="it">`, `<title>Burraco Master Club - Segnapunti & Statistiche</title>`, `<meta name="description">`, `og:title`, `og:description`, `viewport-fit=cover`, `apple-mobile-web-app-capable="yes"`, `apple-mobile-web-app-status-bar-style="black-translucent"`, `theme-color` dinamico (aggiornato da script inline anti-FOUC in `<head>`).
- **Assenti:** `og:image`, `og:url`, `og:type`, meta tag Twitter Card (`twitter:card`), `<link rel="canonical">`, `robots.txt` / `sitemap.xml` e dati strutturati Schema.org (`JSON-LD`).
- **Icone Apple/PWA:** `<link rel="apple-touch-icon" href="/favicon.svg" />` usa un file SVG (su iOS Safari le `apple-touch-icon` in SVG vengono spesso ignorate a favore di PNG 180×180).

### Manifest (`public/manifest.json`)
- `display: "standalone"`, `start_url: "/"`, `background_color` e `theme_color` `#08291c`.
- Le `icons` dichiarano solo `image/svg+xml` (`/favicon.svg` + data URI emoji ♠️) con `sizes: "192x192 512x512"`, **senza icone PNG raster** `192x192` e `512x512`.

### Service Worker (`public/sw.js`) e Hosting (`firebase.json`)
- Registrato in `src/main.jsx` **solo in produzione** (`import.meta.env.PROD`).
- **Cache attiva:** `burraco-cache-v5` con `skipWaiting()` e `clients.claim()` immediati.
- **Precaching in `install`:** solo `['/manifest.json', '/version.json']` (non precacha `/` né i bundle JS/CSS al primo install).
- **Strategie di fetch:**
  - **Esclusi dal SW:** richieste non-GET, cross-origin (es. Google Fonts e chiamate Firestore), `/audio/*` e `/assets/aistudio/*`.
  - **Navigazione / HTML / `version.json`:** *Network-First* con fallback a cache.
  - **Asset statici (`/assets/*.js`, `.css`, `.svg`):** *Cache-First / Stale-While-Revalidate* (popolata progressivamente durante la navigazione).
- **Cache HTTP (`firebase.json`):** `no-cache, no-store, must-revalidate` su `/index.html`, `/version.json`, `/manifest.json`; `public, max-age=31536000, immutable` su `/assets/**`.
- **Aggiornamento versione (`src/utils/versionCheck.js`):** interroga `/version.json` per rilevare nuove build deployate.

### Comportamento senza connessione
- **Punti di forza:** se l'app è già stata aperta online almeno una volta (popolando la cache SW dei bundle), il segnapunti, il calcolatore guidato, gli SFX Web Audio, la cronologia locale, i tornei e l'export JSON continuano a funzionare; le modifiche cloud entrano nella **Outbox Queue** e si sincronizzano al ritorno della rete.
- **Limiti offline:** le 5 tracce musicali MP3 (`/audio/*.mp3`) non sono cachate dal SW; Google Fonts dipende dalla cache HTTP del browser; il login Google, il join PIN e le funzioni social richiedono rete; in più c'è un bug nel fallback offline del SW (vedi Sezione 7).

---

## 6. UI/UX e Mobile

### Struttura dell'interfaccia e responsive
- **Header (`Header.jsx`):** barra sticky compatta con brand, selettore tema, audio/musica, notifiche con badge, regolamento e condivisione.
- **Navigazione mobile/desktop (`BottomNavBar.jsx`):** dock flottante inferiore a 4 tab (`Tavolo`, `Torneo`, `Storico`, `Profilo`/`Accedi`) con gestione delle safe-area iOS (`env(safe-area-inset-*)`).
- **Tavolo live (`ScoreBoard.jsx`):**
  - **Mobile verticale (`< lg`):** layout a colonna singola con card punteggi in alto, toolbar compatta, lista mani in formato **Schede** (`viewMode = 'cards'`) e **CTA primaria "+ Registra Smazzata" fissa nella thumb-zone** sopra la `BottomNavBar` (`bottom: calc(env(safe-area-inset-bottom) + 5.25rem)`).
  - **Tablet/Desktop (`>= lg`):** split-view 12 colonne (7–8 colonne a sinistra per punteggi/azioni + CTA inline, 4–5 colonne a destra per il Foglio Segnapunti in formato **Tabella**).
- **Modali:** bottom-sheet con maniglia superiore (`rounded-t-3xl`, `max-h-[92dvh]`) su smartphone e dialog centrate (`sm:rounded-3xl`) su schermi più ampi. In `RoundCalculatorModal`, su schermi `< lg` le due squadre si alternano via tab switcher; su desktop si affiancano.

### Gestione errori di input
- **Buona sanitizzazione nei campi carte guidati (`CardsPointsInput`):** accetta solo cifre positive, prevenendo caratteri non numerici e valori negativi.
- **Validazione debole in `QuickEntryPad` e `TargetScoreSelector`:** gli `<input type="number">` non impongono range `min`/`max` né mostrano messaggi di errore inline (es. traguardi `< 100` o `> 10000` vengono accettati dalla UI ma rifiutati da `firestore.rules`).
- **Resilienza globale:** `BurracoErrorBoundary` intercetta crash React mostrando 3 azioni di recupero (*Ricarica Tavolo*, *Ripristina Ultima Partita in Sospeso*, *Inizia Nuovo Tavolo Pulito*) e pulizia automatica dei lock residui Firestore.

### Accessibilità (a11y)
- **Implementato:** `role="dialog"`, `aria-modal="true"`, `aria-label` su modali e pulsanti icona, chiusura con tasto `Escape` (`useModalEscape`), target touch quasi sempre `>= 42–44px` (`min-h-[44px]`), numeri tabellari (`font-mono-num` / `tabular-nums`) per evitare jitter visivo.
- **Carente:** assenza di **focus trap** e ripristino del focus alla chiusura delle modali; nessun supporto a `prefers-reduced-motion` per confetti e animazioni CSS; contrasto di alcuni testi secondari (`club-text-subtle`) su feltri scuri non verificato formalmente WCAG AA in condizioni di luce esterna.

### Temi (Chiaro / Scuro)
- **Non esiste un tema chiaro (Light Mode).** L'app offre **4 temi scuri in stile club/feltro** (`src/utils/theme.js`):
  1. `emerald` — *Verde Smeraldo* (default, `#08291c`)
  2. `navy` — *Blu Notte Reale* (`#091833`)
  3. `burgundy` — *Bordeaux Club Vintage* (`#280812`)
  4. `velvet` — *Dark Velvet / Carbone* (`#121316`)

### Feedback visivi, sonori e comfort al tavolo
- **Effetti sonori (`soundEffects.js`):** interamente sintetizzati via Web Audio API (click carte, chime Burraco, tap, notifica, trofeo, fanfara vittoria) — leggeri e 100% offline.
- **Musica di sottofondo (`backgroundMusic.js`):** 5 brani jazz MP3 in loop continuo con routing su `GainNode` Web Audio per aggirare il blocco `audio.volume` read-only su iOS/iPadOS e sblocco autoplay al primo tocco.
- **Screen Wake Lock (`wakeLock.js`):** mantiene acceso lo schermo durante la partita con Screen Wake Lock API nativa + fallback video silenzioso base64.
- **Feedback visivi:** `canvas-confetti` alla vittoria, `NotificationToast` real-time, pill/dot di stato sync cloud.

---

## 7. Punti Deboli Noti, Bug e Aree di Miglioramento (TODO)

### Bug e discrepanze critiche rilevate nel codice
1. **Fallback offline rotto nel Service Worker (`public/sw.js:49`):**
   - `STATIC_ASSETS` precacha solo `/manifest.json` e `/version.json` (non `/` né `/index.html`). In `fetch`, se la navigazione fallisce offline e `/` non è in cache, il fallback esegue `res || caches.match('/version.json')`, servendo JSON grezzo al posto dell'app HTML. Inoltre i file `/audio/*.mp3` sono esclusi dalla cache SW.
2. **Blocklist nomi hardcoded che blocca utenti reali (`src/utils/storageCore.js:10-15`):**
   - `MOCK_NAMES = ['Marco', 'Anna', 'Luca', 'Sofia']` e `LEGACY_NAMES = ['aurora', 'elisa', 'nicoletta', ...]` impediscono di salvare nella rubrica locale giocatori reali con nomi italianissimi (Marco, Anna, Luca, Sofia, Elisa, Aurora, Nicoletta).
3. **Disallineamento validazione `targetScore` UI vs Firestore (`NewGameModal.jsx:125` vs `firestore.rules:102-103`):**
   - La UI permette qualsiasi `targetScore > 0`, ma `firestore.rules` rifiuta qualunque valore `< 100` o `> 10000`, causando errori `permission-denied` silenziosi in fase di sync cloud. Inoltre il default in `NewGameModal` è `2005`, mentre `DEFAULT_TARGET_SCORES` etichetta `2505` come "Predefinito".
4. **Troncamento `ledgerChain` a 200 blocchi rompe l'integrità CRDT (`gamesCloudService.js:161` vs `ledger.js:142`):**
   - In scrittura su Firestore la catena viene tagliata con `ledgerChain.slice(-200)` per rispettare il limite delle rules (`size() <= 200`). Se una partita supera 200 eventi, viene perso il blocco `0` (Genesis), facendo fallire `verifyChainIntegrity()` e `reconstructGameStateFromChain()`.
5. **Divergenza ledger su cancellazione di una mano intermedia (`useBurracoGame.js:399-415` vs `ledger.js:245-250`):**
   - `handleDeleteRound` rinumera tutte le mani successive (`roundNumber: newIdx + 1`), ma il replay dell'evento `ROUND_REVERTED` in `ledger.js` filtra il `roundNumber` senza rinumerare le mani rimanenti.
6. **Trofei match-based non sbloccati se il nome in partita non coincide esattamente con `displayName` (`trophies.js:87-90, 122-125, 240-243`):**
   - I trofei *Il Cecchino*, *Pozzetto Express* e *Rimonta Impossibile* usano `(team.players || []).includes(stats.name)` (match esatto case-sensitive), mentre `computeUserCareerStats()` riconosce alias (solo nome, email, lowercase). Un utente Google `"Mario Rossi"` registrato al tavolo come `"Mario"` non sbloccherà mai questi 3 trofei.
7. **Auto-compattazione `safeSetItem` pericolosa per i tornei archiviati (`storageCore.js:60, 71-78`):**
   - In caso di `QuotaExceededError`, la compattazione svuota `rounds: []` anche sulle chiavi `burraco_tournaments*` per indici `>= 20`, perdendo i match dei tornei vecchi in Albo d'Oro.
8. **Partita a 0 mani persa al reload & chiusura forzata su nuova partita (`useBurracoGame.js:49-53, 147-148`):**
   - Ricaricare la pagina prima di registrare la Mano #1 chiude il tavolo attivo tornando alla Lobby. Inoltre, avviare una nuova partita mentre una precedente è in corso chiama `archiveCurrentGame()`, che imposta `isFinished: true` anche se la partita precedente era incompleta.
9. **PIN non mostrato nella barra live del tavolo (`ScoreBoard.jsx:191`):**
   - `ScoreBoard` controlla `activeGame.pin`, ma `NewGameModal` non valorizza mai la proprietà `.pin` (il PIN è calcolato dinamicamente via `computeGameShortPin(game.id)` solo in `CloudSyncModal` e `gamesCloudService`).

### Sicurezza, Performance, PWA e Manutenibilità
- **Sicurezza Firestore (`firestore.rules:342-378`):** `burraco_games` e `burraco_pins` consentono `get`, `create` e `update` anche senza autenticazione (scelta funzionale per consentire tavoli collaborativi guest tramite PIN a 6 cifre). Va valutato il rischio che chiunque conosca/indovini un PIN a 6 cifre possa modificare la partita associata.
- **PWA Installability su iOS/Android:** aggiungere icone PNG `192x192`, `512x512` (anche `maskable`) e `apple-touch-icon` `180x180` PNG, oltre a precachare `/` e gli asset core nel SW (valutare migrazione a `vite-plugin-pwa` / Workbox).
- **Asset di sviluppo in `public/`:** la cartella `public/assets/aistudio/` contiene decine di MB di screenshot temporanei, rimossi solo in build tramite workaround `rmSync` in `vite.config.js` e `ignore` in `firebase.json` — andrebbero rimossi dalla repo.
- **Orientamento mobile (`RoundsHistoryList.jsx:14-19`):** la vista `cards` vs `table` è determinata una sola volta al mount su `window.innerWidth < 768` e non si adatta automaticamente ruotando lo smartphone in orizzontale.
- **Complessità e assenza di TypeScript:** l'intera codebase è in JS non tipizzato e `src/hooks/useBurracoGame.js` concentra ~973 righe di logica eterogenea; introdurre TypeScript (o JSDoc strict) e spezzare l'hook in moduli più piccoli ridurrebbe il rischio di regressioni su payload di partite, tornei e sync cloud.
- **Tema chiaro & Accessibilità:** valutare un 5° tema ad alto contrasto diurno (uso all'aperto), focus-trap nelle modali e supporto `prefers-reduced-motion`.
