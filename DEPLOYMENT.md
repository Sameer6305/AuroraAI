# AuroraAI - Complete Deployment Guide

This guide walks you through deploying the full AuroraAI application with authentication, push notifications, content moderation, rate limiting, and telemetry.

## Prerequisites

Before you begin, ensure you have:

- [ ] Supabase account and project created
- [ ] Vercel account for deployment
- [ ] Google Cloud account (for Imagen-3 API)
- [ ] Anthropic API key (for Claude)
- [ ] Midjourney API access (optional)
- [ ] Git repository connected to Vercel

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Note down:
   - Project URL
   - Anon/Public Key
   - Service Role Key (keep secret!)

### 1.2 Run Database Migrations

Execute the following SQL files in order in your Supabase SQL Editor:

#### Authentication Schema
```sql
-- Copy and paste contents of schema-auth.sql
-- Creates: users table, RLS policies, auth triggers
```

#### Notifications Schema
```sql
-- Copy and paste contents of schema-notifications.sql
-- Creates: notification_subscriptions, notification_preferences tables
```

#### Functions Schema
```sql
-- Copy and paste contents of schema-functions.sql
-- Creates: get_daily_reminders() function for cron jobs
```

#### Telemetry Schema
```sql
-- Copy and paste contents of schema-telemetry.sql
-- Creates: generation_logs table, analytics functions
```

### 1.3 Configure Storage

