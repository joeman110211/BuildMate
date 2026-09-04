-- Create profile rows server-side when a Supabase Auth user is created.
-- This fixes signup when email confirmation is enabled: the client no longer needs
-- an authenticated session in order to insert its own profile row.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, email, full_name)
  VALUES (
    NEW.id,
    CASE WHEN NEW.raw_user_meta_data ->> 'role' IN ('customer', 'trader')
      THEN NEW.raw_user_meta_data ->> 'role' ELSE 'customer' END,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''), split_part(COALESCE(NEW.email, 'BuildMate user'), '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
