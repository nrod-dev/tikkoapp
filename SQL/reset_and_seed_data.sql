-- Script to reset and seed mock data for tickets
-- USAGE: Run this in the Supabase SQL Editor

-- 1. Clean up existing tickets
TRUNCATE TABLE public.tickets CASCADE;

-- 2. Ensure we have a valid Organization
DO $$
DECLARE
    v_org_id uuid;
    v_collab_id_1 uuid;
    v_collab_id_2 uuid;
    v_collab_id_3 uuid;
    v_ticket_count integer := 50; -- Number of tickets to generate
BEGIN
    -- Get existing org or create a new "Demo Organization"
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    
    IF v_org_id IS NULL THEN
        INSERT INTO public.organizations (name, tax_id, slug, billing_email)
        VALUES ('Demo Organization', '30-11111111-1', 'demo-org', 'demo@example.com')
        RETURNING id INTO v_org_id;
    END IF;

    RAISE NOTICE 'Using Organization ID: %', v_org_id;

    -- 3. Ensure we have Collaborators for this Org
    -- Flatten existing collaborators for this org to be safe? Or just add new ones if few exist.
    -- Let's just create 3 specifically for testing to ensure we have known names.
    
    -- Check if we already have test collaborators to avoid duplicates if run multiple times without clearing collaborators
    SELECT id INTO v_collab_id_1 FROM public.collaborators WHERE phone = '+5491111111111';
    
    IF v_collab_id_1 IS NULL THEN
        INSERT INTO public.collaborators (first_name, last_name, phone, legajo, sector, organization_id)
        VALUES ('Juan', 'Perez', '+5491111111111', 'L001', 'Ventas', v_org_id)
        RETURNING id INTO v_collab_id_1;
    END IF;

    SELECT id INTO v_collab_id_2 FROM public.collaborators WHERE phone = '+5491122222222';
    
    IF v_collab_id_2 IS NULL THEN
        INSERT INTO public.collaborators (first_name, last_name, phone, legajo, sector, organization_id)
        VALUES ('Maria', 'Gonzalez', '+5491122222222', 'L002', 'Marketing', v_org_id)
        RETURNING id INTO v_collab_id_2;
    END IF;

    SELECT id INTO v_collab_id_3 FROM public.collaborators WHERE phone = '+5491133333333';
    
    IF v_collab_id_3 IS NULL THEN
        INSERT INTO public.collaborators (first_name, last_name, phone, legajo, sector, organization_id)
        VALUES ('Carlos', 'Lopez', '+5491133333333', 'L003', 'Operaciones', v_org_id)
        RETURNING id INTO v_collab_id_3;
    END IF;

    -- 4. Generate Mock Tickets
    INSERT INTO public.tickets (
        organization_id,
        date,
        amount,
        currency,
        merchant_name,
        status,
        category,
        source,
        source_type,
        iva_amount,
        collaborator_id,
        ai_summary,
        created_at,
        updated_at
    )
    SELECT
        v_org_id,
        (CURRENT_DATE - (random() * 90)::integer), -- Random date in last 90 days
        round((random() * 100000 + 100)::numeric, 2), -- Random amount between 100 and 100100
        'ARS',
        (ARRAY['Shell', 'YPF', 'Coto', 'Carrefour', 'Uber', 'Cabify', 'McDonalds', 'Starbucks', 'Farmacity', 'MercadoLibre'])[floor(random() * 10 + 1)],
        'processing',
        (ARRAY[
            'Otros servicios', 'Hogar', 'Aeorolinea', 'Transporte', 'Alojamiento', 'Salud',
            'Viajes y Turismo', 'Electro y Tecnologia', 'Servicios Financieros', 'Comercio Minorista',
            'Combustible', 'Recreacion', 'Cuidado y Belleza', 'Gastronomia', 'Jugueteria',
            'Educación', 'Supermercado', 'Servicios Publicos'
        ])[floor(random() * 18 + 1)],
        'mock_data', -- source
        'manual', -- source_type
        NULL, -- Will update iva_amount in next step to be consistent or just calc here
        (ARRAY[v_collab_id_1, v_collab_id_2, v_collab_id_3])[floor(random() * 3 + 1)],
        'Gasto generado automaticamente para testing',
        NOW() - (random() * interval '90 days'),
        NOW()
    FROM generate_series(1, v_ticket_count);

    -- Update IVA amount for the generated tickets (21% of amount typically)
    UPDATE public.tickets
    SET iva_amount = round((amount * 0.21), 2)
    WHERE source = 'mock_data';

    RAISE NOTICE 'Successfully generated % mock tickets.', v_ticket_count;

END $$;
