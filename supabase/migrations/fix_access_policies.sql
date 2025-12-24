-- Complete Fix for Access and Permissions

-- 1. Fix organization_members FK if needed
-- The schema shows organization_members.user_id references public.profiles(id).
-- But public.profiles.id references auth.users(id).
-- So joining via auth.uid() -> organization_members.user_id should work IF profiles exist.
-- However, standard Supabase patterns often link org members directly to auth.users.
-- We will proceed assuming the `user_id` in `organization_members` matches `auth.uid()`.

-- 2. Enable RLS on all relevant tables
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 3. Clear existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can delete their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view their own or org tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update their own or org tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can delete their own or org tickets" ON public.tickets;

-- 4. Create Policies for Tickets
CREATE POLICY "Enable read for users based on user_id or organization membership" ON public.tickets
FOR SELECT USING (
    auth.uid() = created_by OR 
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Enable insert for users based on user_id or organization membership" ON public.tickets
FOR INSERT WITH CHECK (
    auth.uid() = created_by OR
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Enable update for users based on user_id or organization membership" ON public.tickets
FOR UPDATE USING (
    auth.uid() = created_by OR
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Enable delete for users based on user_id or organization membership" ON public.tickets
FOR DELETE USING (
    auth.uid() = created_by OR
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

-- 5. Create Policies for Organizations (so users can see the orgs they are in)
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
FOR SELECT USING (
    id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
);

-- 6. Create Policies for Organization Members (so users can see their memberships)
CREATE POLICY "Users can view their own memberships" ON public.organization_members
FOR SELECT USING (
    user_id = auth.uid()
);
