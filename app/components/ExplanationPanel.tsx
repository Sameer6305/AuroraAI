/**
 * ExplanationPanel Component
 * Slide-out panel for Explainable AI details
 */

'use client';

import { useEffect } from 'react';

interface ExplanationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: Record<string, string> | null;
}

export default function ExplanationPanel({ isOpen, onClose, explanation }: ExplanationPanelProps) {
  // Close on Escape key
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
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!explanation) return null;

  const sections = [
    { key: 'whatYouShared', icon: '💬', title: 'What You Shared' },
    { key: 'emotionDetected', icon: '🎭', title: 'Emotion Detected' },
    { key: 'whyThisEmotion', icon: '🔍', title: 'Why This Emotion' },
    { key: 'themeIdentified', icon: '📌', title: 'Theme Identified' },
    { key: 'howPromptDesigned', icon: '✨', title: 'How Prompt Was Designed' },
    { key: 'whyThisVisualStyle', icon: '🎨', title: 'Why This Visual Style' },
    { key: 'whyTheseColors', icon: '🌈', title: 'Why These Colors' },
    { key: 'compositionDecisions', icon: '🖼️', title: 'Composition Decisions' }
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-[#0a0a0a] border-l border-white/10 z-50 overflow-y-auto transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-100">Why This Image?</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-gray-200"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <p className="text-sm text-gray-400 leading-relaxed">
            Every AI decision is transparent. Here's how your reflection was transformed into visual art.
          </p>

          {sections.map(({ key, icon, title }) => {
            const content = explanation[key];
            if (!content) return null;

            return (
              <div key={key} className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                  <span>{icon}</span>
                  {title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed pl-7">
                  {content}
                </p>
              </div>
            );
          })}

          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong>Explainable AI:</strong> This transparency ensures you understand how your personal data influences AI decisions, building trust and accountability.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
