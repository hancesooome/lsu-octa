-- Run in Supabase: SQL Editor
-- Allows uploads to the research-files bucket (used by submission form for cover images and PDFs).
-- If the bucket does not exist, create it first in Dashboard → Storage → New bucket, name "research-files", set Public.

-- Allow anyone (anon) to upload and read in research-files
DROP POLICY IF EXISTS "Allow anon upload research-files" ON storage.objects;
CREATE POLICY "Allow anon upload research-files"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'research-files');

DROP POLICY IF EXISTS "Allow anon read research-files" ON storage.objects;
CREATE POLICY "Allow anon read research-files"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'research-files');

-- Allow anon to delete objects in research-files (used when thesis is deleted via API)
DROP POLICY IF EXISTS "Allow anon delete research-files" ON storage.objects;
CREATE POLICY "Allow anon delete research-files"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'research-files');
