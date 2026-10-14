-- backend/src/db/sql/2026-10-14_protect_admin_role.sql
--
-- Stops anyone from making themselves an admin from the app.
--
-- The app writes profiles.role straight from the browser (role choice after
-- sign-up), using the user's own Supabase session. Without this guard, any
-- signed-in user could send role = 'admin' and get the admin panel + API.
--
-- New rows: role 'admin' is always replaced with 'user'.
-- Updates made AS A SIGNED-IN USER (Postgres roles 'authenticated' /
-- 'anon', i.e. the browser):
--   * can't set role to 'admin'          → error
--   * an admin can't lose admin this way → role is kept (no error)
--   * any other role change (buyer/seller/…) works as before
-- The backend (service key / DATABASE_URL), the SQL editor and
-- `npm run make-admin` are not affected.
--
-- Idempotent: safe to run more than once (Supabase SQL editor, or psql).

BEGIN;

CREATE OR REPLACE FUNCTION protect_profile_admin_role()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- New profiles never start as admin, whoever inserts them: a sign-up
  -- trigger may copy role from user metadata, which the browser controls.
  -- Admins are only ever made by promoting an existing account.
  IF TG_OP = 'INSERT' THEN
    IF NEW.role::text = 'admin' THEN
      NEW.role := 'user';
    END IF;
    RETURN NEW;
  END IF;

  IF current_user NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  -- UPDATE
  IF OLD.role::text = 'admin' AND NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  ELSIF NEW.role::text = 'admin' AND OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Not allowed to assign the admin role' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_admin_role ON profiles;
CREATE TRIGGER profiles_protect_admin_role
  BEFORE INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_admin_role();

COMMIT;

-- ------------------------------------------------------------
-- Make someone an admin from the Supabase SQL editor (alternative to
-- `npm run make-admin -- email`). They must have signed up first.
-- ------------------------------------------------------------
-- UPDATE profiles SET role = 'admin', updated_at = now() WHERE lower(email) = lower('you@example.com');
--
-- See who is an admin:
-- SELECT email, full_name FROM profiles WHERE role::text = 'admin';
