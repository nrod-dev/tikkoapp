-- Simplified script to avoid permission errors
-- we removed "ALTER TABLE storage.objects..." which caused the error

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create Policies (Drop logic handles updates)

-- Allow public viewing
DROP POLICY IF EXISTS "Public Access to Receipts" ON storage.objects;
CREATE POLICY "Public Access to Receipts"
ON storage.objects FOR SELECT
USING ( bucket_id = 'receipts' );

-- Allow authenticated uploads
DROP POLICY IF EXISTS "Authenticated Uploads to Receipts" ON storage.objects;
CREATE POLICY "Authenticated Uploads to Receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own files
DROP POLICY IF EXISTS "Users update own receipts" ON storage.objects;
CREATE POLICY "Users update own receipts"
ON storage.objects FOR UPDATE
USING ( auth.uid() = owner )
WITH CHECK ( bucket_id = 'receipts' );
