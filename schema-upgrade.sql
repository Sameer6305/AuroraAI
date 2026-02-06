-- ============================================
-- AuroraAI v2.0 Schema Upgrade
-- Features: Emotion Detection, Explainability, 
--           Weekly Summaries, Feedback Loop
-- ============================================

-- 1. Add emotion + theme columns to daily_responses
ALTER TABLE daily_responses 
ADD COLUMN IF NOT EXISTS detected_emotion TEXT,
ADD COLUMN IF NOT EXISTS detected_theme TEXT,
ADD COLUMN IF NOT EXISTS emotion_confidence DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS emotion_metadata JSONB DEFAULT '{}';

-- Index for emotion-based queries
CREATE INDEX IF NOT EXISTS idx_daily_responses_emotion ON daily_responses(detected_emotion);
CREATE INDEX IF NOT EXISTS idx_daily_responses_theme ON daily_responses(detected_theme);

-- 2. Add style_metadata to generated_images for explainability
ALTER TABLE generated_images 
ADD COLUMN IF NOT EXISTS emotion TEXT,
ADD COLUMN IF NOT EXISTS theme TEXT,
ADD COLUMN IF NOT EXISTS style_modifiers JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS raw_prompt TEXT;

-- 3. Image explanations table (audit trail for Explainable AI)
CREATE TABLE IF NOT EXISTS image_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE,
  response_id UUID REFERENCES daily_responses(id) ON DELETE CASCADE,
  explanation JSONB NOT NULL,
  -- JSONB structure: {
  --   "input_summary": "What the user shared",
  --   "detected_emotion": "stressed",
  --   "detected_theme": "work",
  --   "prompt_reasoning": "Why the prompt was crafted this way",
  --   "style_reasoning": "Why this visual style was chosen",
  --   "color_mood_reasoning": "Why these colors/mood were used",
  --   "composition_notes": "How the scene was composed"
  -- }
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_explanations_user_id ON image_explanations(user_id);
CREATE INDEX IF NOT EXISTS idx_image_explanations_image_id ON image_explanations(image_id);

-- 4. User feedback table (Feedback-Driven Learning Loop)
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_id UUID REFERENCES generated_images(id) ON DELETE CASCADE,
  response_id UUID REFERENCES daily_responses(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('yes', 'partially', 'no')),
  comment TEXT,
  detected_emotion TEXT,
  detected_theme TEXT,
  style_used TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_rating ON user_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_user_feedback_emotion ON user_feedback(detected_emotion);

-- 5. Weekly summaries table
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary_text TEXT NOT NULL,
  key_emotions TEXT[] DEFAULT '{}',
  key_themes TEXT[] DEFAULT '{}',
  reflection_count INTEGER DEFAULT 0,
  mood_trend TEXT,
  representative_image_url TEXT,
  representative_prompt TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_id ON weekly_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_week ON weekly_summaries(week_start DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_summaries_user_week 
  ON weekly_summaries(user_id, week_start);

-- 6. Emotion-style preference mapping (learns from feedback)
CREATE TABLE IF NOT EXISTS emotion_style_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emotion TEXT NOT NULL,
  preferred_style TEXT,
  preferred_palette TEXT,
  positive_count INTEGER DEFAULT 0,
  negative_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_emotion_style_prefs_user_emotion 
  ON emotion_style_prefs(user_id, emotion);

-- ============================================
-- RLS Policies for new tables
-- ============================================

-- image_explanations
ALTER TABLE image_explanations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own explanations"
  ON image_explanations FOR SELECT
  USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Service can insert explanations"
  ON image_explanations FOR INSERT
  WITH CHECK (true);

-- user_feedback
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON user_feedback FOR SELECT
  USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert own feedback"
  ON user_feedback FOR INSERT
  WITH CHECK (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Service can insert feedback"
  ON user_feedback FOR INSERT
  WITH CHECK (true);

-- weekly_summaries
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own summaries"
  ON weekly_summaries FOR SELECT
  USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Service can insert summaries"
  ON weekly_summaries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update summaries"
  ON weekly_summaries FOR UPDATE
  USING (true);

-- emotion_style_prefs
ALTER TABLE emotion_style_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prefs"
  ON emotion_style_prefs FOR SELECT
  USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

CREATE POLICY "Service can manage prefs"
  ON emotion_style_prefs FOR ALL
  USING (true);

-- ============================================
-- Helper function: Get user's feedback-adjusted style
-- ============================================
CREATE OR REPLACE FUNCTION get_preferred_style(
  target_user_id UUID,
  target_emotion TEXT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'preferred_style', preferred_style,
    'preferred_palette', preferred_palette,
    'confidence', CASE 
      WHEN (positive_count + negative_count) > 5 THEN 'high'
      WHEN (positive_count + negative_count) > 2 THEN 'medium'
      ELSE 'low'
    END
  ) INTO result
  FROM emotion_style_prefs
  WHERE user_id = target_user_id 
    AND emotion = target_emotion
    AND positive_count > negative_count;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
