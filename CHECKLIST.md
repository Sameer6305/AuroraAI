# AuroraAI - Implementation Checklist

Use this checklist to track implementation and deployment progress.

## ✅ Phase 1: Email Removal & Download

- [x] Uninstalled Resend package
- [x] Removed email sending code
- [x] Created `/api/download` endpoint
- [x] Implemented signed URL generation (5 min expiry)
- [x] Updated submit route to skip email
- [x] Tested image download from app

## ✅ Phase 2: Push Notifications

- [x] Installed `web-push` and `@types/web-push`
- [x] Generated VAPID keys
- [x] Created notification database schema (`schema-notifications.sql`)
- [x] Created `/lib/notifications.ts` utilities
- [x] Created `/public/sw.js` service worker
- [x] Created `/app/settings/page.tsx` with notification controls
- [x] Created notification API endpoints:
  - [x] `/api/notifications/subscribe`
  - [x] `/api/notifications/unsubscribe`
  - [x] `/api/notifications/preferences`
  - [x] `/api/notifications/test`
- [x] Created daily reminder cron job (`/api/cron/reminder`)
- [x] Configured `vercel.json` with cron schedule
- [x] Created `schema-functions.sql` for `get_daily_reminders()`
- [x] Documented in `README_NOTIFICATIONS.md`

## ✅ Phase 3: Authentication

- [x] Installed Supabase packages:
  - [x] `@supabase/ssr`
  - [x] `@supabase/auth-helpers-nextjs`
- [x] Created Supabase client utilities:
  - [x] `/lib/supabase/server.ts`
  - [x] `/lib/supabase/client.ts`
  - [x] `/lib/supabase/middleware.ts`
- [x] Created auth database schema (`schema-auth.sql`)
- [x] Created authentication pages:
  - [x] `/app/login/page.tsx`
  - [x] `/app/signup/page.tsx`
- [x] Created auth routes:
  - [x] `/app/auth/callback/route.ts` (OAuth)
  - [x] `/app/auth/signout/route.ts`
- [x] Created `/middleware.ts` for route protection
- [x] Protected routes: `/daily-form`, `/history`, `/settings`
- [x] Updated `/app/api/submit/route.ts` with auth
- [x] Linked `generated_images.user_id` to `auth.users.id`
- [x] Configured Google OAuth in Supabase
- [x] Documented in `README_AUTH.md`

## ✅ Phase 4: Content Moderation

- [x] Created `/lib/content-moderation.ts`
- [x] Defined blocked terms:
  - [x] Public figures
  - [x] Explicit content
  - [x] Violence
  - [x] Hate speech
- [x] Implemented `moderatePrompt()` function
- [x] Implemented `cleanPromptWithClaude()` function
- [x] Implemented `validateAndCleanPrompt()` wrapper
- [x] Created `/api/clean-prompt` endpoint for testing
- [x] Integrated into `/api/submit` route
- [x] Tested blocked content handling
- [x] Tested Claude prompt cleaning

## ✅ Phase 5: Rate Limiting

- [x] Implemented 2 generations per day limit
- [x] Added daily limit check in `/api/submit/route.ts`
- [x] Used existing `daily_responses` table for tracking
- [x] Returned 429 status code for limit exceeded
- [x] Added friendly error message
- [x] Tested rate limiting enforcement

## ✅ Phase 6: Telemetry & Analytics

- [x] Created telemetry database schema (`schema-telemetry.sql`)
- [x] Created `generation_logs` table with fields:
  - [x] id, user_id, generator, time_ms, cost
  - [x] prompt_length, success, error_message, metadata
- [x] Created `get_user_usage_stats()` RPC function
- [x] Implemented RLS policies for telemetry
- [x] Created `/lib/telemetry.ts` utilities:
  - [x] `calculateCost()` function
  - [x] `logGeneration()` function
  - [x] `getUserUsageStats()` function
- [x] Created telemetry API endpoints:
  - [x] `/api/telemetry/log` (POST)
  - [x] `/api/telemetry/stats` (GET)
- [x] Integrated telemetry into `/api/submit`:
  - [x] Track Claude processing time
  - [x] Track image generation time
  - [x] Log successful generations
  - [x] Log failed generations
  - [x] Calculate and store costs
- [x] Documented in `README_TELEMETRY.md`

## 📋 Environment Variables Setup

- [ ] Copy `.env.local.example` to `.env.local`
- [ ] Set Supabase variables:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Set AI service keys:
  - [ ] `ANTHROPIC_API_KEY`
  - [ ] `GOOGLE_AI_API_KEY`
  - [ ] `MIDJOURNEY_API_KEY` (optional)
  - [ ] `MIDJOURNEY_API_URL` (optional)
