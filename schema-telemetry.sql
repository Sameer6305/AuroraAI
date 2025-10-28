-- Telemetry table for monitoring generation usage and performance (FREE VERSION)

CREATE TABLE generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  generator TEXT NOT NULL CHECK (generator IN ('Stable-Diffusion', 'Gemini')),
  time_ms INTEGER NOT NULL,
  cost DECIMAL(10, 6) DEFAULT 0, -- Always 0 now (free services)
  prompt_length INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX idx_generation_logs_generator ON generation_logs(generator);
CREATE INDEX idx_generation_logs_created_at ON generation_logs(created_at DESC);
CREATE INDEX idx_generation_logs_success ON generation_logs(success);

-- RLS Policies
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service role to insert logs (API endpoints)
CREATE POLICY "Service role can insert logs"
  ON generation_logs FOR INSERT
  WITH CHECK (true);

-- Users can view their own logs
CREATE POLICY "Users can view own logs"
  ON generation_logs FOR SELECT
  USING (auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id));

-- Function to get usage statistics
CREATE OR REPLACE FUNCTION get_user_usage_stats(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_generations', COUNT(*),
    'total_cost', COALESCE(SUM(cost), 0),
    'avg_time_ms', COALESCE(AVG(time_ms), 0),
    'success_rate', COALESCE(AVG(CASE WHEN success THEN 1 ELSE 0 END) * 100, 0),
    'by_generator', (
      SELECT json_object_agg(generator, count)
      FROM (
        SELECT generator, COUNT(*) as count
        FROM generation_logs
        WHERE user_id = target_user_id
        GROUP BY generator
      ) sub
    )
  ) INTO result
  FROM generation_logs
  WHERE user_id = target_user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
