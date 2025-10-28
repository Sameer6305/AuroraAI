import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      generator,
      timeMs,
      cost,
      promptLength,
      success,
      errorMessage,
      metadata,
    } = await request.json();

    // Validate required fields
    if (!userId || !generator || typeof timeMs !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: userId, generator, timeMs' },
        { status: 400 }
      );
    }

    // Insert telemetry log
    const { error } = await supabase
      .from('generation_logs')
      .insert({
        user_id: userId,
        generator,
        time_ms: timeMs,
        cost: cost || null,
        prompt_length: promptLength || null,
        success: success !== false, // Default to true
        error_message: errorMessage || null,
        metadata: metadata || null,
      });

    if (error) {
      console.error('Error inserting telemetry log:', error);
      return NextResponse.json(
        { error: 'Failed to log telemetry' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telemetry log error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
