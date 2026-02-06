import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import EmotionBadge from "../components/EmotionBadge";
import EmptyState from "../components/EmptyState";

const EMOTION_EMOJIS: Record<string, string> = {
  happy: '😊', calm: '😌', motivated: '🔥', grateful: '🙏',
  stressed: '😰', anxious: '😟', overwhelmed: '🤯', tired: '😴',
  sad: '😢', frustrated: '😤', neutral: '😐', confident: '💪',
  excited: '🎉', reflective: '🤔',
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's reflections with generated images
  const { data: reflections, error } = await supabase
    .from("daily_responses")
    .select(`
      *,
      generated_images (*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reflections:", error);
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-100">Reflection Timeline</h1>
          <p className="text-gray-400">Your emotional journey, visualized</p>
        </div>

        {reflections && reflections.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent/50 via-accent/20 to-transparent"></div>
            
            <div className="space-y-8">
              {reflections.map((reflection: any) => {
                const image = reflection.generated_images?.[0];
                const date = new Date(reflection.created_at);
                const dateStr = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                const timeStr = date.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit'
                });
                const resp = reflection.response as any;
                const emotion = reflection.detected_emotion || image?.emotion;
                const detectedTheme = reflection.detected_theme || image?.theme;

                return (
                  <div key={reflection.id} className="relative pl-20">
                    {/* Timeline dot */}
                    <div className="absolute left-6 top-6 w-5 h-5 rounded-full bg-accent border-4 border-[#0e0e0e] z-10"></div>
                    
                    <Link
                      href={`/result?id=${reflection.id}`}
                      className="block backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10 transition-all group"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 p-4">
                        {/* Image */}
                        {image && (
                          <div className="relative w-full sm:w-48 h-48 flex-shrink-0 rounded-lg overflow-hidden bg-black/40">
                            <Image
                              src={image.image_url}
                              alt={reflection.theme || "Reflection image"}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="flex-1 space-y-3">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-200 group-hover:text-accent transition-colors">
                                {resp?.theme || "Daily Reflection"}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {dateStr} at {timeStr}
                              </p>
                            </div>
                          </div>

                          {/* Emotion + Theme badges */}
                          <div className="flex flex-wrap gap-2">
                            {emotion && (
                              <EmotionBadge 
                                emotion={emotion} 
                                size="sm"
                                showConfidence={false}
                              />
                            )}
                            {detectedTheme && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs border border-purple-500/30">
                                📌 {detectedTheme}
                              </span>
                            )}
                          </div>

                          {image?.vibe && (
                            <p className="text-sm text-gray-400 line-clamp-2 italic">
                              &ldquo;{image.vibe}&rdquo;
                            </p>
                          )}

                          {resp?.mood && (
                            <span className="inline-block text-xs text-gray-500">
                              Mood: {resp.mood}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
            <EmptyState
              icon="📝"
              title="No Reflections Yet"
              description="Start your journey by creating your first daily reflection"
              actionLabel="Create Your First Reflection"
              actionHref="/daily-form"
            />
          </div>
        )}
      </div>
    </div>
  );
}
