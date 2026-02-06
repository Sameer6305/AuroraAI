/**
 * GeneratingLoader Component
 * Specialized loader for AI generation process
 */

'use client';

import { useEffect, useState } from 'react';

const stages = [
  { label: "Analyzing your reflection...", emoji: "🧠" },
  { label: "Detecting emotion & theme...", emoji: "🎭" },
  { label: "Crafting AI prompt...", emoji: "✨" },
  { label: "Generating image...", emoji: "🎨" },
  { label: "Adding final touches...", emoji: "✨" }
];

export default function GeneratingLoader() {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % stages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="text-6xl mb-4 animate-bounce">{stages[currentStage].emoji}</div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <h3 className="text-xl font-semibold text-gray-200 mb-2">Creating Your Reflection</h3>
        <p className="text-sm text-gray-400">{stages[currentStage].label}</p>
        <p className="text-xs text-gray-500 mt-4">This usually takes 10-30 seconds</p>
      </div>
    </div>
  );
}
