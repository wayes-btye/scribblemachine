-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Credits policies
CREATE POLICY "Users can view own credits" ON public.credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits" ON public.credits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credits" ON public.credits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Credit events policies
CREATE POLICY "Users can view own credit events" ON public.credit_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert credit events" ON public.credit_events
  FOR INSERT WITH CHECK (
    auth.role() = 'service_role' OR
    auth.uid() = user_id
  );

-- Assets policies
CREATE POLICY "Users can view own assets" ON public.assets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets" ON public.assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets" ON public.assets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets" ON public.assets
  FOR DELETE USING (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Users can view own jobs" ON public.jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can update jobs" ON public.jobs
  FOR UPDATE USING (
    auth.role() = 'service_role' OR
    auth.uid() = user_id
  );

-- Titles policies
CREATE POLICY "Users can view own titles" ON public.titles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own titles" ON public.titles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own titles" ON public.titles
  FOR UPDATE USING (auth.uid() = user_id);

-- Flags are publicly readable (no user_id)
ALTER TABLE public.flags DISABLE ROW LEVEL SECURITY;

-- Function to automatically create user record on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);

  -- Initialize credits with free tier
  INSERT INTO public.credits (user_id, balance)
  VALUES (new.id, 3);

  -- Record initial credit grant
  INSERT INTO public.credit_events (user_id, delta, reason)
  VALUES (new.id, 3, 'signup_bonus');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();