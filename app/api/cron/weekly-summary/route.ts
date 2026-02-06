import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/cron/weekly-summary
 * Feature #3: Weekly AI Summarization Pipeline
 * 
 * Runs every 7 days via Vercel Cron.
 * For each user with >= 2 reflections in the past week:
 *   1. Aggregates reflections
 *   2. Generates a weekly summary via Gemini
 *   3. Generates one representative image via Stable Diffusion
 *   4. Stores everything in weekly_summaries table
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculate the past week range
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    console.log(`Weekly summary: ${weekStart.toISOString()} → ${weekEnd.toISOString()}`);

    // Get all users who have reflections in the past week
    const { data: activeUsers, error: usersError } = await supabase
      .from("daily_responses")
      .select("user_id")
      .gte("created_at", weekStart.toISOString())
      .lte("created_at", weekEnd.toISOString());

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    // Deduplicate user IDs
    const userIds = [...new Set(activeUsers?.map(r => r.user_id) || [])];
    console.log(`Found ${userIds.length} users with reflections this week`);

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const uid of userIds) {
      try {
        // Check if summary already exists for this week
        const { data: existing } = await supabase
          .from("weekly_summaries")
          .select("id")
          .eq("user_id", uid)
          .eq("week_start", weekStart.toISOString().split('T')[0])
          .single();

        if (existing) {
          skipped++;
          continue;
        }

        // Fetch this user's reflections for the week
        const { data: reflections, error: refError } = await supabase
          .from("daily_responses")
          .select("response, detected_emotion, detected_theme, created_at")
          .eq("user_id", uid)
          .gte("created_at", weekStart.toISOString())
          .lte("created_at", weekEnd.toISOString())
          .order("created_at", { ascending: true });

        if (refError || !reflections || reflections.length < 2) {
          skipped++;
          continue; // Need at least 2 reflections for meaningful summary
        }

        // Build reflection digest for Gemini
        const reflectionDigest = reflections.map((r, i) => {
          const resp = r.response as any;
          const day = new Date(r.created_at).toLocaleDateString('en-US', { weekday: 'short' });
          return `${day}: Activities: ${resp?.activities || 'N/A'} | Mood: ${resp?.mood || 'N/A'} | Challenges: ${resp?.challenges || 'N/A'} | Achievements: ${resp?.achievements || 'N/A'} | Emotion: ${r.detected_emotion || 'unknown'} | Theme: ${r.detected_theme || 'unknown'}`;
        }).join('\n');

        // Collect emotions and themes
        const emotions = reflections.map(r => r.detected_emotion).filter(Boolean);
        const themes = reflections.map(r => r.detected_theme).filter(Boolean);
        const uniqueEmotions = [...new Set(emotions)];
        const uniqueThemes = [...new Set(themes)];

        // Generate summary with Gemini
        const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
        if (!GOOGLE_AI_API_KEY) {
          console.error('GOOGLE_AI_API_KEY not set, skipping summaries');
          break;
        }

        const summaryResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GOOGLE_AI_API_KEY}`,
          {
            contents: [{
              parts: [{
                text: `You are a thoughtful wellness coach. Analyze this person's week of daily reflections and create a warm, insightful weekly summary.

REFLECTIONS:
${reflectionDigest}

Create a JSON response:
{
  "summary": "2-3 paragraph personal weekly summary (empathetic, insightful, noting patterns, growth, and areas to watch). Max 500 words.",
  "mood_trend": "improving" | "stable" | "declining" | "mixed",
  "highlight": "One standout moment or achievement from the week",
  "encouragement": "One sentence of personalized encouragement for next week",
  "image_prompt": "A 2-3 sentence Stable Diffusion prompt that visually represents their entire week — capturing the dominant mood, key themes, and emotional arc. Use cinematic quality, specific colors matching the mood trend."
}

Output ONLY the JSON.`
              }]
            }]
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
        );

        const summaryText = summaryResponse.data.candidates[0].content.parts[0].text;
        let summaryData;
        try {
          const cleaned = summaryText.replace(/```json\n?|\n?```/g, "").trim();
          summaryData = JSON.parse(cleaned);
        } catch {
          console.error('Failed to parse weekly summary for user:', uid);
          errors++;
          continue;
        }

        // Generate representative image
        let imageUrl: string | null = null;
        let imagePrompt = summaryData.image_prompt || '';
        
        try {
          const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
          if (HF_API_KEY && imagePrompt) {
            const imgResponse = await axios.post(
              "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
              { inputs: imagePrompt },
              {
                headers: {
                  Authorization: `Bearer ${HF_API_KEY}`,
                  "Content-Type": "application/json",
                  "Accept": "image/png",
                },
                responseType: "arraybuffer",
                timeout: 60000,
              }
            );

            // Upload to Supabase storage
            const fileName = `weekly-${uid.substring(0, 8)}-${Date.now()}.png`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("generated")
              .upload(fileName, Buffer.from(imgResponse.data), { contentType: "image/png" });

            if (!uploadError && uploadData) {
              imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/generated/${uploadData.path}`;
            }
          }
        } catch (imgErr) {
          console.error('Weekly image generation failed for user:', uid, imgErr);
          // Non-fatal — summary still gets saved
        }

        // Store weekly summary
        const { error: insertError } = await supabase
          .from("weekly_summaries")
          .insert({
            user_id: uid,
            week_start: weekStart.toISOString().split('T')[0],
            week_end: weekEnd.toISOString().split('T')[0],
            summary_text: summaryData.summary,
            key_emotions: uniqueEmotions,
            key_themes: uniqueThemes,
            reflection_count: reflections.length,
            mood_trend: summaryData.mood_trend,
            representative_image_url: imageUrl,
            representative_prompt: imagePrompt,
            metadata: {
              highlight: summaryData.highlight,
              encouragement: summaryData.encouragement,
            },
          });

        if (insertError) {
          console.error('Failed to insert weekly summary:', insertError);
          errors++;
        } else {
          processed++;
          console.log(`Weekly summary generated for user: ${uid.substring(0, 8)}...`);
        }

      } catch (userErr) {
        console.error(`Error processing user ${uid}:`, userErr);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Weekly summaries: ${processed} generated, ${skipped} skipped, ${errors} errors`,
      stats: { processed, skipped, errors, totalUsers: userIds.length },
    });

  } catch (error) {
    console.error("Weekly summary cron error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
