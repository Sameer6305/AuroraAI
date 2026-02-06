"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Image from "next/image";

// ─── Emotion Badge Colors ───────────────────────────────────────
const EMOTION_COLORS: Record<string, string> = {
  happy: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  calm: 'bg-blue-400/20 text-blue-300 border-blue-400/40',
  motivated: 'bg-red-500/20 text-red-300 border-red-500/40',
  grateful: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  stressed: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  anxious: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  overwhelmed: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  tired: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
  sad: 'bg-blue-600/20 text-blue-400 border-blue-600/40',
  frustrated: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  neutral: 'bg-gray-400/20 text-gray-300 border-gray-400/40',
  confident: 'bg-purple-400/20 text-purple-300 border-purple-400/40',
  excited: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  reflective: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
};

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const imageUrl = searchParams.get("imageUrl") || "/placeholder-reflection.png";
  const vibe = searchParams.get("vibe") || "Your reflection has been generated with care and insight.";
  const emotion = searchParams.get("emotion") || '';
  const emotionConfidence = parseFloat(searchParams.get("emotionConfidence") || '0');
  const theme = searchParams.get("theme") || '';
  const secondaryEmotion = searchParams.get("secondaryEmotion") || '';
  const imageId = searchParams.get("imageId") || '';
  const responseId = searchParams.get("responseId") || '';
  
  // Parse explanation from URL (passed as JSON)
  let explanation: Record<string, string> | null = null;
  try {
    const expStr = searchParams.get("explanation");
    if (expStr) explanation = JSON.parse(decodeURIComponent(expStr));
  } catch { /* no explanation */ }

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `aurora-reflection-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch {
      alert("Failed to download image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFeedback = async (rating: string) => {
    setFeedback(rating);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, responseId, rating }),
      });
      const data = await res.json();
      setFeedbackMessage(data.message || 'Thanks for your feedback!');
      setFeedbackSubmitted(true);
    } catch {
      setFeedbackMessage('Could not save feedback, but thanks for letting us know!');
      setFeedbackSubmitted(true);
    }
  };

  const confPct = Math.round(emotionConfidence * 100);
  const emotionBadge = EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0a0a0a] via-[#0e0e0e] to-[#1a1a1a]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold accent-gradient mb-3">
            Your Reflection
          </h1>
          <p className="text-gray-400 text-lg">
            AI-generated visualization of your thoughts
          </p>
        </div>

        {/* Main Content Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

          {/* Emotion + Theme Badges */}
          {emotion && (
            <div className="px-6 pt-6 flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${emotionBadge}`}>
                <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
                {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                {confPct > 0 && <span className="text-xs opacity-60">({confPct}%)</span>}
              </span>
              {secondaryEmotion && (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs border ${EMOTION_COLORS[secondaryEmotion] || EMOTION_COLORS.neutral}`}>
                  + {secondaryEmotion}
                </span>
              )}
              {theme && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-white/5 text-gray-400 border border-gray-700/50">
                  📌 {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </span>
              )}
            </div>
          )}

          {/* Image */}
          <div className="relative w-full aspect-square sm:aspect-video bg-black/40 flex items-center justify-center overflow-hidden mt-4 mx-4 rounded-lg" style={{margin: '1rem'}}>
            <Image
              src={imageUrl}
              alt="Generated Reflection"
              fill
              className="object-contain"
              priority
              onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
            />
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Vibe */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-300">Reflection Vibe</h2>
              <p className="text-gray-400 leading-relaxed text-lg italic">
                &ldquo;{vibe}&rdquo;
              </p>
            </div>

            {/* ─── Feedback Section (Feature #4) ─────────────────── */}
            {imageId && !feedbackSubmitted && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3">
                <h3 className="text-lg font-semibold text-gray-300">
                  Does this image represent your day?
                </h3>
                <p className="text-sm text-gray-500">Your feedback helps us personalize future generations</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFeedback('yes')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all border ${
                      feedback === 'yes' ? 'bg-green-500/20 border-green-500 text-green-300' : 'bg-white/5 border-gray-700/50 text-gray-400 hover:border-green-500/50 hover:text-green-300'
                    }`}
                  >
                    ✅ Yes
                  </button>
                  <button
                    onClick={() => handleFeedback('partially')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all border ${
                      feedback === 'partially' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' : 'bg-white/5 border-gray-700/50 text-gray-400 hover:border-yellow-500/50 hover:text-yellow-300'
                    }`}
                  >
                    🤔 Partially
                  </button>
                  <button
                    onClick={() => handleFeedback('no')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all border ${
                      feedback === 'no' ? 'bg-red-500/20 border-red-500 text-red-300' : 'bg-white/5 border-gray-700/50 text-gray-400 hover:border-red-500/50 hover:text-red-300'
                    }`}
                  >
                    ❌ No
                  </button>
                </div>
              </div>
            )}

            {feedbackSubmitted && (
              <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-center">
                <p className="text-accent font-medium">{feedbackMessage}</p>
              </div>
            )}

            {/* ─── Explainability Section (Feature #2) ───────────── */}
            {explanation && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors font-medium"
                >
                  <svg className={`w-4 h-4 transition-transform ${showExplanation ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  🧠 Explain this image
                </button>

                {showExplanation && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4 animate-fade-in">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                      <span className="text-accent">🔍</span> How your image was created
                    </h3>

                    {explanation.input_summary && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">What you shared</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{explanation.input_summary}</p>
                      </div>
                    )}

                    {explanation.detected_emotion && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Emotion Analysis</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{explanation.detected_emotion}</p>
                      </div>
                    )}

                    {explanation.detected_theme && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Theme Detection</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{explanation.detected_theme}</p>
                      </div>
                    )}

                    {explanation.prompt_reasoning && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Prompt Design</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{explanation.prompt_reasoning}</p>
                      </div>
                    )}

                    {explanation.style_reasoning && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Visual Style</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{explanation.style_reasoning}</p>
                      </div>
                    )}

                    {explanation.color_mood_reasoning && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Color & Mood</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{explanation.color_mood_reasoning}</p>
                      </div>
                    )}

                    {explanation.composition_notes && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Composition</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{explanation.composition_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="group relative py-4 px-6 bg-accent text-black font-semibold rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-accent/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <span className="relative flex items-center justify-center gap-2">
                  {isDownloading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Downloading...
                    </>
                  ) : downloadSuccess ? (
                    <>✅ Downloaded!</>
                  ) : (
                    <>📥 Download Wallpaper</>
                  )}
                </span>
              </button>
            </div>

            <p className="text-center text-gray-500 text-sm">
              Download the image and set it as your wallpaper
            </p>

            <button
              onClick={() => router.push("/daily-form")}
              className="w-full py-3 px-6 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 text-foreground font-semibold rounded-lg transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/20"
            >
              <span className="flex items-center justify-center gap-2">
                🔄 Generate Again
              </span>
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Save your reflection or create a new one to continue your journey
        </p>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] via-[#0e0e0e] to-[#1a1a1a]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mb-4"></div>
          <p className="text-gray-400">Loading your reflection...</p>
        </div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
