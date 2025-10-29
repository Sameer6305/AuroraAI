import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
          <h1 className="text-4xl font-bold mb-2 accent-gradient">Reflection History</h1>
          <p className="text-gray-400">Review your past reflections and track your progress</p>
        </div>

        {reflections && reflections.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reflections.map((reflection: any) => {
              const image = reflection.generated_images?.[0];
              const date = new Date(reflection.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

              return (
                <Link
                  key={reflection.id}
                  href={`/result?id=${reflection.id}`}
                  className="card hover:border-accent/50 transition-all group overflow-hidden"
                >
                  {image && (
                    <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-800">
                      <Image
                        src={image.image_url}
                        alt={reflection.theme || "Reflection image"}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold line-clamp-1">
                        {reflection.theme || "Daily Reflection"}
                      </h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                        {date}
                      </span>
                    </div>
                    {reflection.mood && (
                      <span className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent text-sm">
                        {reflection.mood}
                      </span>
                    )}
                    {reflection.vibe && (
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {reflection.vibe}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 card">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-400 text-lg mb-4">No Reflections Yet</p>
            <p className="text-gray-500 mb-6">Start your journey by creating your first daily reflection</p>
            <Link href="/daily-form" className="btn-primary inline-block">
              Create Your First Reflection
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
