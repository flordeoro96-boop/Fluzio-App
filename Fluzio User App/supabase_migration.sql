-- Migration: Add missing columns to users table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ztfljnzrrdnliinorkup/sql

-- Add profile and social columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vibe_tags TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS category TEXT;

-- Add subscription/billing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Add referral system columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_points INTEGER DEFAULT 0;

-- Add auth and onboarding columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_method TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_aspiring_business BOOLEAN DEFAULT false;

-- Add contact columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS operating_country TEXT;

-- Add JSON columns for flexible data
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add additional profile columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS handle TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS legal_name TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by) WHERE referred_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle) WHERE handle IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.vibe_tags IS 'User interest/vibe tags for personalization';
COMMENT ON COLUMN users.social_links IS 'Social media connections (Instagram, TikTok, etc.)';
COMMENT ON COLUMN users.preferences IS 'User preferences (notifications, etc.)';
COMMENT ON COLUMN users.metadata IS 'Additional user data from onboarding';
