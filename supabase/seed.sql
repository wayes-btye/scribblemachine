-- Seed data for development and testing

-- Insert additional feature flags for development
INSERT INTO public.flags (name, on, variant) VALUES
  ('maintenance.mode', FALSE, NULL),
  ('ui.darkMode', FALSE, NULL),
  ('pricing.freeTier', TRUE, '3'),
  ('generation.maxRetries', TRUE, '2'),
  ('storage.enableCleanup', TRUE, NULL)
ON CONFLICT (name) DO UPDATE SET
  on = EXCLUDED.on,
  variant = EXCLUDED.variant,
  updated_at = NOW();

-- Create a development test user (only for local development)
-- This will be handled by auth.users in production
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Only insert if we're in development mode and user doesn't exist
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
    INSERT INTO public.users (id, email, created_at, last_login_at)
    VALUES (test_user_id, 'test@example.com', NOW(), NOW());

    -- Initialize credits for test user
    INSERT INTO public.credits (user_id, balance, updated_at)
    VALUES (test_user_id, 10, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      balance = EXCLUDED.balance,
      updated_at = NOW();

    -- Add credit history for test user
    INSERT INTO public.credit_events (user_id, delta, reason, created_at)
    VALUES
      (test_user_id, 3, 'signup_bonus', NOW() - INTERVAL '7 days'),
      (test_user_id, 5, 'dev_credits', NOW() - INTERVAL '1 day'),
      (test_user_id, 10, 'test_purchase', NOW() - INTERVAL '1 hour'),
      (test_user_id, -8, 'generation_used', NOW() - INTERVAL '30 minutes');
  END IF;
END $$;