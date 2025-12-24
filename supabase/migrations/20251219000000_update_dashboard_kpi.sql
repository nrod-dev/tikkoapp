-- Update function to calculate only APPROVED tickets for the current month
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

    -- Current Month Total (APPROVED ONLY)
    SELECT COALESCE(SUM(amount), 0) INTO curr_total
    FROM tickets
    WHERE organization_id = my_org_id
      AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE)
      AND status = 'approved';

    -- Previous Month Total (APPROVED ONLY)
    SELECT COALESCE(SUM(amount), 0) INTO prev_total
    FROM tickets
    WHERE organization_id = my_org_id
      AND date_trunc('month', date) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
      AND status = 'approved';

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
