import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

describe('Responsive Layout, Accessibility & Daylight Theme Guarantees', () => {
  it('defines the 5th high-contrast daylight theme and a11y/mobile CSS ergonomics in src/index.css', () => {
    const css = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');

    // 5th light theme
    expect(css).toContain('[data-theme="daylight"]');
    expect(css).toContain('--surface-canvas: #f5f1e6');
    expect(css).toContain('.club-text-primary');
    expect(css).toContain('.club-row-bg');

    // Zero horizontal overflow & iOS mobile input ergonomics (>= 16px)
    expect(css).toContain('overflow-x: clip');
    expect(css).toMatch(/font-size:\s*max\(16px,\s*1em\)/);

    // Modal overscroll containment
    expect(css).toContain('overscroll-behavior-y: contain');

    // Keyboard accessibility & reduced motion
    expect(css).toContain(':focus-visible');
    expect(css).toContain('prefers-reduced-motion: reduce');
  });

  it('uses matchMedia listener for dynamic orientation switching in RoundsHistoryList', () => {
    const src = fs.readFileSync(
      path.join(root, 'src/components/scoreboard/RoundsHistoryList.jsx'),
      'utf8'
    );
    expect(src).toContain("'(min-width: 768px)'");
    expect(src).toContain('window.matchMedia');
    expect(src).toContain('addEventListener');
    expect(src).toContain('export default memo(RoundsHistoryList)');
  });

  it('implements LIFO Escape stack, focus-trap, focus restoration, and ref-counted scroll lock in useModalDialog', () => {
    const dialogSrc = fs.readFileSync(path.join(root, 'src/hooks/useModalDialog.js'), 'utf8');
    const escapeSrc = fs.readFileSync(path.join(root, 'src/hooks/useModalEscape.js'), 'utf8');

    expect(dialogSrc).toContain('modalStack');
    expect(dialogSrc).toContain('bodyLockCount');
    expect(dialogSrc).toContain("event.key === 'Escape'");
    expect(dialogSrc).toContain("event.key === 'Tab'");
    expect(dialogSrc).toContain('previouslyFocused.focus');
    expect(escapeSrc).toContain('useModalDialog');
  });

  it('never uses !important hacks to override text-white on light theme', () => {
    const css = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8');
    expect(css).not.toMatch(/\[data-theme="daylight"\][^{]*\.text-white/);
  });

  it('includes inputMode="numeric" on numeric fields in HomeLobby and TournamentHub', () => {
    const homeLobby = fs.readFileSync(path.join(root, 'src/components/HomeLobby.jsx'), 'utf8');
    const tournamentHub = fs.readFileSync(
      path.join(root, 'src/components/tournament/TournamentHub.jsx'),
      'utf8'
    );
    expect(homeLobby).toContain('inputMode="numeric"');
    expect(tournamentHub).toContain('inputMode="numeric"');
  });
});
