# Push Notifications & Auth Setup

## Quick Setup

### 1. Environment Variables (.env.local)
```bash
# VAPID Keys (already generated)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BMd04aJ9TcpIKKL8_ozbDmHpMWHbyG7O-nuFh3lj7yFKc76A21gWz6xXKN8xXCMi2xBUXwLF32PAdFwYFvRQH68
VAPID_PRIVATE_KEY=OCtDb81sMUyEgUbV8HvMk0ATKHcvqYervMEUSFYx__Y

# Cron Security (generate random string)
CRON_SECRET=your_random_secret_here
```

### 2. Database Migration
Run these SQL files in Supabase SQL Editor (in order):
1. `schema.sql` - Base schema
2. `schema-notifications.sql` - Adds notification tables
3. `schema-auth.sql` - Adds authentication integration
4. `schema-functions.sql` - Adds cron query function

### 3. Enable Google OAuth (Optional)
In Supabase Dashboard:
1. Go to **Authentication → Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials
4. Add authorized redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 4. Deploy to Vercel
Add environment variables in Vercel dashboard. Cron job will automatically run daily at 11:30 PM IST.

## Usage

**Authentication**:
- Users must sign up/login with email or Google
- Protected routes: `/daily-form`, `/history`, `/settings`

**Notifications**:
- Go to Settings → Enable Notifications → Choose mode (App Only / Always)
- Daily Reminder: Automatically sent at 11:30 PM IST to logged-in users who haven't reflected today

## Testing

```bash
# Test locally
npm run dev
# Visit http://localhost:3000
# Sign up or login
# Go to /settings to enable notifications

# Test cron endpoint
curl -X GET http://localhost:3000/api/cron/reminder \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Files Created

**Authentication**:
- `/app/login/page.tsx` - Login page (email + Google)
- `/app/signup/page.tsx` - Signup page
- `/app/auth/callback/route.ts` - OAuth callback
- `/app/auth/signout/route.ts` - Sign out endpoint
- `/lib/supabase/server.ts` - Server-side Supabase client
- `/lib/supabase/client.ts` - Client-side Supabase client
- `/lib/supabase/middleware.ts` - Auth middleware
- `/middleware.ts` - Route protection

**Notifications**:
- `/app/settings/page.tsx` - Settings UI (protected)
- `/app/api/notifications/*` - API endpoints
- `/app/api/cron/reminder/route.ts` - Daily cron job
- `/lib/notifications.ts` - Notification utilities
- `/public/sw.js` - Service worker
- `vercel.json` - Cron schedule (6:30 PM UTC = 11:30 PM IST)

## Browser Support
Chrome, Firefox, Edge, Safari 16+ (iOS 16.4+ requires add to home screen)
