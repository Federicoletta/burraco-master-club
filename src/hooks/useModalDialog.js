import { useEffect, useId, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// Stack LIFO condiviso tra tutte le modali aperte (es. ConfirmModal sopra RoundCalculatorModal)
const modalStack = [];
let bodyLockCount = 0;
let previousBodyOverflow = '';

function getFocusableElements(container) {
  if (!container || typeof container.querySelectorAll !== 'function') return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (typeof el.offsetParent !== 'undefined' && el.offsetParent === null) {
      // Fallback per JSDOM/ambienti test dove offsetParent può essere null
      const style = typeof window !== 'undefined' && window.getComputedStyle
        ? window.getComputedStyle(el)
        : null;
      if (style && (style.display === 'none' || style.visibility === 'hidden')) {
        return false;
      }
    }
    return true;
  });
}

function lockBodyScroll() {
  if (typeof document === 'undefined' || !document.body) return;
  if (bodyLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  bodyLockCount += 1;
}

function unlockBodyScroll() {
  if (typeof document === 'undefined' || !document.body) return;
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
}

/**
 * Hook accessibile unificato per tutte le modali:
 * - Stack LIFO per Escape (chiude solo la modale in primo piano)
 * - Focus-trap Tab / Shift+Tab dentro dialogRef (se fornito)
 * - Ripristino del focus sull'elemento precedente alla chiusura
 * - Body scroll-lock con reference counting (safe per modali annidate)
 */
export function useModalDialog({
  isOpen,
  onClose,
  dialogRef = null,
  lockScroll = true,
  restoreFocus = true,
} = {}) {
  const modalId = useId();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    const previouslyFocused = document.activeElement;
    const entry = {
      id: modalId,
      close: () => {
        if (typeof onCloseRef.current === 'function') {
          onCloseRef.current();
        }
      },
    };
    modalStack.push(entry);

    if (lockScroll) {
      lockBodyScroll();
    }

    // Sposta il focus dentro il dialog all'apertura (se dialogRef è collegato)
    const rafId = typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame(() => {
          const container = dialogRef?.current;
          if (!container) return;
          if (container.contains(document.activeElement)) return;
          const focusables = getFocusableElements(container);
          if (focusables.length > 0 && typeof focusables[0].focus === 'function') {
            focusables[0].focus();
          } else if (typeof container.focus === 'function') {
            container.focus();
          }
        })
      : null;

    const handleKeyDown = (event) => {
      const topEntry = modalStack[modalStack.length - 1];
      if (!topEntry || topEntry.id !== modalId) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        topEntry.close();
        return;
      }

      if (event.key === 'Tab' && dialogRef?.current) {
        const focusables = getFocusableElements(dialogRef.current);
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (event.shiftKey) {
          if (active === first || !dialogRef.current.contains(active)) {
            event.preventDefault();
            last.focus();
          }
        } else if (active === last || !dialogRef.current.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      if (rafId !== null && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('keydown', handleKeyDown, true);

      const idx = modalStack.findIndex((item) => item.id === modalId);
      if (idx !== -1) {
        modalStack.splice(idx, 1);
      }

      if (lockScroll) {
        unlockBodyScroll();
      }

      if (
        restoreFocus &&
        previouslyFocused &&
        typeof previouslyFocused.focus === 'function' &&
        (typeof previouslyFocused.isConnected === 'undefined' || previouslyFocused.isConnected)
      ) {
        try {
          previouslyFocused.focus();
        } catch {
          // ignore focus errors on detached elements
        }
      }
    };
  }, [isOpen, modalId, dialogRef, lockScroll, restoreFocus]);
}

/**
 * Helper di test per ispezionare lo stato dello stack LIFO.
 */
export function _getOpenModalStackSize() {
  return modalStack.length;
}
