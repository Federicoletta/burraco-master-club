import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock firebase/auth & firebase/firestore prima di importare authService/firebaseClient
const mockSignInWithPopup = vi.fn();
const mockSignInWithRedirect = vi.fn();
const mockGetRedirectResult = vi.fn();
const mockOnSnapshot = vi.fn();

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class MockGoogleAuthProvider {},
  signInWithPopup: (...args) => mockSignInWithPopup(...args),
  signInWithRedirect: (...args) => mockSignInWithRedirect(...args),
  getRedirectResult: (...args) => mockGetRedirectResult(...args),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(() => () => {}),
  getAdditionalUserInfo: vi.fn(() => ({ isNewUser: false })),
  getAuth: vi.fn(() => ({ currentUser: null })),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  setDoc: vi.fn(async () => {}),
  getDocFromServer: vi.fn(async () => ({})),
  getDocs: vi.fn(async () => ({ forEach: () => {} })),
  getFirestore: vi.fn(() => ({})),
  initializeFirestore: vi.fn(() => ({})),
  memoryLocalCache: vi.fn(() => ({})),
  onSnapshot: (...args) => mockOnSnapshot(...args),
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => [{}]),
  getApp: vi.fn(() => ({})),
}));

describe('Audio Bandwidth Guard (preload="none") & iOS PWA Auth Fallback & Listener Cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('configura preload="none" sugli MP3 e non carica alcuna sorgente audio finché play() non viene invocato', async () => {
    const createdInstances = [];
    class FakeAudio {
      constructor() {
        this.loop = false;
        this.preload = 'auto';
        this.crossOrigin = null;
        this.src = '';
        this.volume = 1;
        this.load = vi.fn();
        this.play = vi.fn(() => Promise.resolve());
        this.pause = vi.fn();
        this.addEventListener = vi.fn();
        this.getAttribute = (attr) => (attr === 'src' ? this.src : null);
        createdInstances.push(this);
      }
    }

    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('Audio', FakeAudio);

    const { bgMusic } = await import('../src/utils/backgroundMusic');
    // Reset istanza singleton per test pulito
    bgMusic.audio = null;
    bgMusic.isPlaying = false;

    // Prima di play(): nessun elemento Audio creato, zero download
    expect(createdInstances).toHaveLength(0);

    bgMusic.initAudioElement();
    expect(createdInstances).toHaveLength(1);
    expect(createdInstances[0].preload).toBe('none');
    expect(createdInstances[0].src).toBe('');
  });

  it('usa signInWithPopup normalmente e attiva fallback signInWithRedirect su auth/popup-blocked fuori da iframe', async () => {
    const mockWin = {};
    mockWin.self = mockWin;
    mockWin.top = mockWin;
    mockWin.navigator = { standalone: false };
    mockWin.matchMedia = () => ({ matches: false });
    vi.stubGlobal('window', mockWin);
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Chrome/120', platform: 'Linux', maxTouchPoints: 0 });

    const authService = await import('../src/services/authService');

    mockSignInWithPopup.mockRejectedValueOnce({ code: 'auth/popup-blocked', message: 'Popup blocked' });
    mockSignInWithRedirect.mockResolvedValueOnce(undefined);

    const res = await authService.loginWithGoogle();
    expect(res).toBeNull();
    expect(mockSignInWithPopup).toHaveBeenCalledTimes(1);
    expect(mockSignInWithRedirect).toHaveBeenCalledTimes(1);
  });

  it('usa direttamente signInWithRedirect su iOS PWA standalone (fuori da iframe)', async () => {
    const mockWin = {};
    mockWin.self = mockWin;
    mockWin.top = mockWin;
    mockWin.navigator = { standalone: true };
    mockWin.matchMedia = () => ({ matches: true });
    vi.stubGlobal('window', mockWin);
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', platform: 'iPhone', maxTouchPoints: 5 });

    const authService = await import('../src/services/authService');
    expect(authService.isStandaloneIOS()).toBe(true);

    mockSignInWithRedirect.mockResolvedValueOnce(undefined);
    await authService.loginWithGoogle();
    expect(mockSignInWithRedirect).toHaveBeenCalledTimes(1);
    expect(mockSignInWithPopup).not.toHaveBeenCalled();
  });

  it('mantiene signInWithPopup dentro un iframe anche se il popup fallisce (niente redirect in iframe)', async () => {
    const mockWin = { self: {}, top: {}, navigator: { standalone: true }, matchMedia: () => ({ matches: true }) };
    vi.stubGlobal('window', mockWin);
    vi.stubGlobal('navigator', { userAgent: 'iPhone', platform: 'iPhone', maxTouchPoints: 5 });

    const authService = await import('../src/services/authService');
    expect(authService.isInsideIframe()).toBe(true);

    mockSignInWithPopup.mockRejectedValueOnce({ code: 'auth/popup-blocked' });
    await expect(authService.loginWithGoogle()).rejects.toMatchObject({ code: 'auth/popup-blocked' });
    expect(mockSignInWithRedirect).not.toHaveBeenCalled();
  });

  it('subscribeWithOrderFallback chiude pulitamente sia il listener primario che il fallback senza leak', async () => {
    const unsub1 = vi.fn();
    const unsub2 = vi.fn();
    let triggerError1 = null;

    mockOnSnapshot
      .mockImplementationOnce((_q, _onNext, onErr) => {
        triggerError1 = onErr;
        return unsub1;
      })
      .mockImplementationOnce((_q, onNext) => {
        onNext({ docs: [] });
        return unsub2;
      });

    const { subscribeWithOrderFallback } = await import('../src/services/firebaseClient');
    const onData = vi.fn();
    const unsub = subscribeWithOrderFallback('qOrdered', 'qFallback', onData, 'burraco_games');

    // Simula errore indice mancante -> passa al fallback
    triggerError1({ code: 'failed-precondition', message: 'requires an index' });
    expect(unsub1).toHaveBeenCalledTimes(1);
    expect(onData).toHaveBeenCalledTimes(1);

    // Chiamata cleanup finale -> chiude anche il listener fallback
    unsub();
    expect(unsub2).toHaveBeenCalledTimes(1);
  });
});
