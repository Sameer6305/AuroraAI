import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * POST /api/feedback
 * Feature #4: Feedback-Driven Learning Loop
 * 
 * Accepts user feedback on generated images and updates
 * emotion→style preference mappings for future generations.
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const body = await request.json();
    const { imageId, responseId, rating, comment } = body;

    if (!imageId || !responseId || !rating) {
      return NextResponse.json(
        { error: "Missing required fields: imageId, responseId, rating" },
        { status: 400 }
      );
    }

    if (!['yes', 'partially', 'no'].includes(rating)) {
      return NextResponse.json(
        { error: "Rating must be 'yes', 'partially', or 'no'" },
        { status: 400 }
      );
    }

    // Get the image record to extract emotion/theme/style
    const { data: image, error: imgErr } = await supabaseAdmin
      .from("generated_images")
      .select("user_id, emotion, theme, style_modifiers, vibe")
      .eq("id", imageId)
      .single();

    if (imgErr || !image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Store feedback record
    const { error: fbErr } = await supabaseAdmin
      .from("user_feedback")
      .insert({
        user_id: image.user_id,
        image_id: imageId,
        response_id: responseId,
        rating,
        comment: comment || null,
        detected_emotion: image.emotion,
        detected_theme: image.theme,
        style_used: image.style_modifiers?.palette || null,
      });

    if (fbErr) {
      console.error("Error saving feedback:", fbErr);
      return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
    }

    // ─── Update emotion→style preference mapping ────────────────
    // This is the "learning" part of the feedback loop
    if (image.emotion) {
      const isPositive = rating === 'yes';
      const isNegative = rating === 'no';

      // Check if preference record exists
      const { data: existing } = await supabaseAdmin
        .from("emotion_style_prefs")
        .select("id, positive_count, negative_count")
        .eq("user_id", image.user_id)
        .eq("emotion", image.emotion)
        .single();

      if (existing) {
        // Update counts
        await supabaseAdmin
          .from("emotion_style_prefs")
          .update({
            positive_count: existing.positive_count + (isPositive ? 1 : 0),
            negative_count: existing.negative_count + (isNegative ? 1 : 0),
            preferred_style: isPositive ? (image.style_modifiers?.mood || null) : existing.id ? undefined : null,
            preferred_palette: isPositive ? (image.style_modifiers?.palette || null) : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
      } else {
        // Create new preference record
        await supabaseAdmin
          .from("emotion_style_prefs")
          .insert({
            user_id: image.user_id,
            emotion: image.emotion,
            preferred_style: isPositive ? (image.style_modifiers?.mood || null) : null,
            preferred_palette: isPositive ? (image.style_modifiers?.palette || null) : null,
            positive_count: isPositive ? 1 : 0,
            negative_count: isNegative ? 1 : 0,
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: rating === 'yes'
        ? "Thanks! Your preference has been learned for future generations."
        : rating === 'partially'
        ? "Got it — we'll refine the style next time."
        : "Noted — we'll try a different approach next time.",
    });

  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
