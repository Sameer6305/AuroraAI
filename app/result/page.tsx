"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Image from "next/image";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const imageUrl = searchParams.get("imageUrl") || "/placeholder-reflection.png";
  const vibe = searchParams.get("vibe") || "Your reflection has been generated with care and insight.";

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
      
      // Show success message
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerateAgain = () => {
    router.push("/daily-form");
  };

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
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent rounded-2xl pointer-events-none"></div>

          {/* Image Section */}
          <div className="relative w-full aspect-square sm:aspect-video bg-black/40 flex items-center justify-center overflow-hidden">
            <Image
              src={imageUrl}
              alt="Generated Reflection"
              fill
              className="object-contain"
              priority
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          </div>

          {/* Content Section */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Vibe Text */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-300">Reflection Vibe</h2>
              <p className="text-gray-400 leading-relaxed text-lg italic">
                "{vibe}"
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-4">
              {/* Download Button */}
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
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Downloaded!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Wallpaper
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* Download hint */}
            <p className="text-center text-gray-500 text-sm">
              Download the image and set it as your wallpaper manually
            </p>

            {/* Generate Again Button */}
            <button
              onClick={handleGenerateAgain}
              className="w-full py-3 px-6 bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 text-foreground font-semibold rounded-lg transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/20 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generate Again
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
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
