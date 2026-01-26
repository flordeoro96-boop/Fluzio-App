# Supabase Migration Progress

## ✅ Phase 1: Authentication (COMPLETED)

### What's Done:
- ✅ Installed `@supabase/supabase-js`
- ✅ Created Supabase client (`services/supabaseClient.ts`)
- ✅ Added Supabase credentials to `.env`
- ✅ Migrated `AuthContext.tsx` from Firebase Auth to Supabase Auth
- ✅ Implemented compatibility layer for existing code
- ✅ All auth methods now use Supabase:
  - Email/password sign in & sign up
  - Google OAuth
  - Apple OAuth
  - Sign out
  - Session management

### Testing Authentication:
1. Your app is running at http://localhost:3000
2. Test sign up with email/password
3. Test login with email/password
4. OAuth (Google/Apple) requires configuring providers in Supabase dashboard

---

## ⏳ Phase 2: Database Migration (NEXT)

### What Needs to Happen:

#### 1. Set Up Supabase Database Schema
You need to create PostgreSQL tables in Supabase to replace Firestore collections:

**Required Tables:**
- `users` - User profiles
- `businesses` - Business profiles  
- `missions` - Mission/quest data
- `rewards` - Reward items
- `transactions` - Points/redemptions
- `posts` - Social feed posts
- `comments` - Post comments
- `messages` - Chat messages
- `notifications` - User notifications
- `squads` - Team/group data
- `events` - Events/meetups
- `applications` - Creator applications
- `projects` - Collaboration projects
- And more...

#### 2. Migrate Existing Data
- Export data from Firestore
- Transform to PostgreSQL format
- Import into Supabase tables

#### 3. Update API Service
- Update `services/apiService.ts` to use Supabase instead of Firebase Functions
- Replace Firestore queries with Supabase queries
- Update all CRUD operations

#### 4. Update Individual Services
Files that need migration (100+ files):
- `services/missionService.ts`
- `services/rewardsService.ts`
- `services/feedService.ts`
- `services/chatService.ts`
- `services/notificationService.ts`
- ... and many more

---

## 🔧 Supabase Dashboard Setup Needed

### 1. Enable OAuth Providers
https://supabase.com/dashboard/project/ztfljnzrrdnliinorkup/auth/providers

- Enable Google OAuth
- Enable Apple OAuth  
- Add authorized redirect URLs

### 2. Create Database Schema
https://supabase.com/dashboard/project/ztfljnzrrdnliinorkup/editor

Use the SQL editor or Table editor to create your schema.

### 3. Set Up Row Level Security (RLS)
Create policies to control data access.

### 4. Storage Buckets
https://supabase.com/dashboard/project/ztfljnzrrdnliinorkup/storage/buckets

Create buckets for:
- User avatars
- Business logos
- Post images/videos
- Mission assets

---

## 📋 Recommended Next Steps

### Option A: Gradual Migration (Recommended)
1. ✅ Auth is done
2. Create `users` table in Supabase
3. Update `apiService.ts` user CRUD operations
4. Test user creation/updates
5. Move to next table (businesses, missions, etc.)
6. Migrate one service at a time

### Option B: Full Schema First
1. Design complete PostgreSQL schema
2. Create all tables at once
3. Set up RLS policies
4. Migrate all data
5. Update all services

### Option C: Hybrid Approach
1. Keep Firebase for existing data (read-only)
2. Use Supabase for all new data
3. Gradually migrate features over time

---

## 🚨 Current Status

**What Works:**
- ✅ App builds and runs
- ✅ Supabase auth is active
- ✅ Login/signup will use Supabase

**What's Broken:**
- ❌ User profile creation (no database table yet)
- ❌ All features that read/write data
- ❌ File uploads (no storage setup)

**Database:** Still pointing to Firebase (will fail when trying to save data)

---

## 🔑 Next Immediate Action Required

**You must create the `users` table in Supabase:**

```sql
-- Run this in Supabase SQL Editor
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT UNIQUE NOT NULL, -- Same as Supabase auth user ID
  email TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  role TEXT CHECK (role IN ('CREATOR', 'BUSINESS', 'MEMBER', 'ADMIN')),
  name TEXT,
  city TEXT,
  home_city TEXT,
  country TEXT,
  instagram TEXT,
  website TEXT,
  vibe_tags TEXT[],
  profile_complete BOOLEAN DEFAULT FALSE,
  category TEXT,
  bio TEXT,
  photo_url TEXT,
  plan_tier TEXT,
  credits INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  referral_count INTEGER DEFAULT 0,
  referral_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = uid);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = uid);

-- Policy: Allow insert for authenticated users
CREATE POLICY "Users can create profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid()::text = uid);
```

Would you like me to help you create the database schema?
