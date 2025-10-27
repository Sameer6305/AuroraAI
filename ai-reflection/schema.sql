-- Database Schema for AI Reflection App

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily responses table
CREATE TABLE daily_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  response JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated images table
CREATE TABLE generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  response_id UUID REFERENCES daily_responses(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt_used TEXT,
  generator TEXT,
  vibe TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_daily_responses_user_id ON daily_responses(user_id);
CREATE INDEX idx_daily_responses_created_at ON daily_responses(created_at DESC);
CREATE INDEX idx_generated_images_user_id ON generated_images(user_id);
CREATE INDEX idx_generated_images_response_id ON generated_images(response_id);
CREATE INDEX idx_generated_images_created_at ON generated_images(created_at DESC);

-- Optional: Add email index if you'll query by email frequently
CREATE INDEX idx_users_email ON users(email);
