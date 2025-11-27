# 🎯 AuroraAI - Interview Preparation Guide

## 📋 Project Overview
**AuroraAI** is a full-stack AI-powered daily reflection application that transforms user inputs into personalized AI-generated wallpapers with insights.

**Tech Stack Summary:**
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (Serverless)
- **Database:** Supabase (PostgreSQL)
- **AI Services:** Google Gemini 2.5 Flash Lite, Stable Diffusion XL
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Notifications:** Web Push API, Service Workers
- **Deployment:** Vercel (with Cron Jobs)

---

## 🎨 Frontend

### Languages & Frameworks Used
| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **TypeScript** | Type-safe JavaScript | Catch errors at compile-time, better IDE support, improves code quality |
| **React 19** | UI Library | Component-based architecture, virtual DOM for performance, rich ecosystem |
| **Next.js 16** | React Framework | Server-side rendering (SSR), App Router, built-in API routes, SEO optimization |
| **Tailwind CSS 4** | Styling | Utility-first CSS, rapid UI development, consistent design system |

### Key Frontend Features
- **App Router:** Modern Next.js routing with server and client components
- **Server Components:** Default rendering for better performance
- **Client Components:** Interactive features (navigation, forms, notifications)
- **Responsive Design:** Mobile-first approach with Tailwind breakpoints
- **Image Optimization:** Next.js Image component for lazy loading

### Frontend Structure
```
app/
├── components/          # Reusable UI components
│   ├── Navigation.tsx   # Global navbar (client component)
│   └── ServiceWorkerRegistration.tsx
├── (pages)/
│   ├── page.tsx         # Homepage (server component)
│   ├── daily-form/      # Reflection form
│   ├── history/         # User's past reflections
│   ├── settings/        # User preferences
│   └── result/          # AI-generated wallpaper display
└── api/                 # Backend API routes
```

---

## ⚙️ Backend

### Languages & Technologies
| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **TypeScript** | Backend logic | Same language as frontend, type safety across stack |
| **Next.js API Routes** | RESTful API | Serverless functions, same codebase as frontend, easy deployment |
| **Node.js** | Runtime | JavaScript everywhere, non-blocking I/O for AI API calls |

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/submit` | POST | Process reflection, generate AI prompt & image |
| `/api/cron/reminder` | GET | Daily reminder cron job (8 PM UTC) |
| `/api/notifications/subscribe` | POST | Subscribe to push notifications |
| `/api/notifications/preferences` | POST | Update notification settings |
| `/api/download` | GET | Download generated wallpaper |
| `/api/telemetry/log` | POST | Log image generation metrics |
| `/api/clean-prompt` | POST | Sanitize AI prompts |

### Backend Flow (Main Process)
```
User Submits Form → /api/submit
    ↓
1. Receive reflection data (gratitude, mood, activities, etc.)
    ↓
2. Call Gemini AI API (prompt generation)
    ↓
3. Call Stable Diffusion API (image generation)
    ↓
4. Upload image to Supabase Storage
    ↓
5. Save data to PostgreSQL (daily_responses, generated_images)
    ↓
6. Return result to user
```

---

## 🗄️ Database Management

### Database: Supabase (PostgreSQL)
**Why Supabase?**
- **Free Tier:** 500MB database + 1GB storage (cost-effective for prototype)
- **PostgreSQL:** Robust, relational database with ACID compliance
- **Built-in Auth:** Email/password authentication out of the box
- **Row Level Security (RLS):** Secure data access per user
- **Real-time:** WebSocket support for live updates
- **Storage:** Integrated file storage for images

### Database Schema

#### 1. **users** table
```sql
- id (UUID, primary key)
- auth_user_id (UUID, links to Supabase auth)
- email (TEXT)
- notification_enabled (BOOLEAN)
- notification_mode (TEXT: 'app-only' | 'always')
- created_at (TIMESTAMP)
```
**Purpose:** Store user preferences and settings

#### 2. **daily_responses** table
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key → users.id)
- gratitude (TEXT)
- highlight (TEXT)
- challenge (TEXT)
- goal (TEXT)
- activities (TEXT)
- mood (TEXT)
- vibe (TEXT)
- theme (TEXT)
- created_at (TIMESTAMP)
```
**Purpose:** Store user's daily reflection inputs

#### 3. **generated_images** table
```sql
- id (UUID, primary key)
- daily_response_id (UUID, foreign key → daily_responses.id)
- image_url (TEXT)
- prompt (TEXT)
- model (TEXT: 'stable-diffusion-xl')
- created_at (TIMESTAMP)
```
**Purpose:** Store AI-generated wallpaper metadata

#### 4. **push_subscriptions** table
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key → users.id)
- endpoint (TEXT)
- keys (JSONB: p256dh, auth)
- last_used_at (TIMESTAMP)
```
**Purpose:** Store web push notification subscriptions

#### 5. **notifications** table
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key → users.id)
- title (TEXT)
- body (TEXT)
- sent_at (TIMESTAMP)
- read (BOOLEAN)
```
**Purpose:** Track notification history

#### 6. **generation_telemetry** table
```sql
- id (UUID, primary key)
- user_id (UUID)
- prompt_length (INTEGER)
- generation_time_ms (INTEGER)
- model (TEXT)
- success (BOOLEAN)
- created_at (TIMESTAMP)
```
**Purpose:** Analytics and performance monitoring

### Database Connections

**Where connections are established:**

1. **Server-side (Secure):**
   ```typescript
   // lib/supabase/server.ts
   import { createClient } from '@supabase/ssr'
   // Uses SUPABASE_SERVICE_ROLE_KEY (admin access)
   ```
   - Used in: API routes, server components
   - Access: Full database access (bypasses RLS)

2. **Client-side (Public):**
   ```typescript
   // lib/supabase/client.ts
   import { createClient } from '@supabase/supabase-js'
   // Uses NEXT_PUBLIC_SUPABASE_ANON_KEY (limited access)
   ```
   - Used in: Client components, browser
   - Access: RLS policies enforced

---

## 🤖 External APIs Integration

### 1. Google Gemini AI API
**Package:** `@google/generative-ai`  
**Model:** `gemini-2.5-flash-lite`  
**Purpose:** Generate detailed image prompts from user reflections  
**Why Chosen:**
- ✅ **FREE:** 1,500 requests/day (no cost)
- ✅ Fast response time (flash model)
- ✅ Context-aware prompt engineering
- ✅ Excellent language understanding

**Connection Location:** `app/api/submit/route.ts`
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
```

**API Flow:**
1. System prompt: Instructions for context extraction
2. User input: Daily reflection data
3. Gemini generates: Visual description for wallpaper
4. Refinement prompt: Add lighting, textures, quality tags

### 2. Hugging Face API (Stable Diffusion XL)
**Package:** `axios` (HTTP client)  
**Model:** `stabilityai/stable-diffusion-xl-base-1.0`  
**Endpoint:** `router.huggingface.co/hf-inference/`  
**Purpose:** Generate wallpaper images from AI prompts  
**Why Chosen:**
- ✅ **FREE:** No cost for inference
- ✅ High-quality image generation
- ✅ 1024x1024 resolution support
- ✅ Fast inference via router

**Connection Location:** `app/api/submit/route.ts`
```typescript
import axios from 'axios';
const response = await axios.post(
  'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0',
  { inputs: refinedPrompt },
  {
    headers: {
      'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    responseType: 'arraybuffer'
  }
);
```

### 3. Supabase Storage API
**Package:** `@supabase/supabase-js`  
**Purpose:** Store generated wallpaper images  
**Why Chosen:**
- ✅ Integrated with Supabase database
- ✅ 1GB free storage
- ✅ CDN delivery
- ✅ Public URLs for images

**Connection Location:** `app/api/submit/route.ts`
```typescript
const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
  .from('generated-images')
  .upload(`${userId}/${filename}.png`, imageBuffer, {
    contentType: 'image/png',
  });
```

### 4. Web Push API
**Package:** `web-push`  
**Purpose:** Send push notifications for daily reminders  
**Why Chosen:**
- ✅ Browser-native (no third-party service)
- ✅ Works offline with service workers
- ✅ FREE (no cost)
- ✅ Cross-platform support

**Connection Location:** `app/api/cron/reminder/route.ts`
```typescript
import webpush from 'web-push';
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
```

---

## 🔐 Authentication & Authorization

### Supabase Auth
**Why Chosen:**
- ✅ Built-in email/password auth
- ✅ JWT token management
- ✅ Session handling
- ✅ Row Level Security (RLS) integration

**Auth Flow:**
1. User signs up → Supabase creates auth user
2. Trigger inserts user record in `users` table
3. JWT token stored in cookies (httpOnly, secure)
4. Protected routes check session server-side
5. RLS policies enforce data isolation per user

**Connection Locations:**
- Login: `app/login/page.tsx`
- Signup: `app/signup/page.tsx`
- Auth actions: `app/auth/signout/route.ts`

---

## 🚀 Deployment & Infrastructure

### Vercel Platform
**Why Vercel?**
- ✅ **FREE tier:** 100GB bandwidth
- ✅ **Automatic deployments:** Git integration
- ✅ **Serverless functions:** API routes auto-scale
- ✅ **Edge Network:** Global CDN
- ✅ **Cron Jobs:** Built-in scheduled tasks

### Cron Job Configuration
**File:** `vercel.json`
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
**Schedule:** Daily at 8:00 PM UTC (1:30 AM IST)  
**Purpose:** Send reminders to users who haven't reflected today

---

## 📊 Complete Data Flow Example

### User Creates Daily Reflection:

1. **Frontend (Client):**
   - User fills form in `app/daily-form/page.tsx`
   - Form submission triggers POST to `/api/submit`

2. **Backend (API Route):**
   - `/api/submit/route.ts` receives form data
   - Validates user authentication (Supabase session)
   - Extracts: gratitude, mood, activities, goals, etc.

3. **AI Prompt Generation (Gemini):**
   - Sends user data to Gemini API
   - System prompt: "Extract visual elements from activities..."
   - Gemini returns: Detailed scene description
   - Refinement pass: Adds lighting, textures, camera angles

4. **Image Generation (Stable Diffusion):**
   - Sends refined prompt to Hugging Face API
   - Stable Diffusion XL generates 1024x1024 image
   - Returns image as binary (arraybuffer)

5. **Storage (Supabase):**
   - Uploads image to `generated-images` bucket
   - Generates public URL
   - Saves metadata to database:
     - `daily_responses` table: User's reflection
     - `generated_images` table: Image URL + prompt

6. **Response to User:**
   - Returns reflection ID
   - Redirects to `/result?id={reflection_id}`
   - Displays generated wallpaper with download option

7. **History Page:**
   - Server component fetches user's reflections from database
   - Joins `daily_responses` with `generated_images`
   - Displays grid of past reflections with thumbnails

---

## 🎤 Key Interview Talking Points

### Why This Tech Stack?

1. **TypeScript Everywhere:**
   - Single language for frontend & backend
   - Type safety reduces bugs
   - Better developer experience with IntelliSense

2. **Next.js 16:**
   - Server-side rendering for SEO
   - App Router for modern React patterns
   - API routes eliminate separate backend server
   - Built-in optimizations (Image, Font, Script)

3. **Supabase:**
   - PostgreSQL is industry-standard (ACID, relations)
   - Built-in auth saves development time
   - Row Level Security for data isolation
   - Storage + Database in one platform

4. **Free AI Services:**
   - Gemini: Context-aware, fast, 1,500 req/day free
   - Stable Diffusion: High-quality image generation, no cost
   - Perfect for MVP/prototype budget ($0/month)

5. **Serverless Architecture:**
   - Vercel functions auto-scale
   - Pay-per-request (free tier generous)
   - No server management needed
   - Global edge network for speed

### Performance Optimizations

1. **Server Components:** Reduce client JavaScript bundle
2. **Image Optimization:** Next.js Image lazy loading + CDN
3. **Database Indexing:** Foreign keys, user_id indexes
4. **Caching:** Supabase caches frequent queries
5. **Edge Functions:** API routes run close to users

### Security Measures

1. **Environment Variables:** Secrets in `.env.local` (not committed)
2. **RLS Policies:** Users can only access their own data
3. **JWT Tokens:** Secure session management
4. **HTTPS:** All traffic encrypted (Vercel enforces)
5. **CRON_SECRET:** Protects cron endpoint from unauthorized access
6. **Input Validation:** Server-side validation in API routes

---

## 📝 Quick Facts for Interview

- **Total Cost:** $0/month (100% free stack)
- **Database Tables:** 6 (users, daily_responses, generated_images, push_subscriptions, notifications, generation_telemetry)
- **API Endpoints:** 10+ RESTful routes
- **AI Models:** 2 (Gemini 2.5 Flash Lite + Stable Diffusion XL)
- **Authentication:** Supabase Auth (JWT-based)
- **Styling:** Tailwind CSS 4 (utility-first)
- **Deployment:** Vercel (serverless, edge network)
- **Image Storage:** Supabase Storage (1GB free)
- **Notifications:** Web Push API + Service Workers
- **Cron Jobs:** Vercel Cron (daily at 8 PM UTC)

---

## 🔗 Architecture Diagram (Mental Model)

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  Next.js 16 + React 19 + TypeScript + Tailwind CSS        │
│                                                             │
│  Pages:                                                     │
│  • Homepage (Server Component)                              │
│  • Daily Form (Client Component)                            │
│  • History (Server Component + DB Query)                    │
│  • Settings (Client Component)                              │
│  • Result (Server Component + Image Display)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
                      (HTTPS Requests)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (API ROUTES)                     │
│               Next.js Serverless Functions                  │
│                                                             │
│  • /api/submit → Main reflection processor                 │
│  • /api/cron/reminder → Daily reminder job                 │
│  • /api/notifications/* → Push notification mgmt           │
│  • /api/download → Image download                          │
└─────────────────────────────────────────────────────────────┘
          ↓                    ↓                    ↓
   (API Calls)          (DB Queries)         (File Upload)
          ↓                    ↓                    ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐
│   EXTERNAL APIs  │  │    SUPABASE      │  │   SUPABASE   │
│                  │  │   PostgreSQL     │  │   STORAGE    │
│ • Gemini AI      │  │                  │  │              │
│   (Prompt Gen)   │  │ 6 Tables:        │  │ Bucket:      │
│                  │  │ • users          │  │ • generated- │
│ • Stable         │  │ • daily_responses│  │   images     │
│   Diffusion XL   │  │ • generated_imgs │  │              │
│   (Image Gen)    │  │ • subscriptions  │  │ (1GB free)   │
│                  │  │ • notifications  │  │              │
│ • Web Push API   │  │ • telemetry      │  │              │
│   (Notifications)│  │                  │  │              │
└──────────────────┘  └──────────────────┘  └──────────────┘
```

---

## 💡 Common Interview Questions & Answers

**Q: Why Next.js instead of plain React?**  
A: Next.js provides server-side rendering for better SEO, built-in API routes eliminating separate backend, App Router for modern patterns, and automatic optimizations like code splitting and image optimization.

**Q: Why TypeScript?**  
A: Type safety catches errors at compile-time, improves IDE support with autocomplete, makes refactoring safer, and serves as documentation for complex data structures.

**Q: How do you handle authentication?**  
A: Supabase Auth provides JWT-based authentication. Sessions are stored in httpOnly cookies, server components verify auth server-side, and Row Level Security ensures users only access their data.

**Q: How does the AI image generation work?**  
A: Two-step process: (1) Gemini AI analyzes user's reflection and generates a detailed visual prompt with context from their activities and mood. (2) Stable Diffusion XL uses that prompt to generate a 1024x1024 wallpaper image.

**Q: How do you ensure data security?**  
A: Multiple layers: Environment variables for secrets, RLS policies in PostgreSQL, JWT tokens for auth, HTTPS everywhere, server-side validation, and CRON_SECRET for protected endpoints.

**Q: What's your database structure?**  
A: PostgreSQL with 6 normalized tables. Foreign keys link users → reflections → images. RLS policies enforce user data isolation. Indexes on user_id and timestamps for query performance.

**Q: How do you handle file storage?**  
A: Supabase Storage provides S3-compatible object storage. Images are uploaded via SDK, stored in 'generated-images' bucket, and served via CDN with public URLs.

**Q: What's the cost to run this?**  
A: $0/month. Gemini offers 1,500 free requests/day, Stable Diffusion is free on Hugging Face, Supabase free tier includes 500MB DB + 1GB storage, and Vercel free tier handles hosting + serverless functions.

---

**Good luck with your interview! 🚀**
