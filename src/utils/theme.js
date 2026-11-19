// Gestione dei Temi Visivi del Tavolo da Gioco

export const THEMES = [
  {
    id: 'emerald',
    name: 'Verde Smeraldo',
    subtitle: 'Feltro classico da circolo FIBUR',
    description: 'Il panno verde tradizionale con filigrana dorata dei quattro semi',
    previewBg: 'from-emerald-950 via-emerald-900 to-emerald-950',
    accentBorder: 'border-emerald-500',
    chipBg: 'bg-emerald-500/20 text-emerald-300',
    metaThemeColor: '#08291c',
    iconColor: 'text-emerald-400',
    primarySuit: '♠',
  },
  {
    id: 'navy',
    name: 'Blu Notte Reale',
    subtitle: 'Eleganza e relax per sessioni serali',
    description: 'Tonalità blu zaffiro profondo con dettagli oro e luce soffusa',
    previewBg: 'from-blue-950 via-indigo-950 to-blue-950',
    accentBorder: 'border-blue-400',
    chipBg: 'bg-blue-500/20 text-blue-300',
    metaThemeColor: '#091833',
    iconColor: 'text-blue-400',
    primarySuit: '♦',
  },
  {
    id: 'burgundy',
    name: 'Bordeaux Club Vintage',
    subtitle: 'Atmosfera casinò & salotto privato',
    description: 'Feltro cremisi bordeaux aristocratico con bagliori champagne',
    previewBg: 'from-rose-950 via-red-950 to-rose-950',
    accentBorder: 'border-rose-400',
    chipBg: 'bg-rose-500/20 text-rose-300',
    metaThemeColor: '#280812',
    iconColor: 'text-rose-400',
    primarySuit: '♥',
  },
  {
    id: 'velvet',
    name: 'Dark Velvet / Carbone',
    subtitle: 'Stile contemporaneo ad alto contrasto',
    description: 'Lavagna e ossidiana scura per la massima leggibilità delle carte',
    previewBg: 'from-zinc-950 via-slate-950 to-zinc-950',
    accentBorder: 'border-amber-400',
    chipBg: 'bg-amber-400/20 text-amber-300',
    metaThemeColor: '#121316',
    iconColor: 'text-slate-200',
    primarySuit: '♣',
    isLight: false,
  },
  {
    id: 'daylight',
    name: 'Circolo Diurno',
    subtitle: 'Avorio e Verde Bosco ad alto contrasto',
    description: 'Carta avorio nitida e inchiostro verde bosco per giocare comodamente all’aperto',
    previewBg: 'from-[#f5f1e6] via-[#ece6d6] to-[#e2d9c4]',
    accentBorder: 'border-emerald-700',
    chipBg: 'bg-emerald-700/15 text-emerald-900',
    metaThemeColor: '#f5f1e6',
    iconColor: 'text-emerald-900',
    primarySuit: '♠',
    isLight: true,
  },
];

const THEME_STORAGE_KEY = 'burraco_theme_v1';

export function getStoredTheme() {
  try {
    if (typeof localStorage === 'undefined') return 'emerald';
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && THEMES.some(t => t.id === stored)) {
      return stored;
    }
    return 'emerald';
  } catch {
    return 'emerald';
  }
}

export function applyTheme(themeId) {
  if (typeof document === 'undefined') return;
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  document.documentElement.setAttribute('data-theme', theme.id);
  
  // Aggiorna meta theme-color per la barra del browser su mobile (iOS/Android)
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme.metaThemeColor);
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  } catch {
    // ignore
  }
}
