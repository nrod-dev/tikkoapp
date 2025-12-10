-- RLS POLICIES IMPLEMENTATION
-- This script enables RLS on all core tables and defines policies for multi-tenancy.
-- It uses a helper function 'get_user_org_ids()' to prevent infinite recursion in policies.

-- 1. Helper Function to get current user's organization IDs
-- We use SECURITY DEFINER to bypass RLS within this function, allowing it to read membership.
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS TABLE (org_id uuid) 
LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public -- Secure search_path
AS $$
BEGIN
  RETURN QUERY SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid();
END;
$$;

-- 1b. Helper Function for Frontend (Scalar) to get single Org ID
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ret_id uuid;
BEGIN
  SELECT organization_id INTO ret_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  RETURN ret_id;
END;
$$;

-- 2. Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 3. Policies for PROFILES
-- Users can see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING ( id = auth.uid() );

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING ( id = auth.uid() );

-- Users can view profiles of other members in their organizations
DROP POLICY IF EXISTS "Users can view organization members profiles" ON public.profiles;
CREATE POLICY "Users can view organization members profiles" ON public.profiles
FOR SELECT USING (
  id IN (
    SELECT user_id FROM public.organization_members 
    WHERE organization_id IN ( SELECT org_id FROM get_user_org_ids() )
  )
);

-- 4. Policies for ORGANIZATIONS
-- Users can view organizations they belong to
DROP POLICY IF EXISTS "Members can view organizations" ON public.organizations;
CREATE POLICY "Members can view organizations" ON public.organizations
FOR SELECT USING (
  id IN ( SELECT org_id FROM get_user_org_ids() )
);

-- Only owners can update organizations
DROP POLICY IF EXISTS "Owners can update organizations" ON public.organizations;
CREATE POLICY "Owners can update organizations" ON public.organizations
FOR UPDATE USING (
  id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- 5. Policies for ORGANIZATION_MEMBERS
-- Users can view members of their organizations
DROP POLICY IF EXISTS "Members can view other members" ON public.organization_members;
CREATE POLICY "Members can view other members" ON public.organization_members
FOR SELECT USING (
  organization_id IN ( SELECT org_id FROM get_user_org_ids() )
);

-- 6. Policies for TICKETS (Expenses)
-- Members can view tickets of their organizations
DROP POLICY IF EXISTS "Members can view tickets" ON public.tickets;
CREATE POLICY "Members can view tickets" ON public.tickets
FOR SELECT USING (
  organization_id IN ( SELECT org_id FROM get_user_org_ids() )
);

-- Members can insert tickets for their organizations
DROP POLICY IF EXISTS "Members can insert tickets" ON public.tickets;
CREATE POLICY "Members can insert tickets" ON public.tickets
FOR INSERT WITH CHECK (
  organization_id IN ( SELECT org_id FROM get_user_org_ids() )
);

-- Members can update tickets of their organizations
DROP POLICY IF EXISTS "Members can update tickets" ON public.tickets;
CREATE POLICY "Members can update tickets" ON public.tickets
FOR UPDATE USING (
  organization_id IN ( SELECT org_id FROM get_user_org_ids() )
);

-- Members can delete tickets of their organizations
DROP POLICY IF EXISTS "Members can delete tickets" ON public.tickets;
CREATE POLICY "Members can delete tickets" ON public.tickets
FOR DELETE USING (
  organization_id IN ( SELECT org_id FROM get_user_org_ids() )
);
