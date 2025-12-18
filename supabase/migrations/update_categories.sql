-- Update all existing tickets to have NULL category
UPDATE public.tickets
SET category = NULL;
