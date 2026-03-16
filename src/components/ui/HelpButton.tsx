import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './GlassCard';

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
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <>
      <button
        type='button'
        onClick={() => setIsOpen(true)}
        className={`${sizeClasses[size]} text-gray-400 hover:text-primary transition-colors`}
        title="Learn more about this feature"
      >
        <HelpCircle />
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
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
            >
              <GlassCard className="p-6 max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-deep-ink">{content.title}</h2>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Description */}
                <p className="text-gray-600 mb-6">{content.description}</p>

                {/* Why Use */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-deep-ink mb-3 flex items-center">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                    Why use this?
                  </h3>
                  <ul className="space-y-2">
                    {content.whyUse.map((item, index) => (
                      <li key={index} className="flex items-start text-gray-700">
                        <span className="text-primary mr-2">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* When to Use */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-deep-ink mb-3 flex items-center">
                    <span className="w-2 h-2 bg-accent rounded-full mr-2"></span>
                    When to use this?
                  </h3>
                  <ul className="space-y-2">
                    {content.whenToUse.map((item, index) => (
                      <li key={index} className="flex items-start text-gray-700">
                        <span className="text-accent mr-2">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Examples */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-deep-ink mb-3 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Real Examples
                  </h3>
                  <div className="space-y-3">
                    {content.examples.map((example, index) => (
                      <div key={index} className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-gray-700">📌 {example}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                {content.tips && (
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-deep-ink mb-3 flex items-center">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      Pro Tips
                    </h3>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <ul className="space-y-2">
                        {content.tips.map((tip, index) => (
                          <li key={index} className="flex items-start text-gray-700">
                            <span className="text-yellow-600 mr-2">💡</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}