# AuroraAI — Emotion-Aware AI Reflection Engine

> Transform daily reflections into personalized, emotion-driven art with explainable AI decisions and adaptive learning.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Postgres+Auth+Storage-green?logo=supabase)
![Gemini](https://img.shields.io/badge/Google-Gemini%20AI-blue?logo=google)
![Stable Diffusion](https://img.shields.io/badge/Stable%20Diffusion-XL-purple)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)

---

## What Is AuroraAI?

AuroraAI is a production-deployed web application that turns your daily reflections into AI-generated visual art. Unlike generic image generators, AuroraAI:

1. **Detects your emotional state** from what you write
2. **Adapts the image style, colors, and composition** to match your emotion
3. **Explains every AI decision** transparently
4. **Learns from your feedback** to improve over time
5. **Generates weekly insight reports** tracking your emotional journey

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  Next.js 16 (App Router) + React 19 + TypeScript + Tailwind │
│  Pages: Home, Daily Form, Result, History, Insights, Settings│
└────────────────────────┬────────────────────────────────────┘
                         │ API Routes (Serverless)
┌────────────────────────▼────────────────────────────────────┐
│                     BACKEND PIPELINE                        │
│                                                             │
│  1. User Input → Emotion Detection Engine (keyword NLP)     │
│  2. Emotion + Theme → Style Modifier Selection              │
│  3. User Feedback Prefs → Override Defaults (learning loop) │
│  4. Gemini AI → Emotion-Aware Prompt Generation             │
│  5. Content Moderation → Safety Validation                  │
│  6. Gemini AI → Prompt Refinement with Emotion Context      │
│  7. Stable Diffusion XL → Image Generation                  │
│  8. Supabase Storage → Image Upload                         │
│  9. Explainability Engine → Decision Audit Trail            │
│ 10. Response → Enriched Result (image + emotion + explain)  │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      DATA LAYER                             │
│  Supabase (PostgreSQL + Auth + Storage + RLS)               │
│                                                             │
│  Tables:                                                    │
│  ├── users (auth-linked, RLS-protected)                     │
│  ├── daily_responses (+ emotion, theme, confidence)         │
│  ├── generated_images (+ emotion, style_modifiers)          │
│  ├── image_explanations (full decision audit)               │
│  ├── user_feedback (yes/partially/no + learning)            │
│  ├── emotion_style_prefs (feedback-learned mappings)        │
│  ├── weekly_summaries (AI-generated weekly reports)         │
│  ├── push_subscriptions (multi-device notifications)        │
│  ├── notification_log (audit trail)                         │
│  └── generation_logs (telemetry + cost tracking)            │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Emotion-Aware Prompt Engineering
- **14 emotion categories** detected via keyword NLP: happy, calm, motivated, grateful, stressed, anxious, overwhelmed, tired, sad, frustrated, neutral, confident, excited, reflective
- **8 theme categories**: work, learning, health, personal, social, creative, finance, spiritual
- Each emotion maps to a unique **color palette, lighting style, mood descriptor, and atmosphere**
- Emotion detection is **zero-cost** (no API calls) — runs entirely on keyword lexicon analysis

### 2. Explainable AI (XAI)
- Every generated image comes with a full breakdown:
  - What you shared (input summary)
  - What emotion was detected and why
  - What theme was identified
  - How the prompt was designed
  - Why the visual style was chosen
  - Why specific colors/mood were used
  - Composition decisions
- Stored separately in `image_explanations` table for auditability

### 3. Weekly AI Summarization Pipeline
- Vercel Cron runs every Sunday at 9 AM UTC
- Aggregates all reflections from the past 7 days per user
- Gemini generates a warm, insightful weekly summary
- Stable Diffusion generates a representative image for the week
- Tracks mood trend: improving / stable / declining / mixed
- Displays emotion distribution + theme patterns on Insights page

### 4. Feedback-Driven Learning Loop
- After each image: "Does this image represent your day?" (Yes / Partially / No)
- Feedback updates `emotion_style_prefs` table
- Future generations for the same emotion check learned preferences
- If user liked previous style → reuse; if not → adapt
- Creates a personalization flywheel over time

### 5. Secure Multi-Tenant Architecture
- **Every table** has Row Level Security (RLS) enabled
- Policies enforce `auth.uid() = auth_user_id` scoping
- Service role used only for server-side operations
- Daily rate limiting (2 generations/day per user)
- Content moderation pipeline with blocked term detection + Gemini-based cleaning

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 16 (App Router), React 19, TypeScript | SSR, RSC, type safety, modern routing |
| Styling | Tailwind CSS 4 | Utility-first, rapid UI, dark mode native |
| Database | Supabase PostgreSQL | Free tier, RLS, real-time, managed |
| Auth | Supabase Auth | Email/password, session management, JWT |
| Storage | Supabase Storage | Image blobs, public bucket, free 1GB |
| AI Text | Google Gemini 2.5 Flash Lite | Free 1,500 req/day, excellent instruction following |
| AI Image | Stable Diffusion XL (Hugging Face) | Free inference, high quality, no watermarks |
| Hosting | Vercel | Free tier, serverless functions, cron jobs |
| Notifications | Web Push API + VAPID | Free, browser-native, no third-party service |

**Cost: $0/month** — all services operate within free tiers.

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/submit` | POST | Full pipeline: emotion detect → prompt → image → explain |
| `/api/feedback` | POST | Store user feedback, update style preferences |
| `/api/explanation` | GET | Fetch stored explanation for an image |
| `/api/weekly-summary` | GET | Fetch user's weekly summaries |
| `/api/cron/weekly-summary` | GET | Cron: generate weekly summaries for all users |
| `/api/cron/reminder` | GET | Cron: send daily reminder push notifications |
| `/api/notifications/*` | Various | Subscribe, unsubscribe, test push notifications |
| `/api/telemetry/*` | Various | Log and query generation telemetry |

---

## Project Structure

```
AuroraAI/
├── app/
│   ├── api/
│   │   ├── submit/route.ts            # Core pipeline (emotion + image + explain)
│   │   ├── feedback/route.ts          # Feedback learning loop
│   │   ├── explanation/route.ts       # Explainability queries
│   │   ├── weekly-summary/route.ts    # Weekly summary queries
│   │   ├── cron/
│   │   │   ├── reminder/route.ts      # Daily reminder cron
│   │   │   └── weekly-summary/route.ts # Weekly summary cron
│   │   └── notifications/             # Push notification endpoints
│   ├── components/
│   │   ├── Navigation.tsx             # App navigation bar
│   │   └── ServiceWorkerRegistration.tsx
│   ├── daily-form/page.tsx            # Reflection input form
│   ├── result/page.tsx                # Result + explainability + feedback
│   ├── history/page.tsx               # Reflection history with emotion tags
│   ├── insights/page.tsx              # Weekly summaries + emotion patterns
│   ├── settings/page.tsx              # Notification preferences
│   ├── login/page.tsx                 # Auth login
│   ├── signup/page.tsx                # Auth signup
│   ├── page.tsx                       # Landing page
│   └── layout.tsx                     # Root layout
├── lib/
│   ├── emotion-engine.ts             # Emotion detection + style mapping
│   ├── explainability.ts             # XAI explanation generator
│   ├── content-moderation.ts         # Safety filtering
│   ├── telemetry.ts                  # Usage tracking
│   ├── reflection-agent.ts           # Prompt template engine
│   ├── supabase-admin.ts             # Service role client
│   └── supabase/
│       ├── client.ts                 # Browser client
│       ├── server.ts                 # Server client
│       └── middleware.ts             # Auth middleware
├── schema.sql                         # Base tables
├── schema-upgrade.sql                 # v2 tables (emotion, feedback, weekly)
├── schema-auth.sql                    # Auth + RLS policies
├── schema-notifications.sql           # Push notification tables
├── schema-telemetry.sql               # Telemetry tables
├── vercel.json                        # Cron job configuration
└── middleware.ts                      # Route-level auth middleware
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_AI_API_KEY` | Google Gemini API key | ✅ |
| `HUGGINGFACE_API_KEY` | Hugging Face API token | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key for push | ✅ |
| `VAPID_PRIVATE_KEY` | VAPID private key | ✅ |
| `CRON_SECRET` | Secret for cron endpoint security | ✅ |

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel dashboard
3. Add all environment variables
4. Deploy!

```bash
# Or use Vercel CLI
npm i -g vercel
vercel login
vercel
```

### Set Up Cron Jobs

The `vercel.json` file configures a daily cron job at 8 PM UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron/reminder",
      "schedule": "0 20 * * *"
    }
  ]
}
```

## 📱 Features in Detail

### AI Prompt Engineering
- Context extraction from user activities (coding → monitors, jogging → sunrise)
- Mood translation to atmospheric lighting (happy → warm golden tones)
- Time-aware elements (morning/evening → appropriate lighting)
- Quality enhancement (cinematic, 8k, depth of field, textures)

### Security
- JWT-based authentication with Supabase Auth
- Row Level Security (RLS) policies - users can only access their own data
- Environment variables for sensitive keys
- CRON_SECRET to protect scheduled endpoints
- HTTPS everywhere (enforced by Vercel)

### Performance
- Server components for reduced JavaScript bundle
- Next.js Image optimization with lazy loading
- Edge network via Vercel CDN
- Database query optimization with indexed foreign keys
- Supabase connection pooling

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Google Gemini](https://ai.google.dev/) - AI prompt generation
- [Stable Diffusion XL](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0) - Image generation
- [Vercel](https://vercel.com/) - Hosting platform
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## 📞 Contact

**Sameer Kadam** - [@Sameer6305](https://github.com/Sameer6305)

Project Link: [https://github.com/Sameer6305/AuroraAI](https://github.com/Sameer6305/AuroraAI)

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/your-username/AuroraAI.git
cd AuroraAI

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Fill in all keys (see .env.local.example for instructions)

# 4. Run Supabase SQL schemas (in Supabase SQL Editor, in order)
# schema.sql → schema-auth.sql → schema-notifications.sql → schema-telemetry.sql → schema-upgrade.sql

# 5. Start development server
npm run dev
```

---

## Database Schema (v2 Additions)

```sql
-- daily_responses: added emotion detection columns
+  detected_emotion TEXT          -- e.g., 'stressed', 'motivated'
+  detected_theme TEXT            -- e.g., 'work', 'learning'
+  emotion_confidence DECIMAL     -- 0.00 to 1.00
+  emotion_metadata JSONB         -- secondary emotion, keywords

-- generated_images: added emotion context
+  emotion TEXT
+  theme TEXT
+  style_modifiers JSONB          -- palette, mood, lighting, atmosphere
+  raw_prompt TEXT                 -- original pre-refinement prompt

-- NEW: image_explanations (Explainable AI audit)
-- NEW: user_feedback (feedback loop data)
-- NEW: weekly_summaries (weekly AI reports)
-- NEW: emotion_style_prefs (learned user preferences)
```

---

## Why This Impresses Recruiters

| Aspect | Signal |
|--------|--------|
| **Emotion-aware AI pipeline** | Shows ML/NLP understanding beyond API calls |
| **Explainable AI** | Demonstrates XAI principles (a real industry concern) |
| **Feedback learning loop** | Proves understanding of recommendation systems |
| **Async cron pipelines** | Production-grade background job architecture |
| **Row Level Security** | Security-first mindset, multi-tenant awareness |
| **Zero-cost architecture** | Shows ability to build within constraints |
| **Clean separation of concerns** | lib/ for logic, api/ for routes, components/ for UI |
| **Incremental enhancement** | Built on existing system, not rebuilt from scratch |
| **TypeScript throughout** | Type safety in both frontend and backend |
| **Content moderation** | Shows awareness of responsible AI deployment |

---

## License

MIT

---

Built with intention. Deployed with care. Designed to impress.
