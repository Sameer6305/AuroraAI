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
    <nav className="border-b border-gray-800 bg-[#0e0e0e]/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold accent-gradient">
            AuroraAI
          </Link>
          
          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link 
                  href="/daily-form" 
                  className="text-gray-300 hover:text-accent transition-colors"
                >
                  Daily Form
                </Link>
                <Link 
                  href="/history" 
                  className="text-gray-300 hover:text-accent transition-colors"
                >
                  History
                </Link>
                <Link 
                  href="/settings" 
                  className="text-gray-300 hover:text-accent transition-colors"
                >
                  Settings
                </Link>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">{user.email}</span>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                {!loading && (
                  <>
                    <Link 
                      href="/login"
                      className="text-gray-300 hover:text-accent transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/signup"
                      className="px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg border border-accent/50 transition-colors"
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