- [ ] Set push notification keys:
  - [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  - [ ] `VAPID_PRIVATE_KEY`
  - [ ] `VAPID_SUBJECT`
- [ ] Set app URL:
  - [ ] `NEXT_PUBLIC_APP_URL`

## 📋 Supabase Setup

- [ ] Create Supabase project
- [ ] Run database migrations in SQL Editor:
  - [ ] `schema-auth.sql`
  - [ ] `schema-notifications.sql`
  - [ ] `schema-functions.sql`
  - [ ] `schema-telemetry.sql`
- [ ] Create Storage bucket:
  - [ ] Bucket name: `generated-images`
  - [ ] Set to private
  - [ ] Add RLS policies for storage
- [ ] Configure authentication:
  - [ ] Enable email provider
  - [ ] Enable Google OAuth provider
  - [ ] Add redirect URLs
  - [ ] Configure site URL
- [ ] Verify RLS policies active on all tables

## 📋 Google Cloud Setup (Imagen-3)

- [ ] Create/select Google Cloud project
- [ ] Enable APIs:
  - [ ] Vertex AI API
  - [ ] Generative Language API
- [ ] Create API key
- [ ] Copy API key to env vars
- [ ] Enable billing
- [ ] Set up budget alerts

## 📋 Anthropic Setup (Claude)

- [ ] Create Anthropic account
- [ ] Generate API key
- [ ] Copy API key to env vars
- [ ] Set usage limits
- [ ] Enable budget alerts

## 📋 Vercel Deployment

- [ ] Connect Git repository to Vercel
- [ ] Configure environment variables in Vercel
- [ ] Add variables to all environments (Production, Preview, Development)
- [ ] Configure custom domain (optional)
- [ ] Verify cron job enabled:
  - [ ] Path: `/api/cron/reminder`
  - [ ] Schedule: `0 18 * * *` (6:00 PM UTC)
- [ ] Deploy to production
- [ ] Verify deployment successful

## 📋 Testing Checklist

### Authentication
- [ ] Sign up with email/password
- [ ] Verify email (check inbox)
- [ ] Log in with email/password
- [ ] Log in with Google OAuth
- [ ] Protected routes redirect to login when not authenticated
- [ ] Sign out works correctly

### Image Generation
- [ ] Submit daily reflection form
- [ ] Claude generates prompt successfully
- [ ] Content moderation allows safe prompts
- [ ] Content moderation blocks inappropriate prompts
- [ ] Imagen-3 generates image
- [ ] Image uploads to Supabase Storage
- [ ] Image appears in `/history` page
- [ ] Download link works
- [ ] Signed URL expires after 5 minutes

### Rate Limiting
- [ ] First generation of the day succeeds
- [ ] Second generation of the day succeeds
- [ ] Third generation returns 429 error
- [ ] Error message: "Daily limit reached"
- [ ] Next day, can generate again

### Notifications
- [ ] Navigate to `/settings`
- [ ] Enable notifications
- [ ] Browser prompts for permission
- [ ] Grant permission
- [ ] Click "Send Test Notification"
- [ ] Test notification received
- [ ] Change notification mode (app-only vs always)
- [ ] Preferences saved to database
- [ ] Daily reminder sent at scheduled time (11:30 PM IST)

### Telemetry
- [ ] Make a few image generations
- [ ] Check `generation_logs` table in Supabase
- [ ] Verify logs contain:
  - [ ] Claude generation logs
  - [ ] Image generation logs
  - [ ] Execution times (time_ms)
  - [ ] Costs calculated
  - [ ] Success/failure status
- [ ] Call `/api/telemetry/stats` endpoint
- [ ] Verify statistics are accurate

### Content Moderation
- [ ] Submit reflection with celebrity name
- [ ] Verify blocked or cleaned
- [ ] Submit reflection with explicit content
- [ ] Verify blocked
- [ ] Submit normal reflection
- [ ] Verify passes moderation

## 📋 Security Audit

- [ ] RLS enabled on all tables
- [ ] Service role key not in Git (only in Vercel env vars)
- [ ] All API keys in environment variables
- [ ] HTTPS enforced in production
- [ ] CORS configured correctly
- [ ] Content moderation active
- [ ] Rate limiting enforced
- [ ] Signed URLs expire
- [ ] No sensitive data in telemetry logs
- [ ] No console.log() with secrets in production

## 📋 Monitoring Setup

- [ ] Supabase:
  - [ ] Enable database backups
  - [ ] Set up error alerts
  - [ ] Monitor storage usage
- [ ] Vercel:
  - [ ] Enable Analytics
  - [ ] Set up error tracking (Sentry/etc)
  - [ ] Monitor function execution times
  - [ ] Monitor bandwidth usage
- [ ] AI Services:
  - [ ] Set budget limits on Google Cloud
  - [ ] Set usage limits on Anthropic
  - [ ] Enable cost alerts
- [ ] Telemetry:
  - [ ] Create cost tracking query
  - [ ] Set up weekly cost reports
  - [ ] Monitor error rates

## 📋 Documentation Review

- [ ] Read `README_AUTH.md`
- [ ] Read `README_NOTIFICATIONS.md`
- [ ] Read `README_TELEMETRY.md`
- [ ] Read `DEPLOYMENT.md`
- [ ] Read `PROJECT_SUMMARY.md`
- [ ] Understand `.env.local.example`
- [ ] Review all database schemas

## 📋 Post-Deployment

- [ ] Test authentication in production
- [ ] Test image generation in production
- [ ] Test notifications in production
- [ ] Verify cron job runs
- [ ] Monitor logs for 24-48 hours
- [ ] Check for any errors
- [ ] Verify telemetry data flowing
- [ ] Monitor API costs
- [ ] Collect user feedback

## 📋 Maintenance Schedule

### Daily
- [ ] Check Vercel logs for errors
- [ ] Monitor API costs

### Weekly
- [ ] Review telemetry stats
- [ ] Check content moderation blocks
- [ ] Review error patterns
- [ ] Monitor rate limit usage

### Monthly
- [ ] Update dependencies (`npm update`)
- [ ] Review and optimize costs
- [ ] Update blocked terms list (if needed)
- [ ] Review user feedback
- [ ] Check for platform updates (Supabase, Vercel)

### Quarterly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Consider new features
- [ ] Update documentation

## ✅ Project Status

**Overall Completion**: ██████████ 100%

- ✅ Email removal
- ✅ Push notifications
- ✅ Authentication
- ✅ Content moderation
- ✅ Rate limiting
- ✅ Telemetry
- ✅ Documentation
- ⏳ Deployment (pending user action)

**Next Step**: Follow [DEPLOYMENT.md](./DEPLOYMENT.md) to deploy to production.

---

**Checklist Version**: 1.0.0  
**Last Updated**: January 2025
