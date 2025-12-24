-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tax_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create organization_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create collaborators table
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

-- Enable RLS on collaborators
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view/manage collaborators in their organization
CREATE POLICY "Admins can manage their org collaborators" ON public.collaborators
    USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Modify tickets table to allow collaborators as created_by
-- Drop the existing FK constraint to profiles/users if strictly enforced
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tickets_created_by_fkey') THEN 
        ALTER TABLE tickets DROP CONSTRAINT tickets_created_by_fkey; 
    END IF; 
END $$;

-- Drop FK on whatsapp_sessions.user_id if exists to allow collaborators
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_sessions_user_id_fkey') THEN
        ALTER TABLE whatsapp_sessions DROP CONSTRAINT whatsapp_sessions_user_id_fkey;
    END IF;
END $$;

-- Optional: Add index on collaborators phone for faster lookup
CREATE INDEX IF NOT EXISTS idx_collaborators_phone ON public.collaborators(phone);
