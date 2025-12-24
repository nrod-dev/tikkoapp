-- Idempotent script to fix organization tables and update tickets schema

-- 1. Create tables if they don't exist (Idempotent)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tax_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    legajo TEXT,
    sector TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    CONSTRAINT collaborators_phone_key UNIQUE (phone)
);

-- 2. Safely enable RLS
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- 3. Safely create Policy
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'collaborators' 
        AND policyname = 'Admins can manage their org collaborators'
    ) THEN 
        CREATE POLICY "Admins can manage their org collaborators" ON public.collaborators
            USING (
                organization_id IN (
                    SELECT organization_id 
                    FROM public.organization_members 
                    WHERE user_id = auth.uid()
                )
            );
    END IF; 
END $$;

-- 4. Fix Tickets Schema (The core fix for 'Error fetching')

-- 4.1 Add collaborator_id if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'collaborator_id') THEN 
        ALTER TABLE public.tickets ADD COLUMN collaborator_id UUID REFERENCES public.collaborators(id) ON DELETE SET NULL;
    END IF; 
END $$;

-- 4.2 Restore created_by FK to auth.users (to fix 'created_by(full_name)' join)
DO $$ 
BEGIN 
    -- First, check if the constraint exists. If it was dropped, we recreate it.
    -- We may need to clean up data first if 'created_by' contains values that are NOT in auth.users (i.e. collaborator IDs)
    
    -- Optional: If you had data where created_by was a collaborator_id, migrate it to collaborator_id column
    -- UPDATE tickets SET collaborator_id = created_by::uuid WHERE created_by NOT IN (SELECT id FROM auth.users);
    -- UPDATE tickets SET created_by = NULL WHERE created_by NOT IN (SELECT id FROM auth.users); -- Or keep it if you want, but FK will fail
    
    -- Re-add the constraint if missing
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_created_by_fkey') THEN 
        -- Attempt to add it. This might fail if bad data exists. 
        -- Ideally we filter or nullify bad data first. 
        -- For now, we assume 'created_by' is nullable or we accept potential failure if data is messy.
        BEGIN
            ALTER TABLE tickets ADD CONSTRAINT tickets_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
        EXCEPTION WHEN foreign_key_violation THEN
            RAISE NOTICE 'Skipping tickets_created_by_fkey restoration due to foreign key violation. Manual cleanup required.';
        END;
    END IF; 
END $$;

-- 5. Drop old specific FK if exists (cleanup)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_sessions_user_id_fkey') THEN
        ALTER TABLE whatsapp_sessions DROP CONSTRAINT whatsapp_sessions_user_id_fkey;
    END IF;
END $$;
