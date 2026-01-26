-- Fix approval_status check constraint
-- Run this in Supabase SQL Editor

-- Drop the existing check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_approval_status_check;

-- Add a new check constraint that allows PENDING
ALTER TABLE users ADD CONSTRAINT users_approval_status_check 
CHECK (approval_status IS NULL OR approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'));

-- Or if you want to remove the constraint completely:
-- ALTER TABLE users DROP CONSTRAINT IF EXISTS users_approval_status_check;
