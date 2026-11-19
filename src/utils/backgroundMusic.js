// Gestore Musica di Sottofondo Professionale ad Alta Fedeltà (Brani Reali Studio Recording)
// Tracce acustiche autentiche (Pianoforte, Contrabbasso, Vibrafono, Spazzole) in formato MP3
// Supporto streaming progressivo, loop continuo, regolazione volume iPad/Mobile e zero glitch

import { getSharedAudioContext } from './soundEffects';

const MUSIC_ENABLED_KEY = 'burraco_music_enabled';
const MUSIC_VOLUME_KEY = 'burraco_music_volume';
const MUSIC_TRACK_KEY = 'burraco_music_track';

export const MUSIC_TRACKS = [
  {
    id: 'lounge',
    name: 'Rollin at 5 (Swing Club)',
    artist: 'Rollin at 5',
    subtitle: 'Il classico: swing brillante, piano acustico, contrabbasso & fiati',
    icon: '🎷',
    file: '/audio/jazz-lounge.mp3'
  },
  {
    id: 'bass-walker',
    name: 'Walking Bass Groove',
    artist: 'Bass Walker',
    subtitle: 'Contrabbasso walking incalzante, piano swing e spazzole al tavolo',
    icon: '🎻',
    file: '/audio/bass-walker.mp3'
  },
  {
    id: 'hot-swing',
    name: 'Hot Big Band Swing',
    artist: 'Hot Swing',
    subtitle: 'Swing vivace anni \'30, fiati trascinanti e ritmo da casinò',
    icon: '🎺',
    file: '/audio/hot-swing.mp3'
  },
  {
    id: 'backbay',
    name: 'Backbay Lounge',
    artist: 'Backbay Lounge',
    subtitle: 'Cool jazz raffinato: chitarra jazz, piano e contrabbasso felpato',
    icon: '🍸',
    file: '/audio/backbay-lounge.mp3'
  },
  {
    id: 'shades',
    name: 'Shades of Spring',
    artist: 'Shades of Spring',
    subtitle: 'Jazz club acustico distensivo, trio pianoforte e spazzole',
    icon: '🎹',
    file: '/audio/shades-of-spring.mp3'
  }
];

class BackgroundMusicManager {
  constructor() {
    this.audio = null;
    this.ctx = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.trackId = this.loadTrack();
    this.volume = this.loadVolume();
    this.enabled = this.loadEnabled();
    this.listeners = new Set();
    this.fadeInterval = null;

    // Se l'utente aveva la musica attiva in una sessione precedente,
    // prepariamo l'auto-avvio al primo tocco sullo schermo (richiesto da iOS/Safari)
    if (typeof window !== 'undefined') {
      const handleFirstInteraction = () => {
        if (this.enabled && !this.isPlaying) {
          this.play();
        }
      };
      window.addEventListener('pointerdown', handleFirstInteraction, { once: true, passive: true });
      window.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });
    }
  }

  loadEnabled() {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(MUSIC_ENABLED_KEY) === 'true';
  }

  loadVolume() {
    if (typeof localStorage === 'undefined') return 0.5;
    const saved = localStorage.getItem(MUSIC_VOLUME_KEY);
    return saved !== null ? Math.max(0, Math.min(1, parseFloat(saved))) : 0.5;
  }

  loadTrack() {
    if (typeof localStorage === 'undefined') return 'lounge';
    const saved = localStorage.getItem(MUSIC_TRACK_KEY);
    return MUSIC_TRACKS.some(t => t.id === saved) ? saved : 'lounge';
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    const state = {
      isPlaying: this.isPlaying,
      volume: this.volume,
      trackId: this.trackId,
      enabled: this.enabled
    };
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in music listener:', err);
      }
    }
  }

  initAudioElement() {
    if (typeof window === 'undefined') return;

    if (!this.audio) {
      this.audio = new Audio();
      this.audio.loop = true;
      this.audio.preload = 'none';
      this.audio.crossOrigin = 'anonymous';

      // Sincronizza stato se l'utente mette in pausa dal centro di controllo del dispositivo
      this.audio.addEventListener('play', () => {
        this.isPlaying = true;
        this.notify();
      });
      this.audio.addEventListener('pause', () => {
        this.isPlaying = false;
        this.notify();
      });
    }

    // Collega l'elemento audio al GainNode di Web Audio per permettere la regolazione volume su iPad/iOS
    try {
      if (!this.ctx) {
        this.ctx = getSharedAudioContext();
      }
      if (this.ctx && !this.gainNode) {
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);

        if (!this.sourceNode && this.audio) {
          this.sourceNode = this.ctx.createMediaElementSource(this.audio);
          this.sourceNode.connect(this.gainNode);
          this.gainNode.connect(this.ctx.destination);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch {
      // In caso di browser con restrizioni di routing, fallback nativo a audio.volume
    }

    // Imposta volume nativo per browser desktop e Android
    if (this.audio) {
      try {
        this.audio.volume = this.volume;
      } catch {
        // Ignora su dispositivi in cui volume è readonly
      }
    }
  }

  getCurrentTrack() {
    return MUSIC_TRACKS.find(t => t.id === this.trackId) || MUSIC_TRACKS[0];
  }

  play() {
    try {
      this.initAudioElement();
      if (!this.audio) return;

      const track = this.getCurrentTrack();
      const currentSrc = this.audio.getAttribute('src');

      // Se la sorgente è diversa, carica la nuova traccia
      if (!currentSrc || !currentSrc.includes(track.file)) {
        this.audio.src = track.file;
        this.audio.load();
      }

      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.enabled = true;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(MUSIC_ENABLED_KEY, 'true');
      }

      // Applica volume
      this.applyVolume(this.volume);

      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isPlaying = true;
            this.notify();
          })
          .catch((err) => {
            console.warn('Autoplay prevented or audio load pending:', err);
          });
      }
    } catch (err) {
      console.error('Failed to play background music:', err);
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    }
    this.isPlaying = false;
    this.enabled = false;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MUSIC_ENABLED_KEY, 'false');
    }
    this.notify();
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  setTrack(newTrackId) {
    if (!MUSIC_TRACKS.some(t => t.id === newTrackId)) return;
    this.trackId = newTrackId;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MUSIC_TRACK_KEY, newTrackId);
    }

    if (this.isPlaying) {
      // Cambio traccia istantaneo e fluido
      const track = this.getCurrentTrack();
      if (this.audio) {
        this.audio.src = track.file;
        this.audio.load();
        this.applyVolume(this.volume);
        this.audio.play().catch(() => {});
      }
    }

    this.notify();
  }

  setVolume(newVol) {
    const val = Math.max(0, Math.min(1, parseFloat(newVol)));
    this.volume = val;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MUSIC_VOLUME_KEY, String(val));
    }

    this.applyVolume(val);
    this.notify();
  }

  applyVolume(val) {
    // 1. Applica al GainNode Web Audio (necessario per iPadOS / iOS Safari)
    if (this.ctx && this.gainNode) {
      try {
        const now = this.ctx.currentTime;
        this.gainNode.gain.cancelScheduledValues(now);
        this.gainNode.gain.setValueAtTime(val, now);
      } catch {
        // Fallback
      }
    }

    // 2. Applica all'elemento audio nativo
    if (this.audio) {
      try {
        this.audio.volume = val;
      } catch {
        // Ignora su browser dove audio.volume è bloccato
      }
    }
  }
}

// Singleton condiviso
export const bgMusic = new BackgroundMusicManager();
