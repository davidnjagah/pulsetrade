-- ==============================================
-- PulseTrade Database Schema
-- Supabase PostgreSQL Database
-- ==============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- Users Table
-- ==============================================
-- Stores user profiles and balances

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE,
  username TEXT,
  avatar_url TEXT,
  balance DECIMAL(18,2) DEFAULT 10000.00 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT balance_non_negative CHECK (balance >= 0),
  CONSTRAINT username_length CHECK (username IS NULL OR (char_length(username) >= 3 AND char_length(username) <= 30))
);

-- Index for wallet address lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ==============================================
-- Bets Table
-- ==============================================
-- Stores all bet records

CREATE TABLE IF NOT EXISTS bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(18,2) NOT NULL,
  target_price DECIMAL(18,8) NOT NULL,
  target_time TIMESTAMPTZ NOT NULL,
  multiplier DECIMAL(10,4) NOT NULL,
  placed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' NOT NULL,
  payout DECIMAL(18,2),
  price_at_placement DECIMAL(18,8) NOT NULL,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('active', 'won', 'lost', 'expired')),
  CONSTRAINT amount_range CHECK (amount >= 1 AND amount <= 100),
  CONSTRAINT multiplier_range CHECK (multiplier >= 1.1 AND multiplier <= 1000),
  CONSTRAINT target_time_future CHECK (target_time > placed_at),
  CONSTRAINT payout_on_resolution CHECK (
    (status = 'active' AND payout IS NULL AND resolved_at IS NULL) OR
    (status != 'active' AND resolved_at IS NOT NULL)
  )
);

-- Index for user's bets
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);

-- Index for active bets
CREATE INDEX IF NOT EXISTS idx_bets_active ON bets(status) WHERE status = 'active';

-- Index for bets by target time (for resolution scheduler)
CREATE INDEX IF NOT EXISTS idx_bets_target_time ON bets(target_time) WHERE status = 'active';

-- Composite index for user's active bets
CREATE INDEX IF NOT EXISTS idx_bets_user_active ON bets(user_id, status) WHERE status = 'active';

-- ==============================================
-- Chat Messages Table
-- ==============================================
-- Stores chat messages for the trading room

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT message_length CHECK (char_length(message) >= 1 AND char_length(message) <= 200)
);

-- Index for recent messages (ordered by time)
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Index for user's messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

-- ==============================================
-- User Settings Table
-- ==============================================
-- Stores user preferences and settings

CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  background_music BOOLEAN DEFAULT false NOT NULL,
  sound_effects BOOLEAN DEFAULT true NOT NULL,
  slippage_tolerance INTEGER DEFAULT 30 NOT NULL,
  show_high_low BOOLEAN DEFAULT false NOT NULL,
  double_tap_trading BOOLEAN DEFAULT false NOT NULL,

  -- Constraints
  CONSTRAINT slippage_range CHECK (slippage_tolerance >= 0 AND slippage_tolerance <= 100)
);

-- ==============================================
-- Leaderboard View
-- ==============================================
-- Aggregated view for leaderboard rankings

CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.id,
  u.username,
  u.avatar_url,
  COALESCE(COUNT(CASE WHEN b.status = 'won' THEN 1 END), 0)::INTEGER as wins,
  COALESCE(COUNT(CASE WHEN b.status = 'lost' THEN 1 END), 0)::INTEGER as losses,
  COALESCE(
    SUM(
      CASE
        WHEN b.status = 'won' THEN b.payout - b.amount
        WHEN b.status = 'lost' THEN -b.amount
        ELSE 0
      END
    ),
    0
  ) as profit
FROM users u
LEFT JOIN bets b ON u.id = b.user_id
GROUP BY u.id, u.username, u.avatar_url
ORDER BY profit DESC;

-- ==============================================
-- Daily Leaderboard View
-- ==============================================
-- Leaderboard for today's performance

CREATE OR REPLACE VIEW daily_leaderboard AS
SELECT
  u.id,
  u.username,
  u.avatar_url,
  COALESCE(COUNT(CASE WHEN b.status = 'won' THEN 1 END), 0)::INTEGER as wins,
  COALESCE(COUNT(CASE WHEN b.status = 'lost' THEN 1 END), 0)::INTEGER as losses,
  COALESCE(
    SUM(
      CASE
        WHEN b.status = 'won' THEN b.payout - b.amount
        WHEN b.status = 'lost' THEN -b.amount
        ELSE 0
      END
    ),
    0
  ) as profit
FROM users u
LEFT JOIN bets b ON u.id = b.user_id
  AND b.placed_at >= CURRENT_DATE
  AND b.placed_at < CURRENT_DATE + INTERVAL '1 day'
