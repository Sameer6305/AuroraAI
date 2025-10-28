import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { subscription } = await request.json();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Missing subscription' },
        { status: 400 }
      );
    }

    const { endpoint, keys } = subscription;

    if (!endpoint || !keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Get user record from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Save push subscription (upsert to handle updates)
    const { error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint,
          keys,
          user_agent: request.headers.get('user-agent'),
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

    if (subscriptionError) {
      throw subscriptionError;
    }

    // Update user notification settings
    const { error: updateError } = await supabase
      .from('users')
      .update({ notification_enabled: true })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to notifications' },
      { status: 500 }
    );
  }
}
