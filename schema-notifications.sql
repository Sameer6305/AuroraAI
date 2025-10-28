-- Add notification settings and push subscriptions to existing schema

-- Add notification preferences to users table
ALTER TABLE users 
ADD COLUMN notification_enabled BOOLEAN DEFAULT false,
ADD COLUMN notification_mode TEXT DEFAULT 'app-only' CHECK (notification_mode IN ('app-only', 'always')),
ADD COLUMN push_subscription JSONB;

-- Push subscriptions table (alternative approach - one user can have multiple devices)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Notification log (optional - to track what was sent)
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);

CREATE INDEX idx_notification_log_user_id ON notification_log(user_id);
CREATE INDEX idx_notification_log_sent_at ON notification_log(sent_at DESC);
