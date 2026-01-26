-- Row Level Security Policies for users table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ztfljnzrrdnliinorkup/sql

-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Public can view basic user info" ON users;

-- 1. Allow users to INSERT their own profile during signup
CREATE POLICY "Users can insert their own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = id);

-- 2. Allow users to SELECT their own profile
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

-- 3. Allow users to UPDATE their own profile
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- 4. Allow admins to view all users
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()::text
    AND role = 'ADMIN'
  )
);

-- 5. Allow public read for basic user info (for public profiles)
-- You can remove this if you want all profiles private
CREATE POLICY "Public can view basic user info"
ON users FOR SELECT
TO authenticated
USING (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT ON users TO anon;
