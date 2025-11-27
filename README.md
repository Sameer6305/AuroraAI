# 🌟 AuroraAI - AI-Powered Daily Reflection App

> Transform your daily experiences into personalized AI-generated wallpapers with meaningful insights

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Overview

**AuroraAI** is a full-stack web application that combines daily reflection journaling with AI-powered image generation. Users submit their daily thoughts, gratitude, challenges, and goals, and the app generates a personalized wallpaper that visually represents their day using advanced AI models.

### ✨ Key Features

- 🎨 **AI-Generated Wallpapers** - Unique 1024x1024 images created from your reflections
- 📝 **Daily Reflection Journal** - Structured format for gratitude, achievements, challenges, and goals
- 🤖 **Dual AI System** - Google Gemini for prompt creation + Stable Diffusion XL for image generation
- 📊 **History Tracking** - View all your past reflections with generated images
- 🔐 **Secure Authentication** - Email/password auth with Supabase
- 🔔 **Push Notifications** - Daily reminders to reflect (with service workers)
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 💾 **Cloud Storage** - Images stored on Supabase with CDN delivery
- ⚡ **Serverless Architecture** - Fast, scalable API routes

## 🚀 Live Demo

[View Live Demo](https://your-app-url.vercel.app) *(Deploy to add link)*

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Fonts:** Next.js Font Optimization (Inter)

### Backend
- **API:** Next.js API Routes (Serverless)
- **Runtime:** Node.js
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (JWT-based)
- **Storage:** Supabase Storage (S3-compatible)

### AI Services
- **Prompt Generation:** Google Gemini 2.5 Flash Lite
- **Image Generation:** Stable Diffusion XL (via Hugging Face)

### Infrastructure
- **Hosting:** Vercel (Edge Network)
- **Notifications:** Web Push API + Service Workers
- **Cron Jobs:** Vercel Cron (scheduled reminders)

## 💰 Cost

**$0/month** - 100% FREE stack!

- ✅ Google Gemini: FREE (1,500 requests/day)
- ✅ Stable Diffusion XL: FREE (Hugging Face Inference API)
- ✅ Supabase: FREE tier (500MB DB + 1GB storage)
- ✅ Vercel: FREE tier (100GB bandwidth)
- ✅ Push Notifications: FREE (Web Push API)

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier)
- Google AI API key (free)
- Hugging Face API key (free)

### 1. Clone the Repository

```bash
git clone https://github.com/Sameer6305/AuroraAI.git
cd AuroraAI
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Google AI (Gemini 2.5)
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Hugging Face (Stable Diffusion)
HUGGINGFACE_API_KEY=your_huggingface_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# VAPID Keys (for push notifications)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# Cron Job Security
CRON_SECRET=your_random_secret_string
```

### 4. Set Up Supabase Database

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  notification_enabled BOOLEAN DEFAULT false,
  notification_mode TEXT DEFAULT 'app-only',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create daily_responses table
CREATE TABLE daily_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  gratitude TEXT,
  highlight TEXT,
  challenge TEXT,
  goal TEXT,
  activities TEXT,
  mood TEXT,
  vibe TEXT,
  theme TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create generated_images table
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_response_id UUID REFERENCES daily_responses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt TEXT,
  model TEXT DEFAULT 'stable-diffusion-xl',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create push_subscriptions table
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  last_used_at TIMESTAMP DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  read BOOLEAN DEFAULT false
);

-- Create generation_telemetry table
CREATE TABLE generation_telemetry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  prompt_length INTEGER,
  generation_time_ms INTEGER,
  model TEXT,
  success BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can view own responses" ON daily_responses FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));
CREATE POLICY "Users can insert own responses" ON daily_responses FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can view own images" ON generated_images FOR SELECT USING (daily_response_id IN (SELECT id FROM daily_responses WHERE user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())));
```

### 5. Create Storage Bucket

In Supabase Dashboard:
1. Go to **Storage**
2. Create a new bucket named `generated-images`
3. Make it **public**

### 6. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🎯 How It Works

### User Flow

1. **Sign Up/Login** → User creates an account or logs in
2. **Daily Reflection Form** → User fills out:
   - Gratitude
   - Highlight of the day
   - Challenges faced
   - Goals for tomorrow
   - Activities done
   - Current mood
   - Overall vibe
3. **AI Processing** → 
   - Google Gemini analyzes the input and creates a detailed visual prompt
   - Stable Diffusion XL generates a 1024x1024 wallpaper
4. **Storage** → Image uploaded to Supabase Storage
5. **Result Display** → User sees their personalized wallpaper with download option
6. **History** → All reflections saved and accessible in history page

### Architecture

```
User Input → Next.js API Route → Gemini AI (Prompt) 
                                        ↓
                              Stable Diffusion XL (Image)
                                        ↓
                              Supabase Storage (Upload)
                                        ↓
                              PostgreSQL (Save Metadata)
                                        ↓
                              Display Result to User
```

## 📁 Project Structure

```
AuroraAI/
├── app/
│   ├── api/                    # API routes (serverless functions)
│   │   ├── submit/            # Main reflection submission endpoint
│   │   ├── cron/              # Scheduled reminder jobs
│   │   └── notifications/     # Push notification management
│   ├── components/            # React components
│   │   ├── Navigation.tsx     # Global navbar
│   │   └── ServiceWorkerRegistration.tsx
│   ├── daily-form/            # Daily reflection form page
│   ├── history/               # Past reflections view
│   ├── settings/              # User preferences
│   ├── result/                # Generated wallpaper display
│   ├── login/                 # Authentication pages
│   ├── signup/
│   └── layout.tsx             # Root layout
├── lib/
│   ├── supabase/              # Supabase client configurations
│   └── notifications.ts       # Push notification utilities
├── public/
│   └── sw.js                  # Service worker for notifications
├── .env.local                 # Environment variables (not committed)
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── vercel.json                # Vercel deployment config
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

**Pranav Kadam** - [@Sameer6305](https://github.com/Sameer6305)

Project Link: [https://github.com/Sameer6305/AuroraAI](https://github.com/Sameer6305/AuroraAI)

---

<p align="center">Made with ❤️ and AI</p>
