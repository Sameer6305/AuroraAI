import Link from "next/link";

export default async function Home() {
  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 accent-gradient">
            AuroraAI
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Emotion-aware AI that transforms your daily reflections into personalized art with explainable intelligence
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card hover:border-accent/50 transition-all group">
            <div className="text-4xl mb-4">🎭</div>
            <h3 className="text-2xl font-semibold mb-3">Emotion-Aware Reflections</h3>
            <p className="text-gray-400 mb-6">
              AI detects your emotional state and adapts image style, colors, and composition to match how you truly feel
            </p>
            <Link href="/daily-form" className="btn-primary inline-block">
              Start Reflecting
            </Link>
          </div>

          <div className="card hover:border-accent/50 transition-all group">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-2xl font-semibold mb-3">Explainable AI</h3>
            <p className="text-gray-400 mb-6">
              Understand exactly how your inputs influenced the generated image — full transparency into every AI decision
            </p>
            <Link href="/result" className="btn-primary inline-block">
              View Results
            </Link>
          </div>

          <div className="card hover:border-accent/50 transition-all group">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-2xl font-semibold mb-3">Weekly Insights</h3>
            <p className="text-gray-400 mb-6">
              AI-generated weekly summaries that track your emotional patterns, themes, and personal growth over time
            </p>
            <Link href="/insights" className="btn-primary inline-block">
              View Insights
            </Link>
          </div>
        </div>

        {/* How It Works — Updated */}
        <div className="card">
          <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent text-[#0e0e0e] flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
              <h4 className="font-semibold mb-2">Reflect</h4>
              <p className="text-sm text-gray-400">Share your day, mood, challenges & wins</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent text-[#0e0e0e] flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
              <h4 className="font-semibold mb-2">Detect</h4>
              <p className="text-sm text-gray-400">AI detects your emotion & theme</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent text-[#0e0e0e] flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
              <h4 className="font-semibold mb-2">Generate</h4>
              <p className="text-sm text-gray-400">Emotion-tuned image is created</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent text-[#0e0e0e] flex items-center justify-center text-xl font-bold mx-auto mb-3">4</div>
              <h4 className="font-semibold mb-2">Explain</h4>
              <p className="text-sm text-gray-400">See why AI made each decision</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent text-[#0e0e0e] flex items-center justify-center text-xl font-bold mx-auto mb-3">5</div>
              <h4 className="font-semibold mb-2">Learn</h4>
              <p className="text-sm text-gray-400">Your feedback improves future art</p>
            </div>
          </div>
        </div>

        {/* Architecture Highlights */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="card border-accent/20">
            <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
              🔒 Secure Multi-Tenant
            </h3>
            <p className="text-sm text-gray-400">
              Supabase Row Level Security ensures strict user isolation. Every table is user-scoped with explicit policies — zero cross-user data leakage.
            </p>
          </div>
          <div className="card border-accent/20">
            <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
              🔄 Feedback Learning Loop
            </h3>
            <p className="text-sm text-gray-400">
              Rate each image. Your feedback trains emotion→style mappings, making future generations increasingly personalized to your taste.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

