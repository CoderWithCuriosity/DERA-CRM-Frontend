import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, description, children, footer, maxWidth = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--bg-overlay)] z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'w-full rounded-[var(--radius-2xl)] border border-[var(--border-default)]',
                'bg-[var(--bg-base)] shadow-modal',
                'flex flex-col max-h-[90vh]',
                maxWidthClasses[maxWidth]
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {(title || description) && (
                <div className="flex items-start justify-between p-5 border-b border-[var(--border-default)] flex-shrink-0">
                  <div>
                    {title && (
                      <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-[var(--text-primary)]">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="text-[12px] text-[var(--text-secondary)] mt-1">{description}</p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-[var(--radius-md)] hover:bg-[var(--bg-subtle)] transition-colors text-[var(--text-tertiary)]"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-5">{children}</div>
              {footer && (
                <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--border-default)] flex-shrink-0">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}