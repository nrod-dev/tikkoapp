-- SEED DATA SCRIPT
-- Run this in Supabase SQL Editor to populate your Dashboard with test data.
-- Replaces 'target_user_id' with your UUID: 5a27ebec-516f-427e-8d25-39b04b581660

DO $$
DECLARE
    -- The user ID provided
    target_user_id uuid := '5a27ebec-516f-427e-8d25-39b04b581660';
    target_org_id uuid;
BEGIN
    -- 1. Get the organization ID for this user
    SELECT organization_id INTO target_org_id
    FROM public.organization_members
    WHERE user_id = target_user_id
    LIMIT 1;

    IF target_org_id IS NULL THEN
        RAISE EXCEPTION 'User % does not belong to any organization. Please create an org or join one first.', target_user_id;
    END IF;

    -- 2. Insert Data for THIS MONTH (For KPI "Total Pendiente" + "Donut Chart")
    INSERT INTO public.tickets (organization_id, created_by, date, amount, currency, merchant_name, category, status, source)
    VALUES 
    (target_org_id, target_user_id, CURRENT_DATE, 15500.50, 'ARS', 'Shell Estación', 'Combustible', 'pending_review', 'web_upload'),
    (target_org_id, target_user_id, CURRENT_DATE - INTERVAL '1 day', 4200.00, 'ARS', 'Starbucks', 'Alimentación', 'pending_review', 'web_upload'),
    (target_org_id, target_user_id, CURRENT_DATE - INTERVAL '3 days', 8900.00, 'ARS', 'Uber Trip', 'Transporte', 'approved', 'web_upload'),
    (target_org_id, target_user_id, CURRENT_DATE - INTERVAL '5 days', 25000.00, 'ARS', 'Carrefour Express', 'Varios', 'pending_review', 'web_upload');

    -- 3. Insert Data for LAST MONTH (For KPI comparison)
    INSERT INTO public.tickets (organization_id, created_by, date, amount, currency, merchant_name, category, status, source)
    VALUES 
    (target_org_id, target_user_id, CURRENT_DATE - INTERVAL '1 month', 12000.00, 'ARS', 'Axion Energy', 'Combustible', 'approved', 'web_upload'),
    (target_org_id, target_user_id, CURRENT_DATE - INTERVAL '1 month' - INTERVAL '2 days', 35000.00, 'ARS', 'Jumbo Supermercado', 'Alimentación', 'approved', 'web_upload');

    -- 4. Insert Historical Data (For "Trend Chart" - Last 6 months)
    INSERT INTO public.tickets (organization_id, created_by, date, amount, currency, merchant_name, category, status, source)
    VALUES 
    (target_org_id, target_user_id, CURRENT_DATE - INTERVAL '2 months', 45000.00, 'ARS', 'Hotel NH', 'Hospedaje', 'approved', 'web_upload'),
    (target_org_id, target_user_id, CURRENT_DATE - INTERVAL '3 months', 28000.00, 'ARS', 'YPF Full', 'Combustible', 'approved', 'web_upload'),
    (target_org_id, target_user_id, CURRENT_DATE - INTERVAL '4 months', 52000.00, 'ARS', 'Fravega', 'Equipamiento', 'approved', 'web_upload'),
    (target_org_id, target_user_id, CURRENT_DATE - INTERVAL '5 months', 15000.00, 'ARS', 'Cabify', 'Transporte', 'approved', 'web_upload');

END $$;
