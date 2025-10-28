import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com', // Change this to your email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's date at midnight IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istNow = new Date(now.getTime() + istOffset);
    const todayStart = new Date(istNow.setHours(0, 0, 0, 0));
    const todayEnd = new Date(istNow.setHours(23, 59, 59, 999));

    // Find users who:
    // 1. Have notifications enabled
    // 2. Haven't submitted a daily response today
    const { data: usersWithoutResponse, error: queryError } = await supabase
      .rpc('get_users_without_daily_response', {
        start_date: todayStart.toISOString(),
        end_date: todayEnd.toISOString(),
      });

    if (queryError) {
      console.error('Query error:', queryError);
      throw queryError;
    }

    if (!usersWithoutResponse || usersWithoutResponse.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users need reminders',
        count: 0,
      });
    }

    // Get push subscriptions for these users
    const userIds = usersWithoutResponse.map((u: any) => u.id);
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (subError) {
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active subscriptions to send to',
        count: 0,
      });
    }

    // Send reminder notifications
    const payload = JSON.stringify({
      title: 'Aurora AI Reminder 🌙',
      body: 'Reflect on your day and create your personalized wallpaper',
      icon: '/icon-192.png',
      url: '/daily-form',
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys,
        };

        await webpush.sendNotification(pushSubscription, payload);
        
        // Log notification sent
        await supabase.from('notification_log').insert({
          user_id: sub.user_id,
          notification_type: 'daily_reminder',
          title: 'Aurora AI Reminder 🌙',
          body: 'Reflect on your day',
          sent_at: new Date().toISOString(),
        });

        // Update last_used_at
        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sub.id);

        return { success: true, userId: sub.user_id };
      } catch (error: any) {
        console.error('Failed to send to user:', sub.user_id, error);
        
        // If subscription is invalid (410 Gone), delete it
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
        }
        
        return { success: false, userId: sub.user_id, error: error.message };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} reminder notifications`,
      totalUsers: usersWithoutResponse.length,
      sentCount: successCount,
      failedCount: results.length - successCount,
    });
  } catch (error) {
    console.error('Cron reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    );
  }
}
