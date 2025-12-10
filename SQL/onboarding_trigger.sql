-- AUTOMATED ONBOARDING SCRIPT
-- This script ensures every new user gets a Profile + Organization + Owner Role automatically.

-- 1. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_org_id uuid;
  user_name text;
BEGIN
  -- Determine a name for the Org (Full Name or Email)
  user_name := COALESCE(new.raw_user_meta_data->>'full_name', new.email);

  -- 1. Create Profile
  -- We use ON CONFLICT DO NOTHING in case the profile was created by another process
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url;

  -- 2. Create Default Organization
  INSERT INTO public.organizations (name)
  VALUES ('Organización de ' || user_name)
  RETURNING id INTO new_org_id;

  -- 3. Add Member as Owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, new.id, 'owner');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-create the Trigger
-- Drop first to ensure we are updating the logic
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
