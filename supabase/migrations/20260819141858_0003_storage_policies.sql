/*
# Storage policies for report-media bucket

1. Security
- public read (reports are visible to all authenticated users).
- authenticated users can upload to their own folder path.
- uploader or admin can delete.
*/

DROP POLICY IF EXISTS "public read report-media" ON storage.objects;
CREATE POLICY "public read report-media" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'report-media');

DROP POLICY IF EXISTS "auth upload report-media" ON storage.objects;
CREATE POLICY "auth upload report-media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'report-media');

DROP POLICY IF EXISTS "delete own report-media" ON storage.objects;
CREATE POLICY "delete own report-media" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'report-media' AND public.is_admin());
