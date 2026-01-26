-- TEMPORARY: Disable RLS for testing
-- WARNING: This makes the users table publicly writable. Only for development!
-- Run this in Supabase SQL Editor to test signup

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Remember to re-enable it later with proper policies!
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
