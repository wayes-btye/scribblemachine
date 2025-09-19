-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('originals', 'originals', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/heif']),
  ('intermediates', 'intermediates', false, 52428800, ARRAY['image/jpeg', 'image/png']),
  ('artifacts', 'artifacts', false, 52428800, ARRAY['application/pdf', 'image/png']),
  ('artifacts_previews', 'artifacts_previews', false, 10485760, ARRAY['image/png', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for originals bucket
CREATE POLICY "Users can upload to originals" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'originals' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own originals" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'originals' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own originals" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'originals' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for intermediates bucket
CREATE POLICY "Users can view own intermediates" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'intermediates' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Service role can manage intermediates" ON storage.objects
  FOR ALL USING (
    bucket_id = 'intermediates' AND
    auth.role() = 'service_role'
  );

-- Storage policies for artifacts bucket
CREATE POLICY "Users can view own artifacts" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'artifacts' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Service role can manage artifacts" ON storage.objects
  FOR ALL USING (
    bucket_id = 'artifacts' AND
    auth.role() = 'service_role'
  );

-- Storage policies for artifacts_previews bucket
CREATE POLICY "Users can view own artifact previews" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'artifacts_previews' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Service role can manage artifact previews" ON storage.objects
  FOR ALL USING (
    bucket_id = 'artifacts_previews' AND
    auth.role() = 'service_role'
  );

-- Function to clean up TTL expired files (to be called by cron job)
CREATE OR REPLACE FUNCTION public.cleanup_storage_ttl()
RETURNS void AS $$
DECLARE
  cutoff_originals TIMESTAMP := NOW() - INTERVAL '30 days';
  cutoff_intermediates TIMESTAMP := NOW() - INTERVAL '48 hours';
  cutoff_artifacts TIMESTAMP := NOW() - INTERVAL '90 days';
BEGIN
  -- Delete expired originals
  DELETE FROM storage.objects
  WHERE bucket_id = 'originals'
    AND created_at < cutoff_originals;

  -- Delete expired intermediates
  DELETE FROM storage.objects
  WHERE bucket_id = 'intermediates'
    AND created_at < cutoff_intermediates;

  -- Delete expired artifacts (optional - keep successful generations longer)
  DELETE FROM storage.objects
  WHERE bucket_id = 'artifacts'
    AND created_at < cutoff_artifacts;

  -- Delete expired preview artifacts
  DELETE FROM storage.objects
  WHERE bucket_id = 'artifacts_previews'
    AND created_at < cutoff_artifacts;

  -- Clean up asset records for deleted files
  DELETE FROM public.assets
  WHERE NOT EXISTS (
    SELECT 1 FROM storage.objects
    WHERE name = assets.storage_path
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;