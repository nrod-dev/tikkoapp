-- ==============================================================================
-- SCRIPT DE RESTAURACIÓN TOTAL DE SEGURIDAD (RLS)
-- ==============================================================================

-- 0. FUNCTION HELPER (CRITICAL FOR PREVENTING RECURSION)
-- ------------------------------------------------------------------------------
-- Esta función accede a organization_members saltándose RLS para evitar loops infinitos
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS TABLE (organization_id uuid) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT om.organization_id 
  FROM public.organization_members om
  WHERE om.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- 1. TABLA: PROFILES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Clean up ALL variations of old policy names
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view organization members profiles" ON public.profiles;
DROP POLICY IF EXISTS "SaaS_Select_Profiles" ON public.profiles;
DROP POLICY IF EXISTS "SaaS_Profiles_Select" ON public.profiles; -- Fixed name match
DROP POLICY IF EXISTS "SaaS_Update_Own_Profile" ON public.profiles;
DROP POLICY IF EXISTS "SaaS_Profiles_Update" ON public.profiles; -- Fixed name match
DROP POLICY IF EXISTS "SaaS_Profiles_Insert" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles; 

-- NUEVA POLÍTICA MAESTRA:
CREATE POLICY "SaaS_Profiles_Select" ON public.profiles
FOR SELECT USING (
  id = auth.uid() -- Mi perfil
  OR id IN (
    -- Perfiles de gente que está en MIS organizaciones (usando función segura)
    SELECT om.user_id FROM public.organization_members om
    WHERE om.organization_id IN ( SELECT * FROM get_user_org_ids() )
  )
);

CREATE POLICY "SaaS_Profiles_Insert" ON public.profiles
FOR INSERT WITH CHECK ( id = auth.uid() );

CREATE POLICY "SaaS_Profiles_Update" ON public.profiles
FOR UPDATE USING ( id = auth.uid() );


-- 2. TABLA: ORGANIZATION_MEMBERS
-- ------------------------------------------------------------------------------
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Borrar viejas
DROP POLICY IF EXISTS "Members can view other members" ON public.organization_members;
DROP POLICY IF EXISTS "Usuarios ven su membresía" ON public.organization_members;
DROP POLICY IF EXISTS "SaaS_Select_Members" ON public.organization_members;
DROP POLICY IF EXISTS "SaaS_OrgMembers_Select" ON public.organization_members; -- Fixed

-- NUEVA POLÍTICA MAESTRA:
CREATE POLICY "SaaS_OrgMembers_Select" ON public.organization_members
FOR SELECT USING (
  organization_id IN ( SELECT * FROM get_user_org_ids() )
);

-- (Opcional) Insertar si eres owner (descomentar si es necesario)
-- CREATE POLICY "SaaS_OrgMembers_Insert" ON public.organization_members
-- FOR INSERT WITH CHECK (
--   organization_id IN (
--     SELECT organization_id FROM public.organization_members 
--     WHERE user_id = auth.uid() AND role = 'owner'
--   )
-- );


-- 3. TABLA: ORGANIZATIONS
-- ------------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Borrar viejas
DROP POLICY IF EXISTS "Members can view organizations" ON public.organizations;
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Usuarios ven sus organizaciones" ON public.organizations;
DROP POLICY IF EXISTS "SaaS_Select_Orgs" ON public.organizations;
DROP POLICY IF EXISTS "SaaS_Orgs_Select" ON public.organizations; -- Fixed
DROP POLICY IF EXISTS "SaaS_Update_Orgs" ON public.organizations;
DROP POLICY IF EXISTS "SaaS_Orgs_Update" ON public.organizations; -- Fixed

-- NUEVA POLÍTICA MAESTRA:
CREATE POLICY "SaaS_Orgs_Select" ON public.organizations
FOR SELECT USING (
  id IN ( SELECT * FROM get_user_org_ids() )
);

CREATE POLICY "SaaS_Orgs_Update" ON public.organizations
FOR UPDATE USING (
  id IN (
    SELECT organization_id FROM public.organization_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);


-- 4. TABLA: TICKETS
-- ------------------------------------------------------------------------------
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Borrar viejas (limpieza agresiva)
DROP POLICY IF EXISTS "Gestión total de mis tickets" ON public.tickets;
DROP POLICY IF EXISTS "Members can delete tickets" ON public.tickets;
DROP POLICY IF EXISTS "Members can insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Members can insert tickets for their organization" ON public.tickets;
DROP POLICY IF EXISTS "Members can view organization tickets" ON public.tickets;
DROP POLICY IF EXISTS "Members can view tickets" ON public.tickets;
DROP POLICY IF EXISTS "SaaS_Select_Tickets" ON public.tickets;
DROP POLICY IF EXISTS "SaaS_Tickets_Select" ON public.tickets; -- Fixed
DROP POLICY IF EXISTS "SaaS_Insert_Tickets" ON public.tickets;
DROP POLICY IF EXISTS "SaaS_Tickets_Insert" ON public.tickets; -- Fixed
DROP POLICY IF EXISTS "SaaS_Modify_Tickets" ON public.tickets;
DROP POLICY IF EXISTS "SaaS_Tickets_Update" ON public.tickets; -- Fixed
DROP POLICY IF EXISTS "SaaS_Delete_Tickets" ON public.tickets;
DROP POLICY IF EXISTS "SaaS_Tickets_Delete" ON public.tickets; -- Fixed

-- NUEVA POLÍTICA MAESTRA:
-- LECTURA
CREATE POLICY "SaaS_Tickets_Select" ON public.tickets
FOR SELECT USING (
  organization_id IN ( SELECT * FROM get_user_org_ids() )
);

-- ESCRITURA (INSERT)
CREATE POLICY "SaaS_Tickets_Insert" ON public.tickets
FOR INSERT WITH CHECK (
  organization_id IN ( SELECT * FROM get_user_org_ids() )
);

-- MODIFICACIÓN (UPDATE)
CREATE POLICY "SaaS_Tickets_Update" ON public.tickets
FOR UPDATE USING (
  organization_id IN ( SELECT * FROM get_user_org_ids() )
);

-- BORRADO (DELETE)
CREATE POLICY "SaaS_Tickets_Delete" ON public.tickets
FOR DELETE USING (
  organization_id IN ( SELECT * FROM get_user_org_ids() )
);


-- 5. TABLA: ATTACHMENTS
-- ------------------------------------------------------------------------------
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Borrar viejas
DROP POLICY IF EXISTS "Miembros de org ven attachments" ON public.attachments;
DROP POLICY IF EXISTS "Miembros de org suben attachments" ON public.attachments;
DROP POLICY IF EXISTS "SaaS_Attachments_Select" ON public.attachments; -- Fixed
DROP POLICY IF EXISTS "SaaS_Attachments_Insert" ON public.attachments; -- Fixed

-- NUEVA POLÍTICA MAESTRA:
CREATE POLICY "SaaS_Attachments_Select" ON public.attachments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = public.attachments.ticket_id
    AND t.organization_id IN ( SELECT * FROM get_user_org_ids() )
  )
);

CREATE POLICY "SaaS_Attachments_Insert" ON public.attachments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = public.attachments.ticket_id
    AND t.organization_id IN ( SELECT * FROM get_user_org_ids() )
  )
);
