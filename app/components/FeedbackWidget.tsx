/**
 * FeedbackWidget Component
 * Clean, one-click feedback interface
 */

'use client';

import { useState } from 'react';

interface FeedbackWidgetProps {
  imageId: string;
  responseId: string;
  onSubmit?: (rating: string) => void;
}

export default function FeedbackWidget({ imageId, responseId, onSubmit }: FeedbackWidgetProps) {
  const [selectedRating, setSelectedRating] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleFeedback = async (rating: string) => {
    setSelectedRating(rating);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, responseId, rating }),
      });
      const data = await res.json();
      setMessage(data.message || 'Thank you for your feedback!');
      if (onSubmit) onSubmit(rating);
    } catch {
      setMessage('Thanks for letting us know!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const options = [
    { value: 'yes', label: 'Yes', emoji: '✨', color: 'hover:bg-green-500/10 hover:border-green-500/40 hover:text-green-300' },
    { value: 'partially', label: 'Partially', emoji: '👌', color: 'hover:bg-yellow-500/10 hover:border-yellow-500/40 hover:text-yellow-300' },
    { value: 'no', label: 'No', emoji: '🔄', color: 'hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-300' }
  ];

  if (selectedRating && message) {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-300">
        Does this image represent your day?
      </p>
      <div className="flex gap-3">
        {options.map(({ value, label, emoji, color }) => (
          <button
            key={value}
            onClick={() => handleFeedback(value)}
            disabled={isSubmitting}
            className={`flex-1 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 font-medium text-sm transition-all ${color} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span className="mr-1.5">{emoji}</span>
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Your feedback helps personalize future generations
      </p>
    </div>
  );
}
