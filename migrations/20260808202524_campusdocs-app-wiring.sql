-- Storage RLS for the private documents bucket.
-- Profiles are created from the app on first save so users can pick student/professor.

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS documents_bucket_select ON storage.objects;
DROP POLICY IF EXISTS documents_bucket_insert ON storage.objects;
DROP POLICY IF EXISTS documents_bucket_update ON storage.objects;
DROP POLICY IF EXISTS documents_bucket_delete ON storage.objects;

CREATE POLICY documents_bucket_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket = 'documents'
  AND (
    uploaded_by = (SELECT auth.jwt() ->> 'sub')
    OR public.is_admin((SELECT auth.uid()))
    OR (
      COALESCE((storage.foldername(key))[2], '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND public.can_access_class(((storage.foldername(key))[2])::uuid, (SELECT auth.uid()))
    )
  )
);

CREATE POLICY documents_bucket_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket = 'documents'
  AND uploaded_by = (SELECT auth.jwt() ->> 'sub')
  AND public.is_professor((SELECT auth.uid()))
  AND COALESCE((storage.foldername(key))[1], '') = (SELECT auth.jwt() ->> 'sub')
  AND COALESCE((storage.foldername(key))[2], '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND public.owns_class(((storage.foldername(key))[2])::uuid, (SELECT auth.uid()))
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

GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
