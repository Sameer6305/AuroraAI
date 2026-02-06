import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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

  const EMOTION_EMOJIS: Record<string, string> = {
    happy: '😊', calm: '😌', motivated: '🔥', grateful: '🙏',
    stressed: '😰', anxious: '😟', overwhelmed: '🤯', tired: '😴',
    sad: '😢', frustrated: '😤', neutral: '😐', confident: '💪',
    excited: '🎉', reflective: '🤔',
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/daily-form" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-accent transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Reflect
          </Link>
          <h1 className="text-4xl font-bold mb-2 accent-gradient">Weekly Insights</h1>
          <p className="text-gray-400">AI-generated summaries of your emotional journey</p>
        </div>

        {/* Emotion Distribution */}
        {emotionStats && (
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {/* Emotion breakdown */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">🎭 Emotion Patterns</h2>
              <p className="text-sm text-gray-500 mb-4">Based on your last {emotionStats.totalReflections} reflections</p>
              <div className="space-y-3">
                {emotionStats.emotions.slice(0, 6).map((e: any) => (
                  <div key={e.emotion} className="flex items-center gap-3">
                    <span className="text-lg w-7">{EMOTION_EMOJIS[e.emotion] || '•'}</span>
                    <span className="text-gray-300 w-24 capitalize text-sm">{e.emotion}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="h-full bg-accent/70 rounded-full transition-all" 
                        style={{ width: `${e.pct}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-500 text-sm w-10 text-right">{e.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Theme breakdown */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">📌 Theme Distribution</h2>
              <p className="text-sm text-gray-500 mb-4">What your days have been about</p>
              <div className="space-y-3">
                {emotionStats.themes.slice(0, 6).map((t: any) => (
                  <div key={t.theme} className="flex items-center gap-3">
                    <span className="text-gray-300 w-24 capitalize text-sm">{t.theme}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="h-full bg-purple-500/70 rounded-full transition-all" 
                        style={{ width: `${t.pct}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-500 text-sm w-10 text-right">{t.pct}%</span>
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
              <div key={summary.id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  {summary.representative_image_url && (
                    <div className="relative w-full lg:w-72 h-48 lg:h-auto flex-shrink-0">
                      <Image
                        src={summary.representative_image_url}
                        alt="Weekly summary"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="p-6 flex-1 space-y-3">
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

                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">
                      {summary.summary_text}
                    </p>

                    {/* Emotion + Theme Tags */}
                    <div className="flex flex-wrap gap-2">
                      {summary.key_emotions?.map((e: string) => (
                        <span key={e} className="px-2 py-0.5 rounded text-xs bg-accent/10 text-accent border border-accent/20">
                          {EMOTION_EMOJIS[e] || ''} {e}
                        </span>
                      ))}
                      {summary.key_themes?.map((t: string) => (
                        <span key={t} className="px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Highlight & Encouragement */}
                    {summary.metadata?.highlight && (
                      <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5">
                        ⭐ <strong>Highlight:</strong> {summary.metadata.highlight}
                      </p>
                    )}
                    {summary.metadata?.encouragement && (
                      <p className="text-sm text-accent/80 italic">
                        💡 {summary.metadata.encouragement}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-400 text-lg mb-2">No Weekly Summaries Yet</p>
            <p className="text-gray-500 text-sm mb-6">
              Summaries are generated automatically every Sunday for users with 2+ reflections
            </p>
            <Link href="/daily-form" className="btn-primary inline-block">
              Start Reflecting
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