GROUP BY u.id, u.username, u.avatar_url
ORDER BY profit DESC;

-- ==============================================
-- Weekly Leaderboard View
-- ==============================================
-- Leaderboard for this week's performance

CREATE OR REPLACE VIEW weekly_leaderboard AS
SELECT
  u.id,
  u.username,
  u.avatar_url,
  COALESCE(COUNT(CASE WHEN b.status = 'won' THEN 1 END), 0)::INTEGER as wins,
  COALESCE(COUNT(CASE WHEN b.status = 'lost' THEN 1 END), 0)::INTEGER as losses,
  COALESCE(
    SUM(
      CASE
        WHEN b.status = 'won' THEN b.payout - b.amount
        WHEN b.status = 'lost' THEN -b.amount
        ELSE 0
      END
    ),
    0
  ) as profit
FROM users u
LEFT JOIN bets b ON u.id = b.user_id
  AND b.placed_at >= date_trunc('week', CURRENT_DATE)
  AND b.placed_at < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
GROUP BY u.id, u.username, u.avatar_url
ORDER BY profit DESC;

-- ==============================================
-- Functions
-- ==============================================

-- Function to update user's updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user settings on user creation
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create settings for new users
DROP TRIGGER IF EXISTS create_user_settings_trigger ON users;
CREATE TRIGGER create_user_settings_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_settings();

-- Function to validate bet placement
CREATE OR REPLACE FUNCTION validate_bet_placement()
RETURNS TRIGGER AS $$
DECLARE
  user_balance DECIMAL(18,2);
  active_bet_count INTEGER;
  locked_amount DECIMAL(18,2);
BEGIN
  -- Get user's current balance
  SELECT balance INTO user_balance FROM users WHERE id = NEW.user_id;

  -- Get count of active bets
  SELECT COUNT(*) INTO active_bet_count
  FROM bets
  WHERE user_id = NEW.user_id AND status = 'active';

  -- Get total locked in active bets
  SELECT COALESCE(SUM(amount), 0) INTO locked_amount
  FROM bets
  WHERE user_id = NEW.user_id AND status = 'active';

  -- Check if user has enough balance
  IF user_balance - locked_amount < NEW.amount THEN
    RAISE EXCEPTION 'Insufficient balance. Available: %, Required: %',
      user_balance - locked_amount, NEW.amount;
  END IF;

  -- Check max active bets limit
  IF active_bet_count >= 20 THEN
    RAISE EXCEPTION 'Maximum active bets limit reached (20)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bet validation
DROP TRIGGER IF EXISTS validate_bet_trigger ON bets;
CREATE TRIGGER validate_bet_trigger
  BEFORE INSERT ON bets
  FOR EACH ROW
  EXECUTE FUNCTION validate_bet_placement();

-- Function to update user balance on bet resolution
CREATE OR REPLACE FUNCTION update_balance_on_resolution()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if status changed to won
  IF NEW.status = 'won' AND OLD.status = 'active' THEN
    -- Add payout to user balance
    UPDATE users
    SET balance = balance + NEW.payout
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for balance updates on resolution
DROP TRIGGER IF EXISTS update_balance_trigger ON bets;
CREATE TRIGGER update_balance_trigger
  AFTER UPDATE ON bets
  FOR EACH ROW
  WHEN (OLD.status = 'active' AND NEW.status != 'active')
  EXECUTE FUNCTION update_balance_on_resolution();

-- ==============================================
-- Row Level Security (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Bets policies
CREATE POLICY "Users can view all bets"
  ON bets FOR SELECT
  USING (true);

CREATE POLICY "Users can create own bets"
  ON bets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update bets"
  ON bets FOR UPDATE
  USING (true);

-- Chat policies
CREATE POLICY "Anyone can view chat messages"
  ON chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==============================================
-- Initial Data (Demo/Test Users)
-- ==============================================

-- Insert demo users (for development/testing)
INSERT INTO users (id, wallet_address, username, avatar_url, balance) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'DemoTrader', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=demo', 10000.00),
  ('00000000-0000-0000-0000-000000000002', NULL, 'CryptoKing', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=king', 15420.50),
  ('00000000-0000-0000-0000-000000000003', NULL, 'SOLMaster', 'https://api.dicebear.com/7.x/pixel-art/svg?seed=sol', 8750.25)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- Indexes for Performance
-- ==============================================

-- Analyze tables for query optimization
ANALYZE users;
ANALYZE bets;
ANALYZE chat_messages;
ANALYZE user_settings;
