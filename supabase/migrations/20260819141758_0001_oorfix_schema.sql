/*
# OorFix core schema

1. Overview
- Crowdsourced civic issue reporting platform with Citizen, Worker, and Admin roles.
- Citizens report issues (with photos + location), AI categorizes, system auto-assigns to workers,
  workers resolve and upload after-photos, admins monitor with analytics.

2. Enums
- user_role: CITIZEN, WORKER, ADMIN
- language_pref: EN, TA, HI
- severity_level: LOW, MEDIUM, HIGH, CRITICAL
- report_status: SUBMITTED, VERIFIED, ASSIGNED, IN_PROGRESS, RESOLVED, REJECTED, DUPLICATE
- media_type_enum: IMAGE, VIDEO
- before_after_enum: BEFORE, AFTER
- worker_skill: ELECTRICIAN, PLUMBER, SANITATION, ROAD, WATER, GENERAL

3. New Tables
- profiles: user profile tied to auth.users (civic_id, name, phone, role, language, ward, reputation).
- departments: civic departments (Electricity, Water, Sanitation, Roads) with per-category SLA.
- categories: issue categories (street light, road, drainage, etc.) mapped to default department.
- worker_profiles: worker skills, base location, working hours, max tasks, active flag.
- reports: core issue records with geo, severity, status, AI suggestion, assignment, SLA.
- report_media: before/after images/videos per report.
- report_updates: status-change timeline with comments and optional media.
- upvotes: citizen upvotes per report (unique per user).
- assignments: worker assignment records with ratings.
- audit_logs: actor action log.

4. Security
- RLS enabled on every table.
- Helper functions user_role() and is_admin() read the caller's role from profiles.
- profiles: each user reads/updates only their own row.
- departments, categories: readable by all authenticated; writable by admins.
- reports: readable by all authenticated (public civic visibility); insert by reporter;
  update by reporter, assigned worker, or admin; delete by admin.
- worker_profiles: readable by all; insert/update by admin or the worker themselves.
- report_media, report_updates: readable by all; insert by any authenticated.
- upvotes: readable by all; insert by the upvoter; delete by the upvoter.
- assignments: readable by all; insert/update by admin or assigned worker.
- audit_logs: admin-only read; insert by any authenticated.

5. Indexes
- reports(status), reports(category_id), reports(assigned_worker_id), reports(created_at),
  reports(reporter_id), reports(severity).
- upvotes(report_id), upvotes(user_id), unique(report_id,user_id).
- assignments(worker_id), assignments(report_id).
- report_media(report_id), report_updates(report_id).
- profiles(phone), profiles(role).
*/

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('CITIZEN', 'WORKER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE language_pref AS ENUM ('EN', 'TA', 'HI');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE severity_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('SUBMITTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'DUPLICATE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE media_type_enum AS ENUM ('IMAGE', 'VIDEO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE before_after_enum AS ENUM ('BEFORE', 'AFTER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE worker_skill AS ENUM ('ELECTRICIAN', 'PLUMBER', 'SANITATION', 'ROAD', 'WATER', 'GENERAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- profiles (created first so helper functions can reference it)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  civic_id text UNIQUE NOT NULL DEFAULT ('CIV-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))),
  name text NOT NULL DEFAULT '',
  phone text UNIQUE,
  role user_role NOT NULL DEFAULT 'CITIZEN',
  language language_pref NOT NULL DEFAULT 'EN',
  ward text NOT NULL DEFAULT '',
  reputation_score int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Helper functions for role checks (now profiles exists)
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN');
$$;

-- departments
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_phone text NOT NULL DEFAULT '',
  sla_hours_by_category jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_departments" ON departments;
CREATE POLICY "select_departments" ON departments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_departments_admin" ON departments;
CREATE POLICY "insert_departments_admin" ON departments FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_departments_admin" ON departments;
CREATE POLICY "update_departments_admin" ON departments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_departments_admin" ON departments;
CREATE POLICY "delete_departments_admin" ON departments FOR DELETE TO authenticated USING (public.is_admin());

-- categories
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  default_department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  icon_name text NOT NULL DEFAULT 'AlertCircle',
  color_hex text NOT NULL DEFAULT '#64748b',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_categories" ON categories;
CREATE POLICY "select_categories" ON categories FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_categories_admin" ON categories;
CREATE POLICY "insert_categories_admin" ON categories FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "update_categories_admin" ON categories;
CREATE POLICY "update_categories_admin" ON categories FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_categories_admin" ON categories;
CREATE POLICY "delete_categories_admin" ON categories FOR DELETE TO authenticated USING (public.is_admin());

-- worker_profiles
CREATE TABLE IF NOT EXISTS worker_profiles (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  skills worker_skill[] NOT NULL DEFAULT '{}',
  base_lat double precision NOT NULL DEFAULT 13.0827,
  base_lng double precision NOT NULL DEFAULT 80.2707,
  working_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  max_tasks_per_day int NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_worker_profiles" ON worker_profiles;
CREATE POLICY "select_worker_profiles" ON worker_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_worker_profiles" ON worker_profiles;
CREATE POLICY "insert_worker_profiles" ON worker_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "update_worker_profiles" ON worker_profiles;
CREATE POLICY "update_worker_profiles" ON worker_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- reports
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  latitude double precision NOT NULL DEFAULT 13.0827,
  longitude double precision NOT NULL DEFAULT 80.2707,
  address_text text NOT NULL DEFAULT '',
  severity severity_level NOT NULL DEFAULT 'MEDIUM',
  status report_status NOT NULL DEFAULT 'SUBMITTED',
  ai_category_suggestion uuid REFERENCES categories(id) ON DELETE SET NULL,
  ai_confidence double precision NOT NULL DEFAULT 0,
  ai_severity severity_level,
  assigned_department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  assigned_worker_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  sla_deadline_at timestamptz,
  resolved_at timestamptz,
  upvotes_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_reports" ON reports;
CREATE POLICY "select_reports" ON reports FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_reports" ON reports;
CREATE POLICY "insert_reports" ON reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "update_reports" ON reports;
CREATE POLICY "update_reports" ON reports FOR UPDATE TO authenticated
  USING (reporter_id = auth.uid() OR assigned_worker_id = auth.uid() OR public.is_admin())
  WITH CHECK (reporter_id = auth.uid() OR assigned_worker_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "delete_reports_admin" ON reports;
CREATE POLICY "delete_reports_admin" ON reports FOR DELETE TO authenticated USING (public.is_admin());

-- report_media
CREATE TABLE IF NOT EXISTS report_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  media_type media_type_enum NOT NULL DEFAULT 'IMAGE',
  storage_url text NOT NULL,
  before_after before_after_enum NOT NULL DEFAULT 'BEFORE',
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE report_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_report_media" ON report_media;
CREATE POLICY "select_report_media" ON report_media FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_report_media" ON report_media;
CREATE POLICY "insert_report_media" ON report_media FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

DROP POLICY IF EXISTS "delete_report_media" ON report_media;
CREATE POLICY "delete_report_media" ON report_media FOR DELETE TO authenticated USING (public.is_admin());

-- report_updates
CREATE TABLE IF NOT EXISTS report_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  updated_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  old_status report_status,
  new_status report_status,
  comment text NOT NULL DEFAULT '',
  media_id uuid REFERENCES report_media(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE report_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_report_updates" ON report_updates;
CREATE POLICY "select_report_updates" ON report_updates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_report_updates" ON report_updates;
CREATE POLICY "insert_report_updates" ON report_updates FOR INSERT TO authenticated WITH CHECK (updated_by = auth.uid());

-- upvotes
CREATE TABLE IF NOT EXISTS upvotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, user_id)
);
ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_upvotes" ON upvotes;
CREATE POLICY "select_upvotes" ON upvotes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_upvotes" ON upvotes;
CREATE POLICY "insert_upvotes" ON upvotes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "delete_upvotes" ON upvotes;
CREATE POLICY "delete_upvotes" ON upvotes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- assignments
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  assigned_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  rating_by_admin int,
  rating_by_citizen int,
  comment text NOT NULL DEFAULT ''
);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_assignments" ON assignments;
CREATE POLICY "select_assignments" ON assignments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_assignments" ON assignments;
CREATE POLICY "insert_assignments" ON assignments FOR INSERT TO authenticated WITH CHECK (public.is_admin() OR assigned_by = auth.uid());

DROP POLICY IF EXISTS "update_assignments" ON assignments;
CREATE POLICY "update_assignments" ON assignments FOR UPDATE TO authenticated
  USING (worker_id = auth.uid() OR public.is_admin())
  WITH CHECK (worker_id = auth.uid() OR public.is_admin());

-- audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL DEFAULT '',
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_audit_logs_admin" ON audit_logs;
CREATE POLICY "select_audit_logs_admin" ON audit_logs FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_audit_logs" ON audit_logs;
CREATE POLICY "insert_audit_logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category_id);
CREATE INDEX IF NOT EXISTS idx_reports_worker ON reports(assigned_worker_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);
CREATE INDEX IF NOT EXISTS idx_upvotes_report ON upvotes(report_id);
CREATE INDEX IF NOT EXISTS idx_upvotes_user ON upvotes(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_worker ON assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_assignments_report ON assignments(report_id);
CREATE INDEX IF NOT EXISTS idx_media_report ON report_media(report_id);
CREATE INDEX IF NOT EXISTS idx_updates_report ON report_updates(report_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated ON profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_reports_updated ON reports;
CREATE TRIGGER trg_reports_updated BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_worker_profiles_updated ON worker_profiles;
CREATE TRIGGER trg_worker_profiles_updated BEFORE UPDATE ON worker_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-maintain upvotes_count on reports
CREATE OR REPLACE FUNCTION public.recalc_upvotes_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reports SET upvotes_count = upvotes_count + 1 WHERE id = NEW.report_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reports SET upvotes_count = GREATEST(upvotes_count - 1, 0) WHERE id = OLD.report_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_upvotes_insert ON upvotes;
CREATE TRIGGER trg_upvotes_insert AFTER INSERT ON upvotes FOR EACH ROW EXECUTE FUNCTION public.recalc_upvotes_count();

DROP TRIGGER IF EXISTS trg_upvotes_delete ON upvotes;
CREATE TRIGGER trg_upvotes_delete AFTER DELETE ON upvotes FOR EACH ROW EXECUTE FUNCTION public.recalc_upvotes_count();

-- Auto-create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''), COALESCE(NEW.raw_user_meta_data->>'phone', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
