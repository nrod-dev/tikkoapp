-- Add collaborator_id column to whatsapp_sessions
ALTER TABLE public.whatsapp_sessions 
ADD COLUMN IF NOT EXISTS collaborator_id uuid REFERENCES public.collaborators(id);

-- Optional: Ensure at least one owner is present (uncomment if desired, but might break existing rows if any are orphans)
-- ALTER TABLE public.whatsapp_sessions 
-- ADD CONSTRAINT check_session_owner CHECK (user_id IS NOT NULL OR collaborator_id IS NOT NULL);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_collaborator_id ON public.whatsapp_sessions(collaborator_id);
