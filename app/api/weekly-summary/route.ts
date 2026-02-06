import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/weekly-summary?userId=xxx
 * Fetch user's weekly summaries for display
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: "userId parameter required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("weekly_summaries")
      .select("*")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(12);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch summaries" }, { status: 500 });
    }

    return NextResponse.json({ summaries: data || [] });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
