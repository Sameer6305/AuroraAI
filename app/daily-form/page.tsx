"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProgressStepper from "../components/ProgressStepper";
import GeneratingLoader from "../components/GeneratingLoader";

export default function DailyFormPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    activities: "",
    mood: "",
    challenges: "",
    achievements: "",
    theme: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load saved draft from localStorage
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
    const saved = localStorage.getItem('aurora-draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      } catch (e) {
        console.error('Failed to parse saved draft');
      }
    }
  }, []);

  // Autosave to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('aurora-draft', JSON.stringify(formData));
      setLastSaved(new Date());
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const clearDraft = () => {
    localStorage.removeItem('aurora-draft');
    setFormData({
      activities: "",
      mood: "",
      challenges: "",
      achievements: "",
      theme: "",
    });
  };

  const canProceed = (step: number) => {
    switch (step) {
      case 1: return formData.activities.trim().length >= 10;
      case 2: return formData.mood.trim().length >= 2;
      case 3: return formData.challenges.trim().length >= 10;
      case 4: return formData.achievements.trim().length >= 10;
      default: return true;
    }
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
        localStorage.removeItem('aurora-draft'); // Clear draft after successful submission
        // Redirect to result page with all enriched data
        const params = new URLSearchParams({
          imageUrl: data.imageUrl || '',
          vibe: data.vibe || '',
          emotion: data.emotion || '',
          emotionConfidence: String(data.emotionConfidence || 0),
          theme: data.theme || '',
          secondaryEmotion: data.secondaryEmotion || '',
          imageId: data.imageId || '',
          responseId: data.responseId || '',
        });
        if (data.explanation) {
          params.set('explanation', encodeURIComponent(JSON.stringify(data.explanation)));
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

  const steps = [
    { number: 1, label: 'Activities' },
    { number: 2, label: 'Mood' },
    { number: 3, label: 'Challenges' },
    { number: 4, label: 'Wins' },
    { number: 5, label: 'Finalize' }
  ];

  const charCount = (field: keyof typeof formData) => formData[field].length;
  const suggestedMin = 20;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div
          className={`transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-gray-100">
              Daily Reflection
            </h1>
            <p className="text-gray-400">
              Your thoughts will be transformed into visual art
            </p>
          </div>

          {/* Progress Stepper */}
          <ProgressStepper steps={steps} currentStep={currentStep} />

          {/* Autosave indicator */}
          {lastSaved && (
            <div className="text-center mb-4">
              <p className="text-xs text-gray-500">
                Draft auto-saved {lastSaved.toLocaleTimeString()}
              </p>
            </div>
          )}

          {/* Form Container */}
          <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="relative space-y-6">
              
              {/* Step 1: Activities */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label htmlFor="activities" className="block text-lg font-semibold text-gray-200 mb-2">
                      What did you do today?
                    </label>
                    <p className="text-sm text-gray-400 mb-3">
                      Describe your activities, experiences, or key moments from your day.
                    </p>
                    <textarea
                      id="activities"
                      name="activities"
                      rows={6}
                      value={formData.activities}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-black/40 border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all resize-none"
                      placeholder="I spent the morning working on my project, then went for a walk in the park..."
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs ${charCount('activities') < suggestedMin ? 'text-gray-500' : 'text-accent/70'}`}>
                        {charCount('activities')} characters (min {suggestedMin} suggested)
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={!canProceed(1)}
                      className="flex-1 py-3 px-6 bg-accent text-black font-semibold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Mood */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label htmlFor="mood" className="block text-lg font-semibold text-gray-200 mb-2">
                      How are you feeling?
                    </label>
                    <p className="text-sm text-gray-400 mb-3">
                      Describe your emotional state in a few words.
                    </p>
                    <input
                      type="text"
                      id="mood"
                      name="mood"
                      value={formData.mood}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-black/40 border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all"
                      placeholder="e.g., Happy, Motivated, Tired, Reflective, Mixed feelings..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-3 bg-white/5 text-gray-300 font-medium rounded-lg hover:bg-white/10 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      disabled={!canProceed(2)}
                      className="flex-1 py-3 px-6 bg-accent text-black font-semibold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Challenges */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label htmlFor="challenges" className="block text-lg font-semibold text-gray-200 mb-2">
                      What challenges did you face?
                    </label>
                    <p className="text-sm text-gray-400 mb-3">
                      Share any obstacles, difficulties, or struggles you encountered.
                    </p>
                    <textarea
                      id="challenges"
                      name="challenges"
                      rows={6}
                      value={formData.challenges}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-black/40 border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all resize-none"
                      placeholder="I struggled with staying focused, and had some technical issues..."
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs ${charCount('challenges') < suggestedMin ? 'text-gray-500' : 'text-accent/70'}`}>
                        {charCount('challenges')} characters
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-6 py-3 bg-white/5 text-gray-300 font-medium rounded-lg hover:bg-white/10 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      disabled={!canProceed(3)}
                      className="flex-1 py-3 px-6 bg-accent text-black font-semibold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Achievements */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label htmlFor="achievements" className="block text-lg font-semibold text-gray-200 mb-2">
                      What did you achieve?
                    </label>
                    <p className="text-sm text-gray-400 mb-3">
                      Celebrate your accomplishments, big or small.
                    </p>
                    <textarea
                      id="achievements"
                      name="achievements"
                      rows={6}
                      value={formData.achievements}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-black/40 border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all resize-none"
                      placeholder="I completed a major task, learned something new, or simply made it through the day..."
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-xs ${charCount('achievements') < suggestedMin ? 'text-gray-500' : 'text-accent/70'}`}>
                        {charCount('achievements')} characters
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-6 py-3 bg-white/5 text-gray-300 font-medium rounded-lg hover:bg-white/10 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(5)}
                      disabled={!canProceed(4)}
                      className="flex-1 py-3 px-6 bg-accent text-black font-semibold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Theme & Submit */}
              {currentStep === 5 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label htmlFor="theme" className="block text-lg font-semibold text-gray-200 mb-2">
                      Choose your visual style
                    </label>
                    <p className="text-sm text-gray-400 mb-3">
                      Select the artistic theme for your generated image.
                    </p>
                    <select
                      id="theme"
                      name="theme"
                      value={formData.theme}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-black/40 border border-gray-700/50 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-transparent transition-all cursor-pointer"
                    >
                      <option value="">Select a theme...</option>
                      <option value="naruto">Naruto-style</option>
                      <option value="onepiece">One Piece-style</option>
                      <option value="realistic">Realistic</option>
                      <option value="cyberpunk">Cyberpunk</option>
                      <option value="minimalist">Minimalist</option>
                    </select>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Your Reflection Summary</h3>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>✓ Activities: {charCount('activities')} chars</li>
                      <li>✓ Mood: {formData.mood || 'Not specified'}</li>
                      <li>✓ Challenges: {charCount('challenges')} chars</li>
                      <li>✓ Achievements: {charCount('achievements')} chars</li>
                      <li>{formData.theme ? '✓' : '○'} Theme: {formData.theme || 'Not selected'}</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="px-6 py-3 bg-white/5 text-gray-300 font-medium rounded-lg hover:bg-white/10 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={clearDraft}
                      className="px-6 py-3 text-gray-400 hover:text-gray-200 transition-all text-sm"
                    >
                      Clear Draft
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.theme}
                      className="flex-1 py-3 px-6 bg-gradient-to-r from-accent to-accent/80 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
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
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer hint */}
          <p className="text-center text-gray-500 text-sm mt-6">
            {currentStep < 5 
              ? 'Your reflection will be analyzed with AI to detect emotion and theme' 
              : 'AI will generate a personalized image that reflects your day'}
          </p>
        </div>
      </div>

      {/* Generating Loader */}
      {isSubmitting && <GeneratingLoader />}
    </div>
  );
}
