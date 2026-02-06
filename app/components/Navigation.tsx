'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#0e0e0e]/80 border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
              AuroraAI
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/daily-form" className="text-gray-300 hover:text-accent transition-colors">
              Reflect
            </Link>
            <Link href="/history" className="text-gray-300 hover:text-accent transition-colors">
              History
            </Link>
            <Link href="/insights" className="text-gray-300 hover:text-accent transition-colors">
              Insights
            </Link>
            <Link href="/result" className="text-gray-300 hover:text-accent transition-colors">
              Results
            </Link>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-gray-400 px-3 py-2 bg-white/5 rounded-lg border border-gray-700/50">
                  {user.email}
                </span>
                <Link 
                  href="/settings"
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-gray-700/50 rounded-lg text-gray-300 hover:bg-white/10 hover:border-accent/50 transition-all"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="hidden sm:inline">Settings</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 hover:bg-red-500/20 transition-all font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                {!loading && (
                  <>
                    <Link 
                      href="/login"
                      className="px-4 py-2 text-gray-300 hover:text-white transition-colors font-medium"
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/signup"
                      className="px-6 py-2 bg-gradient-to-r from-accent to-purple-400 text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-accent/50 transition-all"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
