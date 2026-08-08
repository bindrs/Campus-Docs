CREATE OR REPLACE FUNCTION public.create_class(
  p_class_name TEXT,
  p_course_code TEXT,
  p_department TEXT DEFAULT NULL,
  p_section TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS public.classes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET row_security = off
AS $$
DECLARE
  uid UUID;
  new_class public.classes;
  code TEXT;
  prefix TEXT;
BEGIN
  uid := (SELECT auth.uid());
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role IN ('professor', 'admin')
  ) THEN
    RAISE EXCEPTION 'Only professors can create classes';
  END IF;

  prefix := upper(substr(regexp_replace(coalesce(p_course_code, 'CLASS'), '[^a-zA-Z0-9]', '', 'g') || 'XXXX', 1, 4));
  code := prefix || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4));

  INSERT INTO public.classes (
    professor_id,
    class_name,
    course_code,
    department,
    section,
    description,
    join_code
  ) VALUES (
    uid,
    trim(p_class_name),
    trim(p_course_code),
    NULLIF(trim(coalesce(p_department, '')), ''),
    NULLIF(trim(coalesce(p_section, '')), ''),
    NULLIF(trim(coalesce(p_description, '')), ''),
    code
  )
  RETURNING * INTO new_class;

  RETURN new_class;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_class(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
