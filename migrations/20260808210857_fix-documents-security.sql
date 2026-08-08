-- Fix documents / engagement RLS the same way as classes:
-- SECURITY DEFINER RPCs with row_security=off, still enforcing ownership in SQL.

CREATE OR REPLACE FUNCTION public.create_document(
  p_class_id UUID,
  p_title TEXT,
  p_file_url TEXT,
  p_file_key TEXT,
  p_file_name TEXT,
  p_file_size BIGINT,
  p_mime_type TEXT,
  p_file_type TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS public.documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET row_security = off
AS $$
DECLARE
  uid UUID;
  new_doc public.documents;
BEGIN
  uid := (SELECT auth.uid());
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = p_class_id AND professor_id = uid
  ) THEN
    RAISE EXCEPTION 'Only the class professor can upload documents';
  END IF;

  INSERT INTO public.documents (
    class_id,
    professor_id,
    title,
    description,
    file_url,
    file_key,
    file_name,
    file_size,
    mime_type,
    file_type
  ) VALUES (
    p_class_id,
    uid,
    trim(p_title),
    NULLIF(trim(coalesce(p_description, '')), ''),
    p_file_url,
    p_file_key,
    p_file_name,
    GREATEST(coalesce(p_file_size, 0), 0),
    coalesce(NULLIF(trim(p_mime_type), ''), 'application/octet-stream'),
    coalesce(NULLIF(trim(p_file_type), ''), 'FILE')
  )
  RETURNING * INTO new_doc;

  RETURN new_doc;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_class_documents(p_class_id UUID)
RETURNS SETOF public.documents
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET row_security = off
AS $$
  SELECT d.*
  FROM public.documents d
  WHERE d.class_id = p_class_id
    AND (
      d.professor_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.class_members m
        WHERE m.class_id = d.class_id AND m.student_id = (SELECT auth.uid())
      )
      OR public.is_admin((SELECT auth.uid()))
    )
  ORDER BY d.uploaded_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.list_my_documents()
RETURNS SETOF public.documents
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET row_security = off
AS $$
  SELECT d.*
  FROM public.documents d
  WHERE d.professor_id = (SELECT auth.uid())
     OR EXISTS (
       SELECT 1 FROM public.class_members m
       WHERE m.class_id = d.class_id AND m.student_id = (SELECT auth.uid())
     )
     OR public.is_admin((SELECT auth.uid()))
  ORDER BY d.uploaded_at DESC
  LIMIT 50;
$$;

CREATE OR REPLACE FUNCTION public.get_my_document(p_document_id UUID)
RETURNS public.documents
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET row_security = off
AS $$
  SELECT d.*
  FROM public.documents d
  WHERE d.id = p_document_id
    AND (
      d.professor_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.class_members m
        WHERE m.class_id = d.class_id AND m.student_id = (SELECT auth.uid())
      )
      OR public.is_admin((SELECT auth.uid()))
    )
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.record_document_download(p_document_id UUID)
RETURNS public.document_downloads
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET row_security = off
AS $$
DECLARE
  uid UUID;
  row public.document_downloads;
BEGIN
  uid := (SELECT auth.uid());
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = p_document_id
      AND (
        d.professor_id = uid
        OR EXISTS (
          SELECT 1 FROM public.class_members m
          WHERE m.class_id = d.class_id AND m.student_id = uid
        )
        OR public.is_admin(uid)
      )
  ) THEN
    RAISE EXCEPTION 'Document not accessible';
  END IF;

  INSERT INTO public.document_downloads (document_id, student_id)
  VALUES (p_document_id, uid)
  RETURNING * INTO row;

  RETURN row;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_document_view(p_document_id UUID)
RETURNS public.document_views
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET row_security = off
AS $$
DECLARE
  uid UUID;
  row public.document_views;
BEGIN
  uid := (SELECT auth.uid());
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = p_document_id
      AND (
        d.professor_id = uid
        OR EXISTS (
          SELECT 1 FROM public.class_members m
          WHERE m.class_id = d.class_id AND m.student_id = uid
        )
        OR public.is_admin(uid)
      )
  ) THEN
    RAISE EXCEPTION 'Document not accessible';
  END IF;

  INSERT INTO public.document_views (document_id, student_id)
  VALUES (p_document_id, uid)
  RETURNING * INTO row;

  RETURN row;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_bookmark(p_document_id UUID)
RETURNS public.bookmarks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET row_security = off
AS $$
DECLARE
  uid UUID;
  row public.bookmarks;
BEGIN
  uid := (SELECT auth.uid());
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = p_document_id
      AND (
        d.professor_id = uid
        OR EXISTS (
          SELECT 1 FROM public.class_members m
          WHERE m.class_id = d.class_id AND m.student_id = uid
        )
      )
  ) THEN
    RAISE EXCEPTION 'Document not accessible';
  END IF;

  INSERT INTO public.bookmarks (document_id, student_id)
  VALUES (p_document_id, uid)
  ON CONFLICT (document_id, student_id) DO UPDATE
    SET document_id = EXCLUDED.document_id
  RETURNING * INTO row;

  RETURN row;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_bookmark(p_bookmark_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
SET row_security = off
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  DELETE FROM public.bookmarks
  WHERE id = p_bookmark_id
    AND student_id = (SELECT auth.uid());

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_document(UUID, TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_class_documents(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_documents() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_document(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_document_download(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_document_view(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_bookmark(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_bookmark(UUID) TO authenticated;
