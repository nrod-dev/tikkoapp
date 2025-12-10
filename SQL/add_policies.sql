-- POLICY FIX SCRIPT
-- Run this to allow uploads to your manually created 'receipts' bucket.

-- 1. Allow public viewing (so you can see the images)
DROP POLICY IF EXISTS "Public Access to Receipts" ON storage.objects;
CREATE POLICY "Public Access to Receipts"
ON storage.objects FOR SELECT
USING ( bucket_id = 'receipts' );

-- 2. Allow authenticated uploads (FIXES YOUR ERROR)
DROP POLICY IF EXISTS "Authenticated Uploads to Receipts" ON storage.objects;
CREATE POLICY "Authenticated Uploads to Receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.role() = 'authenticated'
);

-- 3. Allow users to update/delete their own files (Optional but good)
DROP POLICY IF EXISTS "Users manage own receipts" ON storage.objects;
CREATE POLICY "Users manage own receipts"
ON storage.objects FOR ALL
USING ( auth.uid() = owner )
WITH CHECK ( bucket_id = 'receipts' );
