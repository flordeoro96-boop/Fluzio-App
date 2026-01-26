-- Drop old triggers that reference deleted columns
-- Run this FIRST before running the main setup script

-- Drop all triggers on users table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users') 
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON users CASCADE';
    END LOOP;
END $$;

-- Drop the columns that are causing issues
ALTER TABLE users DROP COLUMN IF EXISTS city_norm CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS country_norm CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS is_business CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS is_creator CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS account_type CASCADE;

-- Now run the supabase_complete_setup.sql script
