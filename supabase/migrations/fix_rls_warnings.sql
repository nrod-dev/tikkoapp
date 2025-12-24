-- Migration to fix RLS warnings (Performance & Duplicate Policies)

-- 1. Enable RLS on all relevant tables (Idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- 2. Drop LEGACY and DUPLICATE policies to resolve "Multiple Permissive Policies"
-- Dropping "SaaS_*" policies (Legacy/Starter kit)
DROP POLICY IF EXISTS "SaaS_Profiles_Insert" ON public.profiles;
DROP POLICY IF EXISTS "SaaS_Profiles_Select" ON public.profiles;
DROP POLICY IF EXISTS "SaaS_Profiles_Update" ON public.profiles;

DROP POLICY IF EXISTS "SaaS_Orgs_Select" ON public.organizations;
DROP POLICY IF EXISTS "SaaS_Orgs_Update" ON public.organizations;

DROP POLICY IF EXISTS "SaaS_OrgMembers_Select" ON public.organization_members;

DROP POLICY IF EXISTS "SaaS_Tickets_Select" ON public.tickets;
DROP POLICY IF EXISTS "SaaS_Tickets_Insert" ON public.tickets;
DROP POLICY IF EXISTS "SaaS_Tickets_Update" ON public.tickets;
DROP POLICY IF EXISTS "SaaS_Tickets_Delete" ON public.tickets;

-- Dropping other redundant/conflicting policies to ensure a clean slate
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
DROP POLICY IF EXISTS "Users can update organizations they belong to" ON public.organizations;

DROP POLICY IF EXISTS "Users can view their own memberships" ON public.organization_members;

DROP POLICY IF EXISTS "Enable read for users based on user_id or organization membership" ON public.tickets;
DROP POLICY IF EXISTS "Enable insert for users based on user_id or organization membership" ON public.tickets;
DROP POLICY IF EXISTS "Enable update for users based on user_id or organization membership" ON public.tickets;
DROP POLICY IF EXISTS "Enable delete for users based on user_id or organization membership" ON public.tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can delete their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view their own or org tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update their own or org tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can delete their own or org tickets" ON public.tickets;
DROP POLICY IF EXISTS "Enable read for users based on user_id or organization membersh" ON public.tickets; -- Typo in original warning

DROP POLICY IF EXISTS "Users see own session" ON public.whatsapp_sessions;
DROP POLICY IF EXISTS "Admins can manage their org collaborators" ON public.collaborators;


-- 3. Re-create Optimized Policies (Fixing "Auth RLS Create Init Plan")
-- Using `(select auth.uid())` instead of `auth.uid()` prevents re-evaluation per row.

-- --- PROFILES ---
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
FOR SELECT USING ( true );

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK ( id = (select auth.uid()) );

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING ( id = (select auth.uid()) );

-- --- ORGANIZATIONS ---
CREATE POLICY "Users can view organizations they belong to" ON public.organizations
FOR SELECT USING (
    id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (select auth.uid())
    )
);

CREATE POLICY "Users can update organizations they belong to" ON public.organizations
FOR UPDATE USING (
    id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (select auth.uid())
    )
);

-- --- ORGANIZATION MEMBERS ---
CREATE POLICY "Users can view their own memberships" ON public.organization_members
FOR SELECT USING (
    user_id = (select auth.uid())
);

-- --- TICKETS ---
CREATE POLICY "Enable read for users based on user_id or organization membership" ON public.tickets
FOR SELECT USING (
    (select auth.uid()) = created_by OR 
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (select auth.uid())
    )
);

CREATE POLICY "Enable insert for users based on user_id or organization membership" ON public.tickets
FOR INSERT WITH CHECK (
    (select auth.uid()) = created_by OR
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (select auth.uid())
    )
);

CREATE POLICY "Enable update for users based on user_id or organization membership" ON public.tickets
FOR UPDATE USING (
    (select auth.uid()) = created_by OR
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (select auth.uid())
    )
);

CREATE POLICY "Enable delete for users based on user_id or organization membership" ON public.tickets
FOR DELETE USING (
    (select auth.uid()) = created_by OR
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (select auth.uid())
    )
);

-- --- WHATSAPP SESSIONS ---
CREATE POLICY "Users see own session" ON public.whatsapp_sessions
FOR SELECT USING (
    user_id = (select auth.uid())
);

-- --- COLLABORATORS ---
CREATE POLICY "Admins can manage their org collaborators" ON public.collaborators
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = (select auth.uid())
    )
);
