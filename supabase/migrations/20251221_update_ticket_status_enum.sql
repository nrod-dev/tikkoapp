-- Add new status values to the ticket_status enum
-- We use IF NOT EXISTS to avoid errors if they were already added.
-- Note: 'ALTER TYPE ... ADD VALUE IF NOT EXISTS' is supported in Postgres 12+

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        -- If type doesn't exist, create it (should exist based on schema.sql)
        CREATE TYPE ticket_status AS ENUM ('processing', 'pendiente', 'approved', 'rejected');
    ELSE
        -- Add values if they don't exist
        ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'pendiente';
        ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'approved';
        ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'rejected';
    END IF;
END
$$;

COMMIT;
