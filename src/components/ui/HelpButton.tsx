// src/components/ui/HelpButton.tsx
import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';

interface HelpContent {
  title: string;
  description: string;
  whyUse: string[];
  whenToUse: string[];
  examples: string[];
  tips?: string[];
}

interface HelpButtonProps {
  content: HelpContent;
  size?: 'sm' | 'md' | 'lg';
}

export function HelpButton({ content, size = 'md' }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          sizeClasses[size],
          "text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-all duration-200",
          "hover:scale-110"
        )}
        title="Learn more about this feature"
      >
        <HelpCircle height={14} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-[var(--bg-overlay)] z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="bg-[var(--bg-base)] rounded-2xl border border-[var(--border-default)] shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-subtle)]">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    {content.title}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors duration-200"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                  {/* Description */}
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {content.description}
                  </p>

                  {/* Why Use */}
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                      Why use this?
                    </h3>
                    <ul className="space-y-2">
                      {content.whyUse.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                          <span className="text-[var(--success)] mt-0.5">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* When to Use */}
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                      When to use this?
                    </h3>
                    <ul className="space-y-2">
                      {content.whenToUse.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                          <span className="text-[var(--accent)] mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Examples */}
                  <div>
                    <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--info)]" />
                      Real Examples
                    </h3>
                    <div className="space-y-2">
                      {content.examples.map((example, index) => (
                        <div key={index} className="p-3 rounded-lg bg-[var(--info-subtle)] border border-[var(--border-default)]">
                          <p className="text-sm text-[var(--info-text)]">{example}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips */}
                  {content.tips && content.tips.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
                        Pro Tips
                      </h3>
                      <div className="p-4 rounded-lg bg-[var(--warning-subtle)] border border-[var(--border-default)]">
                        <ul className="space-y-2">
                          {content.tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-[var(--warning-text)]">
                              <span className="text-[var(--warning)]">💡</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-subtle)]">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-sm"
                  >
                    Got it!
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}