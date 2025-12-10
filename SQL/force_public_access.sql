-- FORCE PUBLIC ACCESS SCRIPT
-- This script ensures that ANYONE (including unauthenticated users) can view the images.

-- 1. Explicitly grant USAGE on the schema (sometimes needed)
GRANT USAGE ON SCHEMA storage TO postgres, anon, authenticated, service_role;

-- 2. Grant SELECT on the 'receipts' bucket objects to anon role
-- This is the "Nuclear Option" to ensure public access works.
DROP POLICY IF EXISTS "Global Public Read" ON storage.objects;

CREATE POLICY "Global Public Read"
ON storage.objects FOR SELECT
TO public -- 'public' here means all roles (anon, authenticated)
USING ( bucket_id = 'receipts' );

-- 3. Verify Upload Policy (Keep this to ensure you can still upload)
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'receipts' );
