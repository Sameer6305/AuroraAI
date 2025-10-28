import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm text-gray-400">
              {user.email}
            </span>
            <Link 
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-gray-700/50 rounded-lg text-gray-300 hover:bg-white/10 hover:border-accent/50 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="px-4 py-2 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/20 transition-all"
              >
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link 
              href="/login"
              className="px-4 py-2 bg-white/5 border border-gray-700/50 rounded-lg text-gray-300 hover:bg-white/10 hover:border-accent/50 transition-all"
            >
              Sign In
            </Link>
            <Link 
              href="/signup"
              className="px-4 py-2 bg-accent text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-accent/50 transition-all"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>

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

