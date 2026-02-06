import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import EmotionBadge from "../components/EmotionBadge";
import EmptyState from "../components/EmptyState";

export default async function InsightsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's internal ID
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  let summaries: any[] = [];
  let emotionStats: any = null;

  if (userData) {
    // Fetch weekly summaries
    const { data } = await supabase
      .from("weekly_summaries")
      .select("*")
      .eq("user_id", userData.id)
      .order("week_start", { ascending: false })
      .limit(12);

    summaries = data || [];

    // Fetch emotion distribution from recent responses
    const { data: recentResponses } = await supabase
      .from("daily_responses")
      .select("detected_emotion, detected_theme")
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (recentResponses && recentResponses.length > 0) {
      const emotionCounts: Record<string, number> = {};
      const themeCounts: Record<string, number> = {};
      
      recentResponses.forEach(r => {
        if (r.detected_emotion) {
          emotionCounts[r.detected_emotion] = (emotionCounts[r.detected_emotion] || 0) + 1;
        }
        if (r.detected_theme) {
          themeCounts[r.detected_theme] = (themeCounts[r.detected_theme] || 0) + 1;
        }
      });

      emotionStats = {
        totalReflections: recentResponses.length,
        emotions: Object.entries(emotionCounts)
          .sort(([,a], [,b]) => b - a)
          .map(([emotion, count]) => ({ emotion, count, pct: Math.round((count / recentResponses.length) * 100) })),
        themes: Object.entries(themeCounts)
          .sort(([,a], [,b]) => b - a)
          .map(([theme, count]) => ({ theme, count, pct: Math.round((count / recentResponses.length) * 100) })),
      };
    }
  }

  const MOOD_TREND_ICONS: Record<string, string> = {
    improving: '📈',
    stable: '➡️',
    declining: '📉',
    mixed: '🔀',
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-100">Weekly Insights</h1>
          <p className="text-gray-400">AI-generated summaries of your emotional journey</p>
        </div>

        {/* Emotion Distribution */}
        {emotionStats && (
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Emotion breakdown */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-200">🎭 Emotion Patterns</h2>
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
Last {emotionStats.totalReflections} days
                </span>
              </div>
              <div className="space-y-3">
                {emotionStats.emotions.slice(0, 6).map((e: any) => (
                  <div key={e.emotion} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300 capitalize">{e.emotion}</span>
                      <span className="text-sm text-gray-400">{e.pct}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all duration-500" 
                        style={{ width: `${e.pct}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Theme breakdown */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-200">📌 Theme Distribution</h2>
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                  Focus areas
                </span>
              </div>
              <div className="space-y-3">
                {emotionStats.themes.slice(0, 6).map((t: any) => (
                  <div key={t.theme} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-300 capitalize">{t.theme}</span>
                      <span className="text-sm text-gray-400">{t.pct}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500" 
                        style={{ width: `${t.pct}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Weekly Summaries List */}
        {summaries.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-200">📅 Weekly Summaries</h2>
            {summaries.map((summary: any) => (
              <div key={summary.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-accent/30 transition-all">{/* Continues... */}
                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  {summary.representative_image_url && (
                    <div className="relative w-full lg:w-72 h-48 lg:h-auto flex-shrink-0 bg-black/40">
                      <Image
                        src={summary.representative_image_url}
                        alt="Weekly summary"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-6 flex-1 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <h3 className="text-lg font-semibold text-gray-200">
                        Week of {new Date(summary.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(summary.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </h3>
                      <div className="flex items-center gap-2">
                        {summary.mood_trend && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white/5 border border-gray-700/50 text-gray-300">
                            {MOOD_TREND_ICONS[summary.mood_trend] || '•'} {summary.mood_trend}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{summary.reflection_count} reflections</span>
                      </div>
                    </div>

                    <p className="text-gray-400 leading-relaxed">
                      {summary.summary_text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <EmptyState
              icon="📊"
              title="No Weekly Summaries Yet"
              description="Summaries are generated automatically every Sunday for users with 2+ reflections"
              actionLabel="Start Reflecting"
              actionHref="/daily-form"
            />
          </div>
        )}
      </div>
    </div>
  );
}
