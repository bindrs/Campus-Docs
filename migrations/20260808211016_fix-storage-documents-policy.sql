-- Simplify storage RLS for documents bucket.
-- Class ownership is enforced in create_document RPC; storage only needs
-- authenticated professor uploads under their own user folder, and reads
-- for users who can access that class folder.

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
      AND (
        EXISTS (
          SELECT 1 FROM public.classes c
          WHERE c.id = ((storage.foldername(key))[2])::uuid
            AND c.professor_id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1 FROM public.class_members m
          WHERE m.class_id = ((storage.foldername(key))[2])::uuid
            AND m.student_id = (SELECT auth.uid())
        )
      )
    )
  )
);

CREATE POLICY documents_bucket_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket = 'documents'
  AND uploaded_by = (SELECT auth.jwt() ->> 'sub')
  AND COALESCE((storage.foldername(key))[1], '') = (SELECT auth.jwt() ->> 'sub')
  AND COALESCE((storage.foldername(key))[2], '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role IN ('professor', 'admin')
  )
  AND EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = ((storage.foldername(key))[2])::uuid
      AND c.professor_id = (SELECT auth.uid())
  )
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
