-- Add onboarding JSONB column to users table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ztfljnzrrdnliinorkup/sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding JSONB DEFAULT '{}';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users USING gin(onboarding);

-- Optional: Add default values for existing users
UPDATE users 
SET onboarding = '{
  "tourSkipped": false,
  "stepsViewed": 0,
  "completedAt": null
}'::jsonb
WHERE onboarding IS NULL OR onboarding = '{}'::jsonb;
