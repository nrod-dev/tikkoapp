-- DASHBOARD ANALYTICS FUNCTIONS
-- These functions aggregate data on the server side to avoid fetching thousands of rows.

-- 1. Get Monthly Total & Trend
-- Returns: current_month_total, previous_month_total, percentage_change
CREATE OR REPLACE FUNCTION public.get_monthly_dashboard_stats()
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    curr_total numeric;
    prev_total numeric;
    pct_change numeric;
    my_org_id uuid;
BEGIN
    my_org_id := get_my_org_id();

    -- Current Month Total
    SELECT COALESCE(SUM(amount), 0) INTO curr_total
    FROM tickets
    WHERE organization_id = my_org_id
      AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE);

    -- Previous Month Total
    SELECT COALESCE(SUM(amount), 0) INTO prev_total
    FROM tickets
    WHERE organization_id = my_org_id
      AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month');

    -- Calculate Percentage Change
    IF prev_total = 0 THEN
        IF curr_total = 0 THEN
            pct_change := 0;
        ELSE
            pct_change := 100;
        END IF;
    ELSE
        pct_change := ROUND(((curr_total - prev_total) / prev_total) * 100, 1);
    END IF;

    RETURN json_build_object(
        'current_month_total', curr_total,
        'previous_month_total', prev_total,
        'percentage_change', pct_change
    );
END;
$$;

-- 2. Get Top Collaborators (Top 5 by spend)
CREATE OR REPLACE FUNCTION public.get_top_collaborators()
RETURNS TABLE (
    full_name text,
    total_amount numeric,
    ticket_count bigint
) 
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    my_org_id uuid;
BEGIN
    my_org_id := get_my_org_id();

    RETURN QUERY
    SELECT 
        COALESCE(p.full_name, 'Desconocido') as full_name,
        SUM(t.amount) as total_amount,
        COUNT(t.id) as ticket_count
    FROM tickets t
    LEFT JOIN profiles p ON t.created_by = p.id
    WHERE t.organization_id = my_org_id
    GROUP BY p.full_name
    ORDER BY total_amount DESC
    LIMIT 5;
END;
$$;

-- 3. Get Expenses by Category (Donut Chart)
CREATE OR REPLACE FUNCTION public.get_expenses_by_category()
RETURNS TABLE (
    category text,
    total_amount numeric
) 
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    my_org_id uuid;
BEGIN
    my_org_id := get_my_org_id();

    RETURN QUERY
    SELECT 
        COALESCE(NULLIF(t.category, ''), 'Sin Categoría') as category,
        SUM(t.amount) as total_amount
    FROM tickets t
    WHERE t.organization_id = my_org_id
    GROUP BY 1
    ORDER BY total_amount DESC;
END;
$$;

-- 4. Get Expense Trend (Last 6 Months)
CREATE OR REPLACE FUNCTION public.get_expense_trend()
RETURNS TABLE (
    month_label text,
    total_amount numeric
) 
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    my_org_id uuid;
BEGIN
    my_org_id := get_my_org_id();

    RETURN QUERY
    SELECT 
        TO_CHAR(date_trunc('month', date), 'Mon') as month_label,
        SUM(amount) as total_amount
    FROM tickets
    WHERE organization_id = my_org_id
      AND date >= date_trunc('month', CURRENT_DATE - INTERVAL '5 months')
    GROUP BY date_trunc('month', date)
    ORDER BY date_trunc('month', date) ASC;
END;
$$;
