-- Migration: Normalize Schema for WhatsApp & AI Workflow
-- Description: Separates raw messaging logs, conversation state, and AI logs from the main 'tickets' table.

-- 1. Table: WhatsApp Sessions (State Machine)
-- Tracks the user's current position in the conversational flow (e.g., waiting for confirmation).
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    phone_number text NOT NULL UNIQUE,
    current_state text NOT NULL DEFAULT 'IDLE', -- Enum: IDLE, WAITING_CONFIRMATION, EDITING
    temp_data jsonb DEFAULT '{}'::jsonb, -- Stores the extracted ticket data before confirmation
    last_interaction_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT whatsapp_sessions_pkey PRIMARY KEY (id)
);

-- Index for fast webhook lookups by phone number
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone ON public.whatsapp_sessions(phone_number);


-- 2. Table: Inbound Messages (Audit Log)
-- Canonical log of all messages received, regardless of processing success.
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    wa_message_id text UNIQUE NOT NULL, -- Meta's Message ID
    wa_chat_id text,
    sender_phone text NOT NULL,
    message_type text, -- text, image, document, location
    media_url text, -- Persistent URL if stored, or temp URL
    raw_payload jsonb, -- The full JSON payload from the webhook for debugging
    processed_status text DEFAULT 'pending', -- pending, processed, failed, ignored
    error_message text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT whatsapp_messages_pkey PRIMARY KEY (id)
);


-- 3. Table: AI Processing Logs
-- Tracks cost, latency, and raw outputs from Gemini/AI models.
CREATE TABLE IF NOT EXISTS public.ai_processing_logs (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL, -- Link if a ticket was created
    message_id uuid REFERENCES public.whatsapp_messages(id) ON DELETE SET NULL, -- Link to source message
    model text DEFAULT 'gemini-2.5-flash',
    prompt_used text,
    raw_response text,
    parsed_data jsonb,
    tokens_input integer,
    tokens_output integer,
    latency_ms integer,
    execution_time timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT ai_processing_logs_pkey PRIMARY KEY (id)
);


-- 4. Cleanup & Normalization of Tickets
-- Removing metadata fields that are now better handled by the specific tables above.
-- Note: Comment out specific DROP commands if you want to be conservative/reversible for now.

ALTER TABLE public.tickets
    DROP COLUMN IF EXISTS whatsapp_message_id, -- Moved to whatsapp_messages
    DROP COLUMN IF EXISTS whatsapp_chat_id,    -- Moved to whatsapp_messages
    DROP COLUMN IF EXISTS ai_raw_response,     -- Moved to ai_processing_logs
    ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual'; -- 'manual', 'whatsapp', 'email'


-- 5. Helper Function: Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_sessions_modtime
    BEFORE UPDATE ON public.whatsapp_sessions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- 6. Enable RLS (Security)
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_processing_logs ENABLE ROW LEVEL SECURITY;

-- Policy examples (Adjust based on your Auth setup)
-- Allow backend (service_role) full access. Users can see their own sessions.
CREATE POLICY "Users see own session" ON public.whatsapp_sessions
    FOR ALL USING (auth.uid() = user_id);
