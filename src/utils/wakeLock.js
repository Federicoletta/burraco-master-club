// Gestore Screen Wake Lock per iPad, iPhone e Tablet
// Mantiene lo schermo sempre acceso durante le partite di Burraco
// Utilizza la Screen Wake Lock API nativa con auto-ripristino su cambio scheda e tocco utente

const WAKE_LOCK_PREF_KEY = 'burraco_wakelock_enabled';

class WakeLockManager {
  constructor() {
    this.sentinel = null;
    this.videoFallback = null;
    this.enabled = this.loadPreference();
    this.active = false;
    this.listeners = new Set();
    this.isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
    this.nativeFailed = false;

    if (typeof window !== 'undefined') {
      // 1. Al primo tocco dello schermo, tenta l'attivazione del blocco sonno se abilitato
      const handleFirstTouch = () => {
        if (this.enabled && !this.active) {
          this.requestLock();
        }
        window.removeEventListener('pointerdown', handleFirstTouch);
        window.removeEventListener('touchstart', handleFirstTouch);
      };
      window.addEventListener('pointerdown', handleFirstTouch, { passive: true });
      window.addEventListener('touchstart', handleFirstTouch, { passive: true });

      // 2. Quando l'utente torna sull'app (dopo aver cambiato app o scheda), riacquisisce il Wake Lock
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.enabled) {
          this.requestLock();
        } else if (document.visibilityState === 'hidden') {
          this.active = false;
          this.notify();
        }
      });
    }
  }

  loadPreference() {
    if (typeof localStorage === 'undefined') return true;
    const saved = localStorage.getItem(WAKE_LOCK_PREF_KEY);
    // Di default è ATTIVO (true): chi gioca a Burraco vuole che il tablet resti sempre acceso
    return saved !== null ? saved === 'true' : true;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    const state = {
      enabled: this.enabled,
      active: this.active,
      isSupported: this.isSupported
    };
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch {
        // Ignora errori listener isolati
      }
    }
  }

  async requestLock() {
    if (!this.enabled) return false;

    // Tentativo 1: Screen Wake Lock API nativa (Standard W3C, supportato su iPadOS 16.4+)
    // Se ha già fallito per policy iframe o permessi mancanti, usa direttamente il fallback silente
    if (this.isSupported && !this.nativeFailed) {
      try {
        if (this.sentinel) {
          try {
            await this.sentinel.release();
          } catch {
            // Ignora
          }
        }

        this.sentinel = await navigator.wakeLock.request('screen');
        this.active = true;

        this.sentinel.addEventListener('release', () => {
          this.sentinel = null;
          // Se la pagina è ancora visibile e l'utente lo vuole attivo, riprova a riattivarlo
          if (document.visibilityState === 'visible' && this.enabled) {
            setTimeout(() => this.requestLock(), 1000);
          } else {
            this.active = false;
            this.notify();
          }
        });

        this.notify();
        return true;
      } catch {
        // In iframe o contesti protetti, la richiesta nativa può fallire: disabilita tentativi ripetuti
        this.nativeFailed = true;
      }
    }

    // Tentativo 2: Fallback tramite micro-video invisibile loop (per Safari iOS legacy o iframe)
    this.startVideoFallback();
    return true;
  }

  startVideoFallback() {
    if (typeof document === 'undefined') return;

    if (!this.videoFallback) {
      const video = document.createElement('video');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.muted = true;
      video.loop = true;
      video.style.position = 'fixed';
      video.style.top = '-9999px';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0.01';
      video.style.pointerEvents = 'none';

      // Micro video vuoto base64 (1 secondo silente)
      video.src = 'data:video/mp4;base64,AAAAHGZ0eXBpc29tAAAAAGlzb21tcDQyAAAAAGZyZWUAAAAmbWRhdAAAAAAAC7ve/w==';
      document.body.appendChild(video);
      this.videoFallback = video;
    }

    try {
      const playPromise = this.videoFallback.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.active = true;
            this.notify();
          })
          .catch(() => {
            // Riproduzione non riuscita prima del tocco utente
          });
      }
    } catch {
      // Ignora silente
    }
  }

  stopVideoFallback() {
    if (this.videoFallback) {
      try {
        this.videoFallback.pause();
      } catch {
        // Ignora
      }
    }
  }

  async releaseLock() {
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch {
        // Ignora
      }
      this.sentinel = null;
    }

    this.stopVideoFallback();
    this.active = false;
    this.notify();
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WAKE_LOCK_PREF_KEY, String(this.enabled));
    }

    if (this.enabled) {
      this.nativeFailed = false;
      this.requestLock();
    } else {
      this.releaseLock();
    }
    this.notify();
  }

  toggle() {
    this.setEnabled(!this.enabled);
  }
}

export const wakeLock = new WakeLockManager();
