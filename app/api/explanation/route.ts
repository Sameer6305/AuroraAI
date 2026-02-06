import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/explanation?imageId=xxx
 * Feature #2: Explainable AI — fetch stored explanation for an image
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const imageId = request.nextUrl.searchParams.get('imageId');
    
    if (!imageId) {
      return NextResponse.json({ error: "imageId parameter required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("image_explanations")
      .select("explanation, created_at")
      .eq("image_id", imageId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Explanation not found" }, { status: 404 });
    }

    return NextResponse.json({
      explanation: data.explanation,
      generatedAt: data.created_at,
    });

  } catch (error) {
    console.error("Explanation fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
