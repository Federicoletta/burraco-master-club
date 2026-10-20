import { describe, it, expect, beforeEach } from 'vitest';
import { THEMES, getStoredTheme, applyTheme } from '../src/utils/theme';

// Mock localStorage per ambiente Node
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock;

// Mock document per ambiente Node
const attributes = {};
const metaElement = {
  attrs: {},
  setAttribute(k, v) {
    this.attrs[k] = v;
  },
  getAttribute(k) {
    return this.attrs[k];
  },
};

global.document = {
  documentElement: {
    setAttribute: (k, v) => {
      attributes[k] = v;
    },
    getAttribute: (k) => attributes[k],
    removeAttribute: (k) => {
      delete attributes[k];
    },
  },
  querySelector: (sel) => {
    if (sel === 'meta[name="theme-color"]') {
      return metaElement;
    }
    return null;
  },
};

describe('Theme Management Utility (Panno del Tavolo)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    metaElement.attrs = {};
  });

  it('contains the 4 official Burraco felt themes', () => {
    expect(THEMES).toHaveLength(4);
    const ids = THEMES.map(t => t.id);
    expect(ids).toEqual(['emerald', 'navy', 'burgundy', 'velvet']);
  });

  it('returns default theme emerald when nothing is stored', () => {
    expect(getStoredTheme()).toBe('emerald');
  });

  it('returns stored theme if valid', () => {
    localStorage.setItem('burraco_theme_v1', 'navy');
    expect(getStoredTheme()).toBe('navy');

    localStorage.setItem('burraco_theme_v1', 'burgundy');
    expect(getStoredTheme()).toBe('burgundy');

    localStorage.setItem('burraco_theme_v1', 'velvet');
    expect(getStoredTheme()).toBe('velvet');
  });

  it('falls back to emerald if stored theme is unrecognized', () => {
    localStorage.setItem('burraco_theme_v1', 'neon_pink');
    expect(getStoredTheme()).toBe('emerald');
  });

  it('applies theme to documentElement attribute and localStorage', () => {
    applyTheme('navy');

    expect(document.documentElement.getAttribute('data-theme')).toBe('navy');
    expect(localStorage.getItem('burraco_theme_v1')).toBe('navy');
  });

  it('updates meta[name="theme-color"] if present in document', () => {
    applyTheme('burgundy');
    expect(metaElement.getAttribute('content')).toBe('#280812');

    applyTheme('velvet');
    expect(metaElement.getAttribute('content')).toBe('#121316');
  });

  it('falls back to first theme if applyTheme is called with invalid ID', () => {
    applyTheme('non_existent');
    expect(document.documentElement.getAttribute('data-theme')).toBe('emerald');
    expect(localStorage.getItem('burraco_theme_v1')).toBe('emerald');
  });
});
