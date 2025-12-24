-- Fix Tickets RLS Policies

-- 1. Ensure RLS is enabled
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts (clean slate for tickets)
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can delete their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Org members can view org tickets" ON public.tickets;
-- clean up any potentially unnamed or generated policies? Hard to do safely without name. 
-- We'll stick to named drops or create "IF NOT EXISTS". 
-- Actually, replacing policies is better.

-- 3. Create comprehensive policies

-- Policy: Users can view tickets if they created them OR if they are in the organization
CREATE POLICY "Users can view their own or org tickets" ON public.tickets
    FOR SELECT
    USING (
        auth.uid() = created_by 
        OR 
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert tickets (assigning themselves or their org)
CREATE POLICY "Users can insert tickets" ON public.tickets
    FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        OR
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update tickets
CREATE POLICY "Users can update their own or org tickets" ON public.tickets
    FOR UPDATE
    USING (
        auth.uid() = created_by 
        OR 
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can delete tickets
CREATE POLICY "Users can delete their own or org tickets" ON public.tickets
    FOR DELETE
    USING (
        auth.uid() = created_by 
        OR 
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );
