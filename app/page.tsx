import Link from "next/link";

export default async function Home() {
  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-gray-100">
            AuroraAI
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-8">
            Transform your daily reflections into emotion-driven visual art with explainable AI
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/daily-form" className="btn-primary text-lg px-8 py-4">
              Start Reflecting →
            </Link>
            <Link href="/insights" className="px-8 py-4 bg-white/5 border border-white/10 text-gray-300 font-semibold rounded-lg hover:bg-white/10 transition-all text-lg">
              View Insights
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-accent/30 transition-all group">
            <div className="text-4xl mb-4">🎭</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-100">Emotion-Aware AI</h3>
            <p className="text-gray-400 leading-relaxed">
              AI detects your emotional state from your words and adapts style, colors, and composition to match how you truly feel.
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-accent/30 transition-all group">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-100">Explainable AI</h3>
            <p className="text-gray-400 leading-relaxed">
              Understand exactly how your inputs influenced the generated image with full transparency into every AI decision.
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-accent/30 transition-all group">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3 text-gray-100">Weekly Insights</h3>
            <p className="text-gray-400 leading-relaxed">
              AI-generated weekly summaries track your emotional patterns, themes, and personal growth over time.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-100">How It Works</h2>
          <div className="grid md:grid-cols-5 gap-6">
            {[
              { num: 1, title: "Reflect", desc: "Share your day, mood & feelings" },
              { num: 2, title: "Detect", desc: "AI analyzes emotion & theme" },
              { num: 3, title: "Generate", desc: "Personalized image created" },
              { num: 4, title: "Explain", desc: "See why AI made each choice" },
              { num: 5, title: "Learn", desc: "Feedback improves future art" }
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="w-12 h-12 rounded-full bg-accent text-black flex items-center justify-center text-xl font-bold mx-auto mb-3">
                  {step.num}
                </div>
                <h4 className="font-semibold mb-2 text-gray-200">{step.title}</h4>
                <p className="text-sm text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Signals */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="backdrop-blur-xl bg-white/5 border border-accent/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
              🔒 Secure & Private
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Built with Row Level Security. Your data is strictly isolated and encrypted—no cross-user access, ever.
            </p>
          </div>
          <div className="backdrop-blur-xl bg-white/5 border border-accent/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
              🔄 Adaptive Learning
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your feedback trains the system. Over time, the AI learns your preferences and generates increasingly personal art.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-500 mb-6">
            Ready to start your journey?
          </p>
          <Link href="/daily-form" className="btn-primary text-lg px-10 py-4">
            Create Your First Reflection
          </Link>
        </div>
      </main>
    </div>
  );
}

