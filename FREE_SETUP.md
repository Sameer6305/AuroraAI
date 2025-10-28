# 🆓 AuroraAI - 100% FREE Setup Guide

## Overview

Your AuroraAI app is now **completely FREE** to run! No paid API costs.

### What Changed?

**Before** (Paid):
- ❌ Claude Sonnet 4.5: ~$0.015/generation
- ❌ Google Imagen-3: ~$0.04/image  
- ❌ Midjourney: $30-60/month

**After** (FREE):
- ✅ Google Gemini 1.5 Flash: **FREE** (1,500 requests/day)
- ✅ Stable Diffusion XL: **FREE** (Hugging Face)
- ✅ Total cost: **$0/month** 🎉

---

## Step 1: Get FREE API Keys

### 1.1 Google AI (Gemini) - FREE

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "**Create API Key**"
3. Copy the API key
4. Add to `.env.local`:
   ```bash
   GOOGLE_AI_API_KEY=AIza...your-key-here
   ```

**Free Tier Limits:**
- 1,500 requests per day
- 1 million tokens per day
- Perfect for your prototype!

### 1.2 Hugging Face (Stable Diffusion) - FREE

1. Go to [Hugging Face](https://huggingface.co/join)
2. Sign up (free account)
3. Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
4. Click "**New Token**"
5. Name it "AuroraAI" and select "Read" permission
6. Copy the token
7. Add to `.env.local`:
   ```bash
   HUGGINGFACE_API_KEY=hf_...your-token-here
   ```

**Free Tier Limits:**
- Unlimited requests (with rate limits)
- May have cold start delays (~20 seconds first time)
- Perfect for prototypes!

---

## Step 2: Complete Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# ============================================
# FREE AI SERVICES
# ============================================
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# ============================================
# SUPABASE (FREE tier)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ============================================
# PUSH NOTIFICATIONS (Already configured)
# ============================================
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BMd04aJ9TcpIKKL8_ozbDmHpMWHbyG7O-nuFh3lj7yFKc76A21gWz6xXKN8xXCMi2xBUXwLF32PAdFwYFvRQH68
VAPID_PRIVATE_KEY=OCtDb81sMUyEgUbV8HvMk0ATKHcvqYervMEUSFYx__Y

# ============================================
# CRON JOB SECURITY
# ============================================
CRON_SECRET=generate_random_string_here
```

---

## Step 3: Run Database Migration

Update your Supabase database with the new schema:

1. Go to Supabase Dashboard → SQL Editor
2. Run the updated `schema-telemetry.sql` file
3. This updates the generator types to `Stable-Diffusion` and `Gemini`

---

## Step 4: Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` and:
1. Sign up / Log in
2. Fill out daily form
3. Submit → Gemini generates prompt (FREE)
4. Image generates with Stable Diffusion (FREE)
5. Check telemetry → Cost should be **$0.00**

---

## Free Tier Limits

### Google Gemini 1.5 Flash
- **1,500 requests per day** (plenty for prototype)
- **1 million tokens per day**
- No credit card required
- No time limit

### Hugging Face Stable Diffusion
- **Unlimited requests** (with rate limiting)
- May queue during peak hours
- ~20 second cold start time
- No credit card required

### Supabase
- **500 MB database** (enough for 1000s of reflections)
- **1 GB storage** (enough for 250+ images)
- **50,000 monthly active users**
- No credit card required

### Vercel
- **100 GB bandwidth** (plenty for prototype)
- Unlimited deployments
- Free SSL/HTTPS
- No credit card required

---

## Cost Comparison

| Service | Paid Version | FREE Version | Monthly Savings |
|---------|--------------|--------------|-----------------|
| AI Prompt Generation | Claude ($30-60) | Gemini (FREE) | **$30-60** |
| Image Generation | Imagen/Midjourney ($60-120) | Stable Diffusion (FREE) | **$60-120** |
| **Total** | **$90-180** | **$0** | **$90-180** 🎉 |

---

## Limitations (Free Version)

### Image Quality
- **Stable Diffusion**: Good quality, but may not match Midjourney's artistic style
- **Solution**: Optimize prompts for Stable Diffusion, use descriptive language

### Response Time
- **Gemini**: Fast (~1-2 seconds)
- **Stable Diffusion**: Slower (~20-30 seconds with cold start, ~5 seconds warm)
- **Solution**: Add loading states, set user expectations

### Rate Limits
- **Gemini**: 1,500 requests/day (2 gens per user = 750 users/day max)
- **Hugging Face**: May queue during peak hours
- **Solution**: Your 2/day rate limit helps manage this!

---

## Production Recommendations

### For Prototype (Current Setup)
- ✅ Use FREE services
- ✅ Perfect for testing with 10-100 users
- ✅ No credit card needed

### For Scaling (Future)
Consider upgrading when:
- Daily users exceed 500
- Image quality becomes critical
- Response time needs to be <5 seconds

**Upgrade options:**
- Gemini Pro (still cheap: $0.001/request)
- Replicate Stable Diffusion (faster, $0.0023/image)
- Keep everything else free!

---

## Monitoring

Track your free tier usage:

### Google AI Studio
- Go to [Google AI Studio](https://aistudio.google.com)
- Check "**Usage**" tab
- Monitor requests per day

### Hugging Face
- Go to [Hugging Face Profile](https://huggingface.co/settings/account)
- Check API usage (not strictly enforced on free tier)

### Supabase
- Go to Supabase Dashboard → Settings → Usage
- Monitor database size and storage

---

## Troubleshooting

### "API rate limit exceeded" (Gemini)
- **Cause**: Exceeded 1,500 requests/day
- **Solution**: Wait 24 hours or implement queueing
- **Prevention**: Your 2/day user limit helps prevent this

### "Model is loading" (Hugging Face)
- **Cause**: Cold start (model not warmed up)
- **Solution**: Wait 20-30 seconds, retry
- **Prevention**: Accept slower first-time loads

### "Insufficient storage" (Supabase)
- **Cause**: Exceeded 1GB storage
- **Solution**: Delete old images or upgrade ($25/month for 100GB)
- **Prevention**: Compress images, set retention policy

---

## Next Steps

1. ✅ Get Google AI API key
2. ✅ Get Hugging Face API token
3. ✅ Update `.env.local`
4. ✅ Run database migration
5. ✅ Test locally
6. ✅ Deploy to Vercel (free tier)
7. ✅ Monitor usage
8. ✅ Enjoy your FREE prototype!

---

## Future Upgrades (Optional)

If you need better performance later:

### Better Image Quality
- **Replicate** Stable Diffusion: $0.0023/image (99% cheaper than Midjourney)
- **Stability AI** Stable Diffusion: $0.02/image

### Faster Responses
- **Replicate** (fast GPUs): ~2 seconds per image
- **Cloudflare Workers AI**: Free tier + pay-as-you-go

### More Features
- **Image upscaling**: Use Real-ESRGAN (free on Replicate)
- **Style transfer**: Use Stable Diffusion ControlNet (free)

---

## Summary

**Total Monthly Cost: $0** 🎉

You now have a fully functional AI reflection journal with:
- ✅ Free AI prompt generation (Gemini)
- ✅ Free image generation (Stable Diffusion)
- ✅ Free database + auth + storage (Supabase)
- ✅ Free hosting + cron jobs (Vercel)
- ✅ Free push notifications (Browser native)

**Perfect for your prototype!**

---

**Last Updated**: January 2025  
**Version**: 2.0.0 (FREE Edition)
