CREATE OR REPLACE FUNCTION public.list_my_classes()
RETURNS SETOF public.classes
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET row_security = off
AS $$
  SELECT c.*
  FROM public.classes c
  WHERE c.professor_id = (SELECT auth.uid())
     OR EXISTS (
       SELECT 1
       FROM public.class_members m
       WHERE m.class_id = c.id
         AND m.student_id = (SELECT auth.uid())
     )
  ORDER BY c.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_my_class(p_class_id UUID)
RETURNS public.classes
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET row_security = off
AS $$
  SELECT c.*
  FROM public.classes c
  WHERE c.id = p_class_id
    AND (
      c.professor_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.class_members m
        WHERE m.class_id = c.id
          AND m.student_id = (SELECT auth.uid())
      )
      OR public.is_admin((SELECT auth.uid()))
    )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.list_my_classes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_class(UUID) TO authenticated;
