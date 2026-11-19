import { useModalDialog } from './useModalDialog';

/**
 * Chiude automaticamente i modali alla pressione del tasto Escape (stack LIFO),
 * gestisce scroll-lock e ripristino del focus. Se viene passato dialogRef, attiva anche il focus-trap.
 */
export function useModalEscape(isOpen, onClose, dialogRef = null) {
  useModalDialog({ isOpen, onClose, dialogRef });
}
