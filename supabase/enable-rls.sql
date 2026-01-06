-- VerChem: Enable RLS on all tables
-- Purpose: Block anon key access, allow service_role only
-- Date: 2026-01-07
-- Author: สมนึก (Claude Opus 4.5)
--
-- NOTE: VerChem uses AIVerID OAuth, NOT Supabase Auth
-- Therefore auth.uid() won't work. We use service_role from backend only.
-- service_role key bypasses RLS, so enabling RLS = blocking anon access.

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. DROP EXISTING POLICIES (if any)
-- =====================================================

DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view own calculations" ON saved_calculations;
DROP POLICY IF EXISTS "Users can insert own calculations" ON saved_calculations;
DROP POLICY IF EXISTS "Users can update own calculations" ON saved_calculations;
DROP POLICY IF EXISTS "Users can delete own calculations" ON saved_calculations;
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;

-- =====================================================
-- 3. CREATE POLICIES FOR SERVICE ROLE ACCESS
-- =====================================================
-- Note: service_role bypasses RLS, but we create explicit policies
-- for documentation and future flexibility.

-- USERS TABLE
-- Only service_role (backend) can read/write
CREATE POLICY "Service role full access to users"
ON users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- FAVORITES TABLE
-- Only service_role (backend) can read/write
CREATE POLICY "Service role full access to favorites"
ON favorites FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- SAVED_CALCULATIONS TABLE
-- Only service_role (backend) can read/write
CREATE POLICY "Service role full access to saved_calculations"
ON saved_calculations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- USER_PREFERENCES TABLE
-- Only service_role (backend) can read/write
CREATE POLICY "Service role full access to user_preferences"
ON user_preferences FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- 4. VERIFY RLS IS ENABLED
-- =====================================================

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'favorites', 'saved_calculations', 'user_preferences');

-- Expected output: rowsecurity = true for all tables

-- =====================================================
-- 5. TEST: Verify anon key is blocked
-- =====================================================
-- Run this as anon user (from Supabase dashboard or client):
-- SELECT * FROM users; -- Should return empty or error
-- SELECT * FROM favorites; -- Should return empty or error

-- =====================================================
-- DONE! All tables are now secured.
-- Only backend with service_role key can access data.
-- =====================================================