1. Go to **Storage** in Supabase Dashboard
2. Create a new bucket named `generated-images`
3. Set bucket to **Private** (we'll use signed URLs)
4. Add storage policy:

```sql
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'generated-images');

-- Allow service role to manage all images
CREATE POLICY "Service role can manage images"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'generated-images');
```

### 1.4 Enable Google OAuth

1. Go to **Authentication > Providers** in Supabase
2. Enable **Google** provider
3. Follow the setup wizard to configure Google OAuth:
   - Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Add authorized redirect URI: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase
4. Add your app URL to **Redirect URLs**: `https://your-domain.com/auth/callback`

## Step 2: Environment Variables

### 2.1 Create `.env.local`

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AIza...

# Midjourney (optional)
MIDJOURNEY_API_KEY=your-midjourney-key
MIDJOURNEY_API_URL=https://api.midjourney.com

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# App URL (for production)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2.2 Generate VAPID Keys

Run the following to generate VAPID keys for push notifications:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Copy the output to your `.env.local`:
- Public Key → `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- Private Key → `VAPID_PRIVATE_KEY`

## Step 3: Vercel Deployment

### 3.1 Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **New Project**
3. Import your Git repository
4. Select **Next.js** framework (auto-detected)

### 3.2 Configure Environment Variables

In Vercel project settings:

1. Go to **Settings > Environment Variables**
2. Add all variables from your `.env.local` file
3. **Important**: Add them to all environments (Production, Preview, Development)

### 3.3 Configure Domains

1. Go to **Settings > Domains**
2. Add your custom domain (optional)
3. Update `NEXT_PUBLIC_APP_URL` with your production domain

### 3.4 Set Up Cron Jobs

The `vercel.json` file already includes cron configuration:

```json
{
  "crons": [{
    "path": "/api/cron/reminder",
    "schedule": "0 18 * * *"
  }]
}
```

This runs the daily reminder notification at 6:00 PM UTC (11:30 PM IST).

**Verify Cron Setup:**
1. Deploy to Vercel
2. Go to **Settings > Cron Jobs**
3. Confirm the cron job is listed and enabled

## Step 4: Google Cloud Setup (Imagen-3)

### 4.1 Enable APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Vertex AI API**
4. Enable **Generative Language API**

### 4.2 Get API Key

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > API Key**
3. Copy the API key to `GOOGLE_AI_API_KEY` in Vercel

### 4.3 Set Up Billing

Imagen-3 requires billing enabled:
1. Go to **Billing** in Google Cloud Console
2. Link a billing account
3. Set up budget alerts (recommended: $50/month)

## Step 5: Anthropic Setup (Claude)

### 5.1 Get API Key

1. Go to [Anthropic Console](https://console.anthropic.com)
2. Create an account or sign in
3. Go to **API Keys**
4. Create a new API key
5. Copy to `ANTHROPIC_API_KEY` in Vercel

### 5.2 Set Usage Limits

1. Go to **Settings > Usage & Billing**
2. Set monthly budget limit (recommended: $20/month)
3. Enable email alerts for 80% threshold

## Step 6: Content Moderation

### 6.1 Review Blocked Terms

Check `/lib/content-moderation.ts` and customize blocked terms:

```typescript
export const BLOCKED_TERMS = {
  publicFigures: [...],
  explicitContent: [...],
  violence: [...],
  hateSpeech: [...]
};
```

Add or remove terms based on your content policy.

### 6.2 Test Moderation

Test the content moderation endpoint:

```bash
curl -X POST https://your-domain.com/api/clean-prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test prompt with sensitive content"}'
```

## Step 7: Testing

### 7.1 Test Authentication

1. Visit `/signup` and create a test account
2. Verify email sent (check Supabase Auth logs)
3. Log in with email/password
4. Test Google OAuth login
5. Verify redirect to `/daily-form`

### 7.2 Test Image Generation

1. Log in and go to `/daily-form`
2. Fill out the reflection form
3. Submit and verify:
   - Claude generates prompt
   - Content moderation runs
   - Image generates (Imagen or Midjourney)
   - Image uploads to Supabase Storage
   - Entry appears in `/history`

### 7.3 Test Rate Limiting

1. Generate 2 images in one day
2. Try a 3rd generation
3. Verify 429 error: "Daily limit reached (2 generations per day)"

### 7.4 Test Notifications

1. Go to `/settings`
2. Enable notifications
3. Grant browser permission
4. Click "Send Test Notification"
5. Verify notification received
6. Check notification preferences saved

### 7.5 Test Telemetry

1. Make a few image generations
2. Check Supabase `generation_logs` table
3. Verify logs include:
   - Claude processing time
   - Image generation time
   - Costs calculated
   - Success/failure status

Query telemetry stats:

```bash
curl https://your-domain.com/api/telemetry/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Step 8: Monitoring

### 8.1 Set Up Supabase Alerts

1. Go to **Database > Backups** - Enable daily backups
2. Go to **Database > Webhooks** - Set up alerts for errors

### 8.2 Vercel Monitoring

1. Go to **Analytics** in Vercel
2. Monitor:
   - Response times
   - Error rates
   - Bandwidth usage
3. Set up **Integrations > Monitoring** (e.g., Sentry)

### 8.3 Cost Monitoring

Create a dashboard to track AI costs:

```sql
-- Daily cost summary
SELECT 
  DATE(created_at) as date,
  SUM(cost) as total_cost,
  COUNT(*) as generations,
  generator
FROM generation_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at), generator
ORDER BY date DESC;
```

## Step 9: Security Checklist

- [ ] **RLS Enabled**: All tables have Row Level Security policies
- [ ] **Service Role Secret**: `SUPABASE_SERVICE_ROLE_KEY` is in Vercel only (not in code)
- [ ] **API Keys Secure**: All API keys in environment variables (not committed to Git)
- [ ] **HTTPS Only**: Production site uses HTTPS
- [ ] **CORS Configured**: Only your domain can access APIs
- [ ] **Content Moderation Active**: Blocked terms list updated
- [ ] **Rate Limiting**: 2 generations per day enforced
- [ ] **Auth Required**: `/daily-form`, `/history`, `/settings` protected

## Step 10: Go Live

### 10.1 Pre-Launch Checklist

- [ ] All environment variables set in Vercel
- [ ] Database migrations run in Supabase
- [ ] Google OAuth configured
- [ ] VAPID keys generated
- [ ] Custom domain configured (optional)
- [ ] Cron jobs enabled
- [ ] Content moderation tested
- [ ] Rate limiting tested
- [ ] Monitoring/alerts configured

### 10.2 Deploy to Production

1. Merge to `main` branch (triggers auto-deploy)
2. Or manually deploy: `vercel --prod`
3. Verify deployment at your production URL

### 10.3 Post-Launch Monitoring

Monitor for the first 24-48 hours:
- Check Vercel logs for errors
- Monitor Supabase database usage
- Review telemetry logs for issues
- Track API costs (Google, Anthropic)
- Verify cron job runs at scheduled time

## Troubleshooting

### Authentication Issues

**Problem**: "Invalid login credentials"
- Check Supabase Auth settings
- Verify email confirmation settings
- Review Supabase Auth logs

**Problem**: Google OAuth fails
- Verify redirect URIs match exactly
- Check Google Cloud Console credentials
- Ensure callback route exists: `/auth/callback`

### Image Generation Fails

**Problem**: "Failed to generate image"
- Check API keys are valid
- Verify billing enabled (Google Cloud)
- Review API quota limits
- Check Vercel logs for errors

**Problem**: Content moderation blocks everything
- Review `/lib/content-moderation.ts` blocked terms
- Test Claude cleaning endpoint
- Check moderation logs

### Notifications Not Working

**Problem**: Browser doesn't prompt for permission
- Ensure HTTPS in production
- Check `sw.js` is accessible: `/sw.js`
- Verify VAPID keys are correct

**Problem**: Cron reminders not sent
- Check Vercel cron job is enabled
- Verify cron schedule in `vercel.json`
- Review `/api/cron/reminder` logs
- Ensure users have `notify_always: true` in DB

### Telemetry Missing

**Problem**: No logs in `generation_logs`
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify RLS policies allow service role insert
- Review API endpoint logs
- Test telemetry manually:

```bash
curl -X POST https://your-domain.com/api/telemetry/log \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-uuid",
    "generator": "Claude",
    "timeMs": 1500,
    "success": true,
    "promptLength": 100
  }'
```

## Maintenance

### Weekly Tasks
- Review error logs in Vercel
- Check AI service costs
- Monitor rate limit usage
- Review content moderation blocks

### Monthly Tasks
- Analyze telemetry for performance trends
- Review and update blocked terms list
- Check for Supabase/Vercel updates
- Rotate API keys (if needed)
- Review user feedback

### Updates & Migrations

When updating dependencies:

```bash
# Update all packages
npm update

# Check for breaking changes
npm outdated

# Run type checking
npm run type-check

# Deploy to preview first
vercel

# If successful, deploy to production
vercel --prod
```

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs
- **Google Imagen**: https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview
- **Anthropic Claude**: https://docs.anthropic.com
- **Web Push API**: https://developer.mozilla.org/en-US/docs/Web/API/Push_API

## Getting Help

If you encounter issues:

1. Check the relevant README:
   - [Authentication](./README_AUTH.md)
   - [Notifications](./README_NOTIFICATIONS.md)
   - [Telemetry](./README_TELEMETRY.md)

2. Review logs:
   - Vercel deployment logs
   - Supabase database logs
   - Browser console (for client errors)

3. Common issues are documented in [Troubleshooting](#troubleshooting) section above

---

**Deployment Version**: 1.0.0  
**Last Updated**: January 2025  
**Next.js Version**: 16.0.0
