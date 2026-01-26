-- SUPABASE BUSINESS TABLES SETUP
-- Run this script in Supabase SQL Editor after running supabase_complete_setup.sql
-- https://supabase.com/dashboard/project/ztfljnzrrdnliinorkup/sql

-- ============================================
-- 1. MISSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT,
  business_logo TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  requirements TEXT[],
  location TEXT,
  location_id TEXT,
  geo JSONB, -- {latitude, longitude}
  radius_meters INTEGER,
  city TEXT,
  country TEXT,
  goal TEXT, -- 'GROWTH', 'CONTENT', 'TRAFFIC', 'SALES'
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  reward JSONB NOT NULL, -- {type, value, description}
  image TEXT,
  proof_type TEXT NOT NULL, -- 'PHOTO', 'VIDEO', 'TEXT', 'LOCATION', 'LINK'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Trigger Logic
  trigger_type TEXT DEFAULT 'MANUAL', -- 'GPS_PROXIMITY', 'QR_SCAN', 'MANUAL'
  qr_code_secret TEXT,
  
  -- Check-In Verification
  check_in_method TEXT, -- 'QR_ONLY', 'GPS', 'BOTH'
  
  -- Standard Missions
  is_standard BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  recurrence TEXT, -- 'ONCE', 'WEEKLY', 'MONTHLY'
  
  -- Firestore sync
  firestore_id TEXT,
  
  -- Enhanced mission fields
  lifecycle_status TEXT DEFAULT 'ACTIVE', -- 'DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'EXPIRED', 'CANCELLED'
  budget DECIMAL,
  approval_required BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT true,
  auto_approve BOOLEAN DEFAULT false,
  target_audience TEXT[],
  target_level TEXT[], -- 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO'
  target_categories TEXT[],
  
  -- Priority system
  priority TEXT DEFAULT 'MEDIUM', -- 'HIGH', 'MEDIUM', 'LOW'
  priority_score INTEGER DEFAULT 50,
  
  -- Creator-only missions
  is_creator_only BOOLEAN DEFAULT false,
  
  -- Remote work
  is_remote BOOLEAN DEFAULT false,
  
  -- Creator requirements
  required_roles TEXT[],
  
  -- Deadlines
  deadline TIMESTAMPTZ,
  
  -- Mission template
  mission_template_id TEXT,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for missions
CREATE INDEX IF NOT EXISTS idx_missions_business_id ON missions(business_id);
CREATE INDEX IF NOT EXISTS idx_missions_city_country ON missions(LOWER(city), LOWER(country));
CREATE INDEX IF NOT EXISTS idx_missions_lifecycle_status ON missions(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_missions_is_active ON missions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_missions_category ON missions(category);
CREATE INDEX IF NOT EXISTS idx_missions_created_at ON missions(created_at DESC);

-- ============================================
-- 2. PARTICIPATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  proof_url TEXT,
  proof_text TEXT,
  proof_submitted_at TIMESTAMPTZ,
  points INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for participations
CREATE INDEX IF NOT EXISTS idx_participations_mission_id ON participations(mission_id);
CREATE INDEX IF NOT EXISTS idx_participations_user_id ON participations(user_id);
CREATE INDEX IF NOT EXISTS idx_participations_business_id ON participations(business_id);
CREATE INDEX IF NOT EXISTS idx_participations_status ON participations(status);
CREATE INDEX IF NOT EXISTS idx_participations_applied_at ON participations(applied_at DESC);

-- ============================================
-- 3. CHECK-INS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  method TEXT NOT NULL, -- 'QR_SCAN', 'GPS', 'NFC', 'MANUAL'
  points_earned INTEGER DEFAULT 0,
  business_points_earned INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  location JSONB, -- {latitude, longitude}
  metadata JSONB, -- Additional check-in data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for check_ins
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_business_id ON check_ins(business_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_timestamp ON check_ins(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_business_date ON check_ins(user_id, business_id, DATE(timestamp));

-- ============================================
-- 4. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Missions policies
CREATE POLICY "Anyone can view active missions"
ON missions FOR SELECT
USING (is_active = true AND lifecycle_status = 'ACTIVE');

CREATE POLICY "Business owners can view their missions"
ON missions FOR SELECT
TO authenticated
USING (business_id::text = auth.uid()::text);

CREATE POLICY "Business owners can insert missions"
ON missions FOR INSERT
TO authenticated
WITH CHECK (business_id::text = auth.uid()::text);

CREATE POLICY "Business owners can update their missions"
ON missions FOR UPDATE
TO authenticated
USING (business_id::text = auth.uid()::text)
WITH CHECK (business_id::text = auth.uid()::text);

CREATE POLICY "Business owners can delete their missions"
ON missions FOR DELETE
TO authenticated
USING (business_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage all missions"
ON missions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND role = 'ADMIN'
  )
);

-- Participations policies
CREATE POLICY "Users can view their participations"
ON participations FOR SELECT
TO authenticated
USING (user_id::text = auth.uid()::text);

CREATE POLICY "Business can view their participations"
ON participations FOR SELECT
TO authenticated
USING (business_id::text = auth.uid()::text);

CREATE POLICY "Users can create participations"
ON participations FOR INSERT
TO authenticated
WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Business can update their participations"
ON participations FOR UPDATE
TO authenticated
USING (business_id::text = auth.uid()::text)
WITH CHECK (business_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage all participations"
ON participations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND role = 'ADMIN'
  )
);

-- Check-ins policies
CREATE POLICY "Users can view their check-ins"
ON check_ins FOR SELECT
TO authenticated
USING (user_id::text = auth.uid()::text);

CREATE POLICY "Business can view their check-ins"
ON check_ins FOR SELECT
TO authenticated
USING (business_id::text = auth.uid()::text);

CREATE POLICY "Users can create check-ins"
ON check_ins FOR INSERT
TO authenticated
WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage all check-ins"
ON check_ins FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id::text = auth.uid()::text
    AND role = 'ADMIN'
  )
);

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON missions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON participations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON check_ins TO authenticated;

GRANT SELECT ON missions TO anon;

-- ============================================
-- 6. CREATE UPDATED_AT TRIGGERS
-- ============================================

-- Missions trigger
DROP TRIGGER IF EXISTS update_missions_updated_at ON missions;
CREATE TRIGGER update_missions_updated_at
    BEFORE UPDATE ON missions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Participations trigger
DROP TRIGGER IF EXISTS update_participations_updated_at ON participations;
CREATE TRIGGER update_participations_updated_at
    BEFORE UPDATE ON participations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE! Your business tables are now configured
-- ============================================
