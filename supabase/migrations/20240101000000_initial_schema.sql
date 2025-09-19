-- Create custom types
CREATE TYPE job_status AS ENUM ('queued', 'running', 'succeeded', 'failed');
CREATE TYPE asset_kind AS ENUM ('original', 'preprocessed', 'edge_map', 'pdf');

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create credits table
CREATE TABLE public.credits (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  balance INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create credit_events table
CREATE TABLE public.credit_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  stripe_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(stripe_event_id)
);

-- Create assets table
CREATE TABLE public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  kind asset_kind NOT NULL,
  storage_path TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  bytes INTEGER,
  hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status job_status DEFAULT 'queued' NOT NULL,
  params_json JSONB NOT NULL,
  cost_cents INTEGER,
  model TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create feature flags table
CREATE TABLE public.flags (
  name TEXT PRIMARY KEY,
  on BOOLEAN DEFAULT FALSE NOT NULL,
  variant TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create titles table
CREATE TABLE public.titles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  suggestion TEXT NOT NULL,
  accepted BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_assets_user_id_kind ON public.assets(user_id, kind);
CREATE INDEX idx_assets_created_at ON public.assets(created_at DESC);
CREATE INDEX idx_jobs_user_id_status ON public.jobs(user_id, status);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX idx_credit_events_user_id ON public.credit_events(user_id);
CREATE INDEX idx_credit_events_created_at ON public.credit_events(created_at DESC);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_jobs
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_credits
  BEFORE UPDATE ON public.credits
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_flags
  BEFORE UPDATE ON public.flags
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- Insert initial feature flags
INSERT INTO public.flags (name, on, variant) VALUES
  ('engine.fallback', FALSE, NULL),
  ('feature.promptPath', FALSE, NULL),
  ('ui.quickEdits', FALSE, NULL),
  ('safety.facesWarnCopy', TRUE, NULL)
ON CONFLICT (name) DO NOTHING;