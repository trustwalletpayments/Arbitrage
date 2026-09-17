-- Keep the referral program code identical to the code shown in Account Settings.
-- Account Settings derives the code from the user's email prefix:
-- ORB + first 8 alphanumeric characters (uppercase) + 100.

UPDATE public.profiles AS p
SET referral_code = COALESCE(
  NULLIF(
    'ORB' || LEFT(REGEXP_REPLACE(UPPER(SPLIT_PART(u.email, '@', 1)), '[^A-Z0-9]', '', 'g'), 8) || '100',
    'ORB100'
  ),
  p.referral_code
)
FROM auth.users AS u
WHERE u.id = p.id
  AND u.email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_code TEXT;
  clean_prefix TEXT;
BEGIN
  clean_prefix := LEFT(REGEXP_REPLACE(UPPER(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)), '[^A-Z0-9]', '', 'g'), 8);
  generated_code := 'ORB' || COALESCE(NULLIF(clean_prefix, ''), 'USER') || '100';

  INSERT INTO public.profiles (id, referral_code)
  VALUES (NEW.id, generated_code)
  ON CONFLICT (id) DO UPDATE
    SET referral_code = COALESCE(public.profiles.referral_code, EXCLUDED.referral_code);

  RETURN NEW;
END;
$$;
