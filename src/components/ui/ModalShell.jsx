import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { useModalDialog } from '../../hooks/useModalDialog';

/**
 * Contenitore accessibile standard per modali e bottom-sheet del Club:
 * - role="dialog" + aria-modal="true"
 * - Focus-trap + Escape LIFO + ripristino focus via useModalDialog
 * - overscroll-behavior-y: contain per evitare scroll-chaining su iOS/Android
 */
export default function ModalShell({
  isOpen,
  onClose,
  ariaLabel,
  ariaLabelledBy,
  maxWidthClass = 'max-w-lg',
  centeredOnMobile = false,
  usePortal = false,
  zIndexClass = 'z-50',
  panelClassName = '',
  children,
}) {
  const dialogRef = useRef(null);
  useModalDialog({ isOpen, onClose, dialogRef });

  if (!isOpen) return null;

  const content = (
    <div
      className={`fixed inset-0 ${zIndexClass} flex ${
        centeredOnMobile ? 'items-center p-4' : 'items-end sm:items-center sm:p-4'
      } justify-center bg-black/75 backdrop-blur-sm overflow-hidden`}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${maxWidthClass} club-card-solid ${
          centeredOnMobile ? 'rounded-3xl' : 'rounded-t-3xl sm:rounded-3xl'
        } max-h-[92dvh] flex flex-col overflow-hidden club-sheet-enter focus:outline-none ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  );

  if (usePortal && typeof document !== 'undefined' && document.body) {
    return createPortal(content, document.body);
  }
  return content;
}
