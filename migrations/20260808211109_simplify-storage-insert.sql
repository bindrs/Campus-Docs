-- Storage policies that query classes/profiles under RLS can fail for professors.
-- Use SECURITY DEFINER helpers + a simple insert rule.

CREATE OR REPLACE FUNCTION public.storage_can_access_documents_key(object_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET row_security = off
AS $$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND (
      public.is_admin((SELECT auth.uid()))
      OR COALESCE((storage.foldername(object_key))[1], '') = (SELECT auth.jwt() ->> 'sub')
      OR (
        COALESCE((storage.foldername(object_key))[2], '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND (
          EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = ((storage.foldername(object_key))[2])::uuid
              AND c.professor_id = (SELECT auth.uid())
          )
          OR EXISTS (
            SELECT 1 FROM public.class_members m
            WHERE m.class_id = ((storage.foldername(object_key))[2])::uuid
              AND m.student_id = (SELECT auth.uid())
          )
        )
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.storage_can_upload_documents_key(object_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET row_security = off
AS $$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND public.is_professor((SELECT auth.uid()))
    AND COALESCE((storage.foldername(object_key))[1], '') = (SELECT auth.jwt() ->> 'sub')
    AND COALESCE((storage.foldername(object_key))[2], '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = ((storage.foldername(object_key))[2])::uuid
        AND c.professor_id = (SELECT auth.uid())
    );
$$;

GRANT EXECUTE ON FUNCTION public.storage_can_access_documents_key(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.storage_can_upload_documents_key(TEXT) TO authenticated;

DROP POLICY IF EXISTS documents_bucket_select ON storage.objects;
DROP POLICY IF EXISTS documents_bucket_insert ON storage.objects;
DROP POLICY IF EXISTS documents_bucket_update ON storage.objects;
DROP POLICY IF EXISTS documents_bucket_delete ON storage.objects;

CREATE POLICY documents_bucket_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket = 'documents'
  AND public.storage_can_access_documents_key(key)
);

CREATE POLICY documents_bucket_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket = 'documents'
  AND uploaded_by = (SELECT auth.jwt() ->> 'sub')
  AND public.storage_can_upload_documents_key(key)
);

CREATE POLICY documents_bucket_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket = 'documents'
  AND (uploaded_by = (SELECT auth.jwt() ->> 'sub') OR public.is_admin((SELECT auth.uid())))
)
WITH CHECK (
  bucket = 'documents'
  AND (uploaded_by = (SELECT auth.jwt() ->> 'sub') OR public.is_admin((SELECT auth.uid())))
);

CREATE POLICY documents_bucket_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket = 'documents'
  AND (uploaded_by = (SELECT auth.jwt() ->> 'sub') OR public.is_admin((SELECT auth.uid())))
);
