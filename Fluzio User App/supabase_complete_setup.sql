-- COMPLETE SUPABASE USERS TABLE SETUP
-- Run this entire script in Supabase SQL Editor
-- https://supabase.com/dashboard/project/ztfljnzrrdnliinorkup/sql

-- ============================================
-- 1. ENSURE ALL COLUMNS EXIST
-- ============================================

-- Identity & Auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_method TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS handle TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS legal_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Role & Status
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_aspiring_business BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;

-- Location
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS operating_country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code TEXT;

-- Profile
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vibe_tags TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB;

-- Referrals & Credits
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Metadata
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- 2. FIX CONSTRAINTS
-- ============================================

-- Fix role constraint to allow all user types
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('MEMBER', 'CREATOR', 'BUSINESS', 'ADMIN'));

-- Fix approval_status constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_approval_status_check;
ALTER TABLE users ADD CONSTRAINT users_approval_status_check 
CHECK (approval_status IS NULL OR approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'));

-- ============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_handle ON users(handle) WHERE handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by) WHERE referred_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_city_country ON users(LOWER(city), LOWER(country));
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status) WHERE approval_status IS NOT NULL;

-- ============================================
-- 4. SETUP ROW LEVEL SECURITY
-- ============================================

-- Disable RLS temporarily to clean up
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Public can view basic user info" ON users;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND role = 'ADMIN'
  )
);

CREATE POLICY "Public can view basic user info"
ON users FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- ============================================
-- 6. CREATE UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! Your users table is now fully configured
-- ============================================
