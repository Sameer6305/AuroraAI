import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            AI Reflection
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Transform your daily experiences into meaningful insights with AI-powered reflection and analysis
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-8 rounded-xl bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/30 hover:border-blue-600/50 transition-all">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-2xl font-semibold mb-3">Daily Reflections</h3>
            <p className="text-gray-400 mb-6">
              Capture your thoughts, gratitude, challenges, and goals in a structured format
            </p>
            <Link 
              href="/daily-form"
              className="inline-block px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors font-semibold"
            >
              Start Reflecting
            </Link>
          </div>

          <div className="p-8 rounded-xl bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/30 hover:border-purple-600/50 transition-all">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-2xl font-semibold mb-3">AI Insights</h3>
            <p className="text-gray-400 mb-6">
              Get personalized recommendations and patterns identified by advanced AI analysis
            </p>
            <Link 
              href="/result"
              className="inline-block px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors font-semibold"
            >
              View Results
            </Link>
          </div>

          <div className="p-8 rounded-xl bg-gradient-to-br from-pink-900/30 to-pink-800/20 border border-pink-700/30 hover:border-pink-600/50 transition-all">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-2xl font-semibold mb-3">Track Progress</h3>
            <p className="text-gray-400 mb-6">
              Review your reflection history and observe your personal growth journey over time
            </p>
            <Link 
              href="/history"
              className="inline-block px-6 py-3 rounded-lg bg-pink-600 hover:bg-pink-700 transition-colors font-semibold"
            >
              View History
            </Link>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
          <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
              <h4 className="font-semibold mb-2">Reflect</h4>
              <p className="text-sm text-gray-400">Fill out your daily form</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
              <h4 className="font-semibold mb-2">Analyze</h4>
              <p className="text-sm text-gray-400">AI processes your input</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-pink-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
              <h4 className="font-semibold mb-2">Learn</h4>
              <p className="text-sm text-gray-400">Receive personalized insights</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">4</div>
              <h4 className="font-semibold mb-2">Grow</h4>
              <p className="text-sm text-gray-400">Track your progress</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

