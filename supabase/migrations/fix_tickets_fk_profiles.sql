-- Fix Tickets FK to point to Profiles (for full_name access)

-- 1. Drop the incorrect FK (referencing auth.users)
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS tickets_created_by_fkey;

-- 2. Add the correct FK (referencing public.profiles)
-- This allows appropriate joining: .select('*, created_by(full_name)')
ALTER TABLE public.tickets 
ADD CONSTRAINT tickets_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id);

-- 3. Ensure Profiles are readable
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);
-- OR restrict to auth users:
-- CREATE POLICY "Profiles are viewable by auth users" ON public.profiles
-- FOR SELECT USING (auth.role() = 'authenticated');
