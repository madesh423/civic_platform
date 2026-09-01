/*
# Fix phone uniqueness to allow multiple empty/null phones

1. Changes
- Drop the unique constraint on profiles.phone.
- Add a partial unique index that only enforces uniqueness for non-empty, non-null phones.
- Update handle_new_user trigger to insert NULL phone instead of empty string.
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;

DROP INDEX IF EXISTS idx_profiles_phone_unique;
CREATE UNIQUE INDEX idx_profiles_phone_unique ON profiles (phone)
  WHERE phone IS NOT NULL AND phone <> '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
