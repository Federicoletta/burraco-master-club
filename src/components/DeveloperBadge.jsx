import React from 'react';
import { Code } from 'lucide-react';
export { isDeveloperAccount } from '../utils/developer';

/**
 * Tag badge esclusivo per lo sviluppatore dell'app
 */
export default function DeveloperBadge({ size = 'md', showIcon = true, className = '' }) {
  if (size === 'xs') {
    return (
      <span
        className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-300 border border-cyan-400/50 shadow-[0_0_6px_rgba(6,182,212,0.35)] select-none shrink-0 ${className}`}
        title="Sviluppatore Ufficiale dell'App"
      >
        {showIcon && <Code className="w-2 h-2 text-cyan-400" />}
        <span>Dev</span>
      </span>
    );
  }

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500/25 via-blue-500/20 to-purple-500/25 text-cyan-300 border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.35)] select-none shrink-0 ${className}`}
        title="Sviluppatore Ufficiale dell'App"
      >
        {showIcon && <Code className="w-2.5 h-2.5 text-cyan-400" />}
        <span>Developer</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500/25 via-indigo-500/20 to-purple-500/25 text-cyan-200 border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.4)] select-none shrink-0 ${className}`}
      title="Sviluppatore Ufficiale dell'App"
    >
      {showIcon && <Code className="w-3.5 h-3.5 text-cyan-400" />}
      <span>Developer</span>
    </span>
  );
}
