"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Image from "next/image";
import EmotionBadge from "../components/EmotionBadge";
import ExplanationPanel from "../components/ExplanationPanel";
import FeedbackWidget from "../components/FeedbackWidget";
import LoadingSkeleton from "../components/LoadingSkeleton";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

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

  return (
    <>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-2 text-gray-100">
              Your Reflection
            </h1>
            <p className="text-gray-400">
              AI-generated visualization of your thoughts
            </p>
          </div>

          {/* Main Content Card */}
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

            {/* Emotion + Theme Badges */}
            {emotion && (
              <div className="px-6 pt-6 flex flex-wrap items-center gap-3">
                <EmotionBadge 
                  emotion={emotion} 
                  confidence={emotionConfidence} 
                  size="lg"
                />
                {secondaryEmotion && (
                  <EmotionBadge 
                    emotion={secondaryEmotion} 
                    size="sm"
                    showConfidence={false}
                  />
                )}
                {theme && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-white/5 text-gray-400 border border-gray-700/50">
                    📌 {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </span>
                )}
              </div>
            )}

            {/* Image */}
            <div className="relative w-full aspect-video bg-black/40 flex items-center justify-center overflow-hidden mt-4 mx-4 rounded-lg" style={{maxWidth: 'calc(100% - 2rem)', maxHeight: '500px'}}>
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
                <h2 className="text-lg font-semibold text-gray-300">Reflection Vibe</h2>
                <p className="text-gray-400 leading-relaxed italic">
                  &ldquo;{vibe}&rdquo;
                </p>
              </div>

              {/* Feedback Widget */}
              {imageId && responseId && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <FeedbackWidget 
                    imageId={imageId} 
                    responseId={responseId}
                  />
                </div>
              )}

              {/* Explainability Button */}
              {explanation && (
                <button
                  onClick={() => setShowExplanation(true)}
                  className="flex items-center gap-2 text-accent hover:text-accent/80 transition-colors font-medium group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Why this image? (Explainable AI)
                </button>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="py-3 px-6 bg-accent/10 border border-accent/30 text-accent font-semibold rounded-lg transition-all hover:bg-accent/20 hover:border-accent/50 disabled:opacity-50"
                >
                  {isDownloading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Downloading...
                    </span>
                  ) : downloadSuccess ? (
                    <span className="flex items-center justify-center gap-2">
                      ✅ Downloaded!
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      📥 Download
                    </span>
                  )}
                </button>

                <button
                  onClick={() => router.push("/history")}
                  className="py-3 px-6 bg-white/5 border border-white/10 text-gray-300 font-semibold rounded-lg transition-all hover:bg-white/10 hover:border-white/20"
                >
                  View History
                </button>
              </div>

              <button
                onClick={() => router.push("/daily-form")}
                className="w-full py-3 px-6 bg-gradient-to-r from-accent to-accent/80 text-black font-bold rounded-lg transition-all hover:shadow-lg hover:shadow-accent/30"
              >
                ✨ Create New Reflection
              </button>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            Save your reflection or create a new one to continue your journey
          </p>
        </div>
      </div>

      {/* Explainability Panel */}
      <ExplanationPanel 
        isOpen={showExplanation} 
        onClose={() => setShowExplanation(false)}
        explanation={explanation}
      />
    </>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mb-4"></div>
          <p className="text-gray-400">Loading your reflection...</p>
        </div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
