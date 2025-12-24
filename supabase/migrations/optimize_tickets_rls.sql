-- Optimize RLS policies for tickets table to fix performance warnings
-- 1. Drop ALL duplicate/overlapping policies identified in logs
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets from their org" ON public.tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tickets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.tickets;

-- Policies from previous fix
DROP POLICY IF EXISTS "Users and Admins view tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Org members can update tickets" ON public.tickets;

-- Policies identified as conflicting/permissive in logs
DROP POLICY IF EXISTS "Enable insert for users based on user_id or organization member" ON public.tickets;
DROP POLICY IF EXISTS "Enable read for users based on user_id or organization membersh" ON public.tickets; -- Log showed 'membersh', likely truncation but trying exact name just in case
DROP POLICY IF EXISTS "Enable read for users based on user_id or organization membership" ON public.tickets; -- Correct spelling guess
DROP POLICY IF EXISTS "Enable update for users based on user_id or organization member" ON public.tickets;
DROP POLICY IF EXISTS "Enable delete for users based on user_id or organization membership" ON public.tickets;

-- 2. Create single, optimized policies using (select auth.uid()) for caching

-- SELECT: Consolidates view logic
CREATE POLICY "tickets_select_policy" ON public.tickets
FOR SELECT USING (
    created_by = (select auth.uid())
    OR 
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (select auth.uid())
    )
);

-- INSERT: Consolidates creation logic
CREATE POLICY "tickets_insert_policy" ON public.tickets
FOR INSERT WITH CHECK (
    created_by = (select auth.uid())
    OR
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (select auth.uid())
    )
    OR
    -- Allow creation if linked to a valid collaborator (e.g. for bot/edge functions if they assume a user context, or just safety)
    -- If the user flow always sets created_by, the first condition covers it. 
    -- But we keep the collaborator check if that was intended for some unauthenticated flows (though this is specifically for authenticated role usually).
    -- We will keep it but optimized.
    EXISTS (SELECT 1 FROM public.collaborators WHERE id = collaborator_id) 
);

-- UPDATE: Consolidates update/approval logic
CREATE POLICY "tickets_update_policy" ON public.tickets
FOR UPDATE USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (select auth.uid())
    )
);

-- DELETE: Consolidates delete logic
CREATE POLICY "tickets_delete_policy" ON public.tickets
FOR DELETE USING (
    created_by = (select auth.uid())
    OR 
    organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (select auth.uid())
    )
);
