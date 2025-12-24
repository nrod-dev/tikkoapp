-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_processing_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ticket_id uuid,
  message_id uuid,
  model text DEFAULT 'gemini-2.5-flash'::text,
  prompt_used text,
  raw_response text,
  parsed_data jsonb,
  tokens_input integer,
  tokens_output integer,
  latency_ms integer,
  execution_time timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT ai_processing_logs_pkey PRIMARY KEY (id),
  CONSTRAINT ai_processing_logs_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id),
  CONSTRAINT ai_processing_logs_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.whatsapp_messages(id)
);
CREATE TABLE public.attachments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ticket_id uuid NOT NULL,
  storage_path text NOT NULL,
  file_type text,
  file_size integer,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT attachments_pkey PRIMARY KEY (id),
  CONSTRAINT attachments_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id)
);
CREATE TABLE public.collaborators (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL UNIQUE,
  legajo text,
  sector text,
  organization_id uuid,
  CONSTRAINT collaborators_pkey PRIMARY KEY (id),
  CONSTRAINT collaborators_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.organization_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'member'::user_role,
  joined_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT organization_members_pkey PRIMARY KEY (id),
  CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  tax_id text,
  slug text UNIQUE,
  billing_email text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  whatsapp_number text UNIQUE,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.tickets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  created_by uuid,
  date date,
  amount numeric,
  currency USER-DEFINED DEFAULT 'ARS'::ticket_currency,
  merchant_name text,
  merchant_tax_id text,
  tax_details jsonb DEFAULT '{}'::jsonb,
  status USER-DEFINED NOT NULL DEFAULT 'processing'::ticket_status,
  category text,
  ai_summary text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  receipt_url text,
  source text DEFAULT 'web_upload'::text,
  confidence_score numeric,
  confirmed_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  source_type text DEFAULT 'manual'::text,
  iva_amount numeric DEFAULT NULL::numeric,
  collaborator_id uuid,
  CONSTRAINT tickets_pkey PRIMARY KEY (id),
  CONSTRAINT tickets_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT tickets_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id),
  CONSTRAINT tickets_collaborator_id_fkey FOREIGN KEY (collaborator_id) REFERENCES public.collaborators(id),
  CONSTRAINT tickets_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.whatsapp_messages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  wa_message_id text NOT NULL UNIQUE,
  wa_chat_id text,
  sender_phone text NOT NULL,
  message_type text,
  media_url text,
  raw_payload jsonb,
  processed_status text DEFAULT 'pending'::text,
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT whatsapp_messages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.whatsapp_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  phone_number text NOT NULL UNIQUE,
  current_state text NOT NULL DEFAULT 'IDLE'::text,
  temp_data jsonb DEFAULT '{}'::jsonb,
  last_interaction_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT whatsapp_sessions_pkey PRIMARY KEY (id)
);