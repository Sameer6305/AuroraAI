import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 accent-gradient">
            AI Reflection
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Transform your daily experiences into meaningful insights with AI-powered reflection and analysis
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="card hover:border-accent/50 transition-all group">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-2xl font-semibold mb-3">Daily Reflections</h3>
            <p className="text-gray-400 mb-6">
              Capture your thoughts, gratitude, challenges, and goals in a structured format
            </p>
            <Link 
              href="/daily-form"
              className="btn-primary inline-block"
            >
              Start Reflecting
            </Link>
          </div>

          <div className="card hover:border-accent/50 transition-all group">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-2xl font-semibold mb-3">AI Insights</h3>
            <p className="text-gray-400 mb-6">
              Get personalized recommendations and patterns identified by advanced AI analysis
            </p>
            <Link 
              href="/result"
              className="btn-primary inline-block"
            >
              View Results
            </Link>
          </div>

          <div className="card hover:border-accent/50 transition-all group">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-2xl font-semibold mb-3">Track Progress</h3>
            <p className="text-gray-400 mb-6">
              Review your reflection history and observe your personal growth journey over time
            </p>
            <Link 
              href="/history"
              className="btn-primary inline-block"
            >
              View History
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent text-[#0e0e0e] flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
              <h4 className="font-semibold mb-2">Reflect</h4>
              <p className="text-sm text-gray-400">Fill out your daily form</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent text-[#0e0e0e] flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
              <h4 className="font-semibold mb-2">Analyze</h4>
              <p className="text-sm text-gray-400">AI processes your input</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent text-[#0e0e0e] flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
              <h4 className="font-semibold mb-2">Learn</h4>
              <p className="text-sm text-gray-400">Receive personalized insights</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent text-[#0e0e0e] flex items-center justify-center text-xl font-bold mx-auto mb-3">4</div>
              <h4 className="font-semibold mb-2">Grow</h4>
              <p className="text-sm text-gray-400">Track your progress</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

