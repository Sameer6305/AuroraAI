/**
 * EmotionBadge Component
 * Unified emotion badge with consistent styling
 */

const EMOTION_COLORS: Record<string, string> = {
  happy: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  calm: 'bg-blue-400/10 text-blue-300 border-blue-400/30',
  motivated: 'bg-red-500/10 text-red-300 border-red-500/30',
  grateful: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  stressed: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  anxious: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
  overwhelmed: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  tired: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
  sad: 'bg-blue-600/10 text-blue-400 border-blue-600/30',
  frustrated: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  neutral: 'bg-gray-400/10 text-gray-300 border-gray-400/30',
  confident: 'bg-purple-400/10 text-purple-300 border-purple-400/30',
  excited: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
  reflective: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
};

const EMOTION_EMOJIS: Record<string, string> = {
  happy: '😊', calm: '😌', motivated: '🔥', grateful: '🙏',
  stressed: '😰', anxious: '😟', overwhelmed: '🤯', tired: '😴',
  sad: '😢', frustrated: '😤', neutral: '😐', confident: '💪',
  excited: '🎉', reflective: '🤔',
};

interface EmotionBadgeProps {
  emotion: string;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
  showEmoji?: boolean;
  showConfidence?: boolean;
}

export default function EmotionBadge({ 
  emotion, 
  confidence, 
  size = 'md',
  showEmoji = true,
  showConfidence = true
}: EmotionBadgeProps) {
  const colorClass = EMOTION_COLORS[emotion.toLowerCase()] || EMOTION_COLORS.neutral;
  const emoji = EMOTION_EMOJIS[emotion.toLowerCase()];
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const confPct = confidence ? Math.round(confidence * 100) : null;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border backdrop-blur-sm ${colorClass} ${sizeClasses[size]}`}>
      {showEmoji && emoji && <span>{emoji}</span>}
      <span className="capitalize">{emotion}</span>
      {showConfidence && confPct && (
        <span className="text-[0.7em] opacity-60">({confPct}%)</span>
      )}
    </span>
  );
}
