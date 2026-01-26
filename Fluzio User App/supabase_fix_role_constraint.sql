-- Fix role check constraint
-- Run this in Supabase SQL Editor

-- Drop the existing check constraint on role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add a new check constraint that allows all needed roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IS NULL OR role IN ('MEMBER', 'CREATOR', 'BUSINESS', 'ADMIN'));

-- Also verify and fix approval_status if needed
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_approval_status_check;
ALTER TABLE users ADD CONSTRAINT users_approval_status_check 
CHECK (approval_status IS NULL OR approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'));
