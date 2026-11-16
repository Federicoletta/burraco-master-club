# ♣ Burraco Master Club

PWA professionale, moderna ed elegante per il segnapunti e la gestione delle partite di **Burraco** (a Coppie 2v2, Singolo 1v1, A Tre), tornei federali, statistiche carriera e sincronizzazione cloud in tempo reale.

Disponibile online: **[https://burraco-score-fedec.web.app](https://burraco-score-fedec.web.app)**

---

## ✨ Funzionalità Principali

* **🎴 Calcolatore Smazzata Intelligente**:
  * Inserimento rapido di carte, burrachi (puliti, semipuliti da 150 pt, sporchi), pozzetti e chiusura.
  * Tastierino ergonomico integrato con incrementi rapidi (+5, +10, +20, +50, +100).
  * Modalità affiancata (Side-by-Side) ottimizzata per iPad e tablet.
  * Scontrino riepilogativo trasparente della mano.

* **🪑 Tavolo da Gioco Virtuale (Dark Luxury Felt)**:
  * Pianta dall'alto realistica in panno verde smeraldo con finiture dorate e poltrone tattili.
  * Assegnazione immediata dei giocatori al tavolo con avanzamento automatico.
  * Funzioni tattiche al centro del tavolo: *Sorteggia Posti*, *Scambia Partner*, *Inverti Squadre*.

* **👥 Profilo Club & Statistiche Carriera**:
  * Tracciamento partite giocate, vinte, perse e percentuale di vittoria (Win Rate).
  * Record di punti personali e trofei sbloccati.
  * Rubrica amici Google e gestione amici preferiti con stella ⭐.

* **🏆 Modalità Torneo a Gironi & Eliminazione Diretta**:
  * Gestione tabellone completo con avanzamento turni e calcolo differenziale punti.

* **🛡️ Affidabilità & Architettura Offline-First**:
  * Sincronizzazione automatica su Google Cloud Firebase Firestore.
  * Coda transazionale Outbox per giocare anche in caso di disconnessione o assenza di segnale.
  * Paracadute Stateless (condivisione stato partita via URL compresso e token crittografato).

---

## 🛠️ Stack Tecnologico

* **Frontend**: [React 19](https://react.dev/), [Vite](https://vite.dev/), [Tailwind CSS](https://tailwindcss.com/)
* **Icone & UI**: [Lucide React](https://lucide.dev/), Canvas Confetti
* **Audio**: Web Audio API con sintesi sonora procedurale offline
* **Database & Auth**: [Google Firebase](https://firebase.google.com/) (Firestore & Authentication)
* **Testing**: [Vitest](https://vitest.dev/) (suite completa di 87 unit & integration test)

---

## 🚀 Avvio Rapido Locale

### Prerequisiti
* [Node.js](https://nodejs.org/) (versione 18 o superiore raccomandata)
* npm o pnpm

### Installazione
```bash
# Clona il repository
git clone https://github.com/Federicoletta/burraco-master-club.git
cd burraco-master-club

# Installa le dipendenze
npm install

# Configura le variabili d'ambiente (opzionale se usi il progetto predefinito)
cp .env.example .env

# Avvia il server di sviluppo locale
npm run dev
```

### Test & Build
```bash
# Esegui la suite di test
npm run test

# Compila il bundle di produzione
npm run build
```

---

## 📄 Licenza
Progetto ad uso personale e per club di Burraco. Tutti i diritti riservati.
