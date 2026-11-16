import React from 'react';
import { Code } from 'lucide-react';

/**
 * Tag badge esclusivo per lo sviluppatore dell'app — sobrio stile Club Oro & Slate
 */
export default function DeveloperBadge({ size = 'md', showIcon = true, className = '' }) {
  if (size === 'xs') {
    return (
      <span
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-[var(--accent-ring)] text-[var(--accent-gold-bright)] border border-[var(--border-hairline)] select-none shrink-0 ${className}`}
        title="Sviluppatore Ufficiale dell'App"
      >
        {showIcon && <Code className="w-2.5 h-2.5 shrink-0" />}
        <span>Dev</span>
      </span>
    );
  }

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[var(--accent-ring)] text-[var(--accent-gold-bright)] border border-[var(--border-hairline)] select-none shrink-0 ${className}`}
        title="Sviluppatore Ufficiale dell'App"
      >
        {showIcon && <Code className="w-3 h-3 shrink-0" />}
        <span>Developer</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-extrabold uppercase tracking-wider bg-[var(--accent-ring)] text-[var(--accent-gold-bright)] border border-[var(--border-hairline)] select-none shrink-0 ${className}`}
      title="Sviluppatore Ufficiale dell'App"
    >
      {showIcon && <Code className="w-3.5 h-3.5 shrink-0" />}
      <span>Developer</span>
    </span>
  );
}
