-- ============================================
-- FLASHMIND DATABASE SCHEMA FOR SUPABASE
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING TABLES (if rebuilding)
-- ============================================
DROP TABLE IF EXISTS warnings CASCADE;
DROP TABLE IF EXISTS ratings CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS decks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- CREATE TABLES
-- ============================================

-- Users table (linked to Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  login_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  profile_picture TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decks table
CREATE TABLE decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT FALSE,
  is_hidden_by_admin BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  card_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards table
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_hidden_by_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ratings table
CREATE TABLE ratings (
  deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value >= 1 AND value <= 5),
  PRIMARY KEY (deck_id, user_id)
);

-- Warnings table
CREATE TABLE warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX idx_decks_owner ON decks(owner_id);
CREATE INDEX idx_decks_public ON decks(is_public) WHERE is_public = true;
CREATE INDEX idx_cards_deck ON cards(deck_id);
CREATE INDEX idx_comments_deck ON comments(deck_id);
CREATE INDEX idx_ratings_deck ON ratings(deck_id);
CREATE INDEX idx_warnings_user ON warnings(user_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR USERS
-- ============================================
CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- RLS POLICIES FOR DECKS
-- ============================================
CREATE POLICY "decks_select_public" ON decks FOR SELECT 
  USING (is_public = true AND is_hidden_by_admin = false);
CREATE POLICY "decks_select_own" ON decks FOR SELECT 
  USING (auth.uid() = owner_id);
CREATE POLICY "decks_insert_own" ON decks FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "decks_update_own" ON decks FOR UPDATE 
  USING (auth.uid() = owner_id);
CREATE POLICY "decks_delete_own" ON decks FOR DELETE 
  USING (auth.uid() = owner_id);

-- ============================================
-- RLS POLICIES FOR CARDS
-- ============================================
CREATE POLICY "cards_select_public" ON cards FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM decks 
    WHERE decks.id = cards.deck_id 
    AND (decks.is_public = true OR decks.owner_id = auth.uid())
  ));
CREATE POLICY "cards_insert_own" ON cards FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM decks 
    WHERE decks.id = deck_id 
    AND decks.owner_id = auth.uid()
  ));
CREATE POLICY "cards_update_own" ON cards FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM decks 
    WHERE decks.id = cards.deck_id 
    AND decks.owner_id = auth.uid()
  ));
CREATE POLICY "cards_delete_own" ON cards FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM decks 
    WHERE decks.id = cards.deck_id 
    AND decks.owner_id = auth.uid()
  ));

-- ============================================
-- RLS POLICIES FOR COMMENTS
-- ============================================
CREATE POLICY "comments_select_visible" ON comments FOR SELECT 
  USING (is_hidden_by_admin = false);
CREATE POLICY "comments_insert_auth" ON comments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR RATINGS
-- ============================================
CREATE POLICY "ratings_select_all" ON ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert_auth" ON ratings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ratings_update_own" ON ratings FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR WARNINGS
-- ============================================
CREATE POLICY "warnings_select_own" ON warnings FOR SELECT 
  USING (auth.uid() = user_id);
CREATE POLICY "warnings_insert_admin" ON warnings FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true
  ));
CREATE POLICY "warnings_update_own" ON warnings FOR UPDATE 
  USING (auth.uid() = user_id);

-- ============================================
-- AUTO CREATE USER PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, login_name, display_name)
  VALUES (
    NEW.id,
    COALESCE(SPLIT_PART(NEW.email, '@', 1), 'user'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1), 'User')
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- GRANT PERMISSIONS TO SUPABASE ROLES
-- ============================================

-- Authenticated users (logged in)
GRANT ALL ON TABLE users TO authenticated;
GRANT ALL ON TABLE decks TO authenticated;
GRANT ALL ON TABLE cards TO authenticated;
GRANT ALL ON TABLE comments TO authenticated;
GRANT ALL ON TABLE ratings TO authenticated;
GRANT ALL ON TABLE warnings TO authenticated;

-- Anonymous users (not logged in)
GRANT SELECT ON TABLE users TO anon;
GRANT SELECT ON TABLE decks TO anon;
GRANT SELECT ON TABLE cards TO anon;
GRANT SELECT ON TABLE comments TO anon;

-- Sequences for auto-generated IDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- ============================================
-- DONE!
-- ============================================
