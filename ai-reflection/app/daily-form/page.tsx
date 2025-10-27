"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DailyFormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    activities: "",
    mood: "",
    challenges: "",
    achievements: "",
    theme: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useState(() => {
    setTimeout(() => setIsVisible(true), 100);
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Form submitted successfully");
        // Redirect to result page with imageUrl, vibe, and email
        const params = new URLSearchParams({
          imageUrl: data.imageUrl,
          vibe: data.vibe,
        });
        
        if (formData.email) {
          params.append("email", formData.email);
        }
        
        router.push(`/result?${params.toString()}`);
      } else {
        console.error("Submission failed:", data.error);
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to submit reflection. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#0a0a0a] via-[#0e0e0e] to-[#1a1a1a]">
      <div className="max-w-3xl mx-auto">
        <div
          className={`transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold accent-gradient mb-3">
              Daily Reflection
            </h1>
            <p className="text-gray-400 text-lg">
              Capture your day, reflect on your journey
            </p>
          </div>

          {/* Glassmorphism Card */}
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent rounded-2xl pointer-events-none"></div>

            <form onSubmit={handleSubmit} className="relative space-y-6">
              {/* Activities */}
              <div className="space-y-2">
                <label htmlFor="activities" className="block text-sm font-semibold text-gray-300">
                  What did you do today? <span className="text-accent">*</span>
                </label>
                <textarea
                  id="activities"
                  name="activities"
                  rows={4}
                  required
                  value={formData.activities}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700/50 rounded-lg text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
                  placeholder="Describe your activities, experiences, or thoughts from today..."
                />
              </div>

              {/* Mood */}
              <div className="space-y-2">
                <label htmlFor="mood" className="block text-sm font-semibold text-gray-300">
                  How are you feeling? <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  id="mood"
                  name="mood"
                  required
                  value={formData.mood}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700/50 rounded-lg text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  placeholder="e.g., Happy, Motivated, Tired, Reflective..."
                />
              </div>

              {/* Challenges */}
              <div className="space-y-2">
                <label htmlFor="challenges" className="block text-sm font-semibold text-gray-300">
                  Challenges you faced <span className="text-accent">*</span>
                </label>
                <textarea
                  id="challenges"
                  name="challenges"
                  rows={4}
                  required
                  value={formData.challenges}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700/50 rounded-lg text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
                  placeholder="Share any obstacles, difficulties, or struggles you encountered..."
                />
              </div>

              {/* Achievements */}
              <div className="space-y-2">
                <label htmlFor="achievements" className="block text-sm font-semibold text-gray-300">
                  Achievements & wins <span className="text-accent">*</span>
                </label>
                <textarea
                  id="achievements"
                  name="achievements"
                  rows={4}
                  required
                  value={formData.achievements}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700/50 rounded-lg text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
                  placeholder="Celebrate your accomplishments, big or small..."
                />
              </div>

              {/* Theme Selection */}
              <div className="space-y-2">
                <label htmlFor="theme" className="block text-sm font-semibold text-gray-300">
                  Reflection Theme <span className="text-accent">*</span>
                </label>
                <select
                  id="theme"
                  name="theme"
                  required
                  value={formData.theme}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="">Select a theme style...</option>
                  <option value="naruto">Naruto-style</option>
                  <option value="onepiece">One Piece-style</option>
                  <option value="realistic">Realistic</option>
                  <option value="cyberpunk">Cyberpunk</option>
                  <option value="minimalist">Minimalist</option>
                </select>
              </div>

              {/* Email (Optional) */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-300">
                  Email <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700/50 rounded-lg text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full py-4 px-6 bg-accent text-black font-bold text-lg rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-accent/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Animated glow background */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent via-[#00dddd] to-accent bg-[length:200%_100%] group-hover:animate-[shimmer_2s_linear_infinite]"></div>
                
                <span className="relative flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      ✨ Generate Reflection
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* Footer hint */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Your reflection will be analyzed and transformed into meaningful insights
          </p>
        </div>
      </div>
    </div>
  );
}
