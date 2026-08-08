CREATE TYPE public.user_role AS ENUM ('student', 'professor', 'admin');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role public.user_role NOT NULL DEFAULT 'student',
  department TEXT,
  semester INTEGER CHECK (semester IS NULL OR semester > 0),
  roll_number TEXT,
  faculty_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  course_code TEXT NOT NULL,
  semester INTEGER CHECK (semester IS NULL OR semester > 0),
  department TEXT,
  section TEXT,
  description TEXT,
  join_code TEXT NOT NULL UNIQUE,
  cover_image_url TEXT,
  cover_image_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, student_id)
);

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0 CHECK (file_size >= 0),
  mime_type TEXT NOT NULL,
  file_type TEXT NOT NULL,
  thumbnail_url TEXT,
  thumbnail_key TEXT,
  visibility TEXT NOT NULL DEFAULT 'members' CHECK (visibility IN ('members', 'private')),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.document_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (read_duration_seconds >= 0),
  device TEXT,
  browser TEXT
);

CREATE TABLE public.document_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  attachment_url TEXT,
  attachment_key TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  attachment_url TEXT,
  attachment_key TEXT,
  deadline TIMESTAMPTZ,
  total_marks INTEGER CHECK (total_marks IS NULL OR total_marks >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, student_id)
);

CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX classes_professor_id_idx ON public.classes(professor_id);
CREATE INDEX classes_course_code_idx ON public.classes(course_code);
CREATE INDEX class_members_student_id_idx ON public.class_members(student_id);
CREATE INDEX documents_class_id_idx ON public.documents(class_id);
CREATE INDEX documents_professor_id_idx ON public.documents(professor_id);
CREATE INDEX documents_uploaded_at_idx ON public.documents(uploaded_at DESC);
CREATE INDEX document_views_document_id_idx ON public.document_views(document_id);
CREATE INDEX document_views_student_id_idx ON public.document_views(student_id);
CREATE INDEX document_downloads_document_id_idx ON public.document_downloads(document_id);
CREATE INDEX announcements_class_id_idx ON public.announcements(class_id);
CREATE INDEX assignments_class_id_idx ON public.assignments(class_id);
CREATE INDEX assignments_deadline_idx ON public.assignments(deadline);
CREATE INDEX notifications_user_id_created_at_idx ON public.notifications(user_id, created_at DESC);
CREATE INDEX bookmarks_student_id_idx ON public.bookmarks(student_id);
CREATE INDEX activity_logs_actor_id_created_at_idx ON public.activity_logs(actor_id, created_at DESC);

CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER classes_set_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER documents_set_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER announcements_set_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER assignments_set_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_professor(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid AND role IN ('professor', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_class(class_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = class_uuid AND professor_id = user_uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.is_class_member(class_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = class_uuid AND student_id = user_uuid
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_class(class_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT public.is_admin(user_uuid)
    OR public.owns_class(class_uuid, user_uuid)
    OR public.is_class_member(class_uuid, user_uuid);
$$;

CREATE OR REPLACE FUNCTION public.can_access_document(document_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_uuid
      AND (
        d.professor_id = user_uuid
        OR public.is_admin(user_uuid)
        OR public.is_class_member(d.class_id, user_uuid)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin((SELECT auth.uid())) THEN
    RAISE EXCEPTION 'Only administrators can change profile roles';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_prevent_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_change();

CREATE OR REPLACE FUNCTION public.join_class_by_code(code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  target_class UUID;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'student'
  ) THEN
    RAISE EXCEPTION 'Only student profiles can join classes';
  END IF;

  SELECT id INTO target_class
  FROM public.classes
  WHERE UPPER(join_code) = UPPER(TRIM(code))
  LIMIT 1;

  IF target_class IS NULL THEN
    RAISE EXCEPTION 'Invalid join code';
  END IF;

  INSERT INTO public.class_members (class_id, student_id)
  VALUES (target_class, (SELECT auth.uid()))
  ON CONFLICT (class_id, student_id) DO NOTHING;

  RETURN target_class;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_class_member(class_uuid UUID, student_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF NOT (public.owns_class(class_uuid, (SELECT auth.uid()))
    OR public.is_admin((SELECT auth.uid()))) THEN
    RAISE EXCEPTION 'Only the class professor or an administrator can remove students';
  END IF;

  DELETE FROM public.class_members
  WHERE class_id = class_uuid AND student_id = student_uuid;

  RETURN FOUND;
END;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_self_or_admin ON public.profiles
FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())));

CREATE POLICY profiles_insert_self ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = (SELECT auth.uid()) AND role IN ('student', 'professor'));

CREATE POLICY profiles_update_self_or_admin ON public.profiles
FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())))
WITH CHECK (id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())));

CREATE POLICY classes_select_accessible ON public.classes
FOR SELECT TO authenticated
USING (public.can_access_class(id, (SELECT auth.uid())));

CREATE POLICY classes_insert_professor ON public.classes
FOR INSERT TO authenticated
WITH CHECK (professor_id = (SELECT auth.uid()) AND public.is_professor((SELECT auth.uid())));

CREATE POLICY classes_update_owner_or_admin ON public.classes
FOR UPDATE TO authenticated
USING (professor_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())))
WITH CHECK (professor_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())));

CREATE POLICY classes_delete_owner_or_admin ON public.classes
FOR DELETE TO authenticated
USING (professor_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())));

CREATE POLICY class_members_select_accessible ON public.class_members
FOR SELECT TO authenticated
USING (
  student_id = (SELECT auth.uid())
  OR public.can_access_class(class_id, (SELECT auth.uid()))
);

CREATE POLICY documents_select_accessible ON public.documents
FOR SELECT TO authenticated
USING (public.can_access_document(id, (SELECT auth.uid())));

CREATE POLICY documents_insert_owner ON public.documents
FOR INSERT TO authenticated
WITH CHECK (
  professor_id = (SELECT auth.uid())
  AND public.owns_class(class_id, (SELECT auth.uid()))
);

CREATE POLICY documents_update_owner_or_admin ON public.documents
FOR UPDATE TO authenticated
USING (professor_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())))
WITH CHECK (professor_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())));

CREATE POLICY documents_delete_owner_or_admin ON public.documents
FOR DELETE TO authenticated
USING (professor_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())));

CREATE POLICY document_views_select_owner_or_admin ON public.document_views
FOR SELECT TO authenticated
USING (
  public.is_admin((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id AND d.professor_id = (SELECT auth.uid())
  )
  OR student_id = (SELECT auth.uid())
);

CREATE POLICY document_views_insert_student ON public.document_views
FOR INSERT TO authenticated
WITH CHECK (
  student_id = (SELECT auth.uid())
  AND public.can_access_document(document_id, (SELECT auth.uid()))
);

CREATE POLICY document_downloads_select_owner_or_admin ON public.document_downloads
FOR SELECT TO authenticated
USING (
  public.is_admin((SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = document_id AND d.professor_id = (SELECT auth.uid())
  )
  OR student_id = (SELECT auth.uid())
);

CREATE POLICY document_downloads_insert_student ON public.document_downloads
FOR INSERT TO authenticated
WITH CHECK (
  student_id = (SELECT auth.uid())
  AND public.can_access_document(document_id, (SELECT auth.uid()))
);

CREATE POLICY announcements_select_accessible ON public.announcements
FOR SELECT TO authenticated
USING (public.can_access_class(class_id, (SELECT auth.uid())));

CREATE POLICY announcements_insert_owner ON public.announcements
FOR INSERT TO authenticated
WITH CHECK (author_id = (SELECT auth.uid()) AND public.owns_class(class_id, (SELECT auth.uid())));

CREATE POLICY announcements_update_owner_or_admin ON public.announcements
FOR UPDATE TO authenticated
USING (author_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())))
WITH CHECK (author_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())));

CREATE POLICY announcements_delete_owner_or_admin ON public.announcements
FOR DELETE TO authenticated
USING (author_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())));

CREATE POLICY assignments_select_accessible ON public.assignments
FOR SELECT TO authenticated
USING (public.can_access_class(class_id, (SELECT auth.uid())));

CREATE POLICY assignments_insert_owner ON public.assignments
FOR INSERT TO authenticated
WITH CHECK (author_id = (SELECT auth.uid()) AND public.owns_class(class_id, (SELECT auth.uid())));

CREATE POLICY assignments_update_owner_or_admin ON public.assignments
FOR UPDATE TO authenticated
USING (author_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())))
WITH CHECK (author_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())));

CREATE POLICY assignments_delete_owner_or_admin ON public.assignments
FOR DELETE TO authenticated
USING (author_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())));

CREATE POLICY notifications_select_self ON public.notifications
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY notifications_update_self ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY bookmarks_select_self ON public.bookmarks
FOR SELECT TO authenticated
USING (student_id = (SELECT auth.uid()));

CREATE POLICY bookmarks_insert_self ON public.bookmarks
FOR INSERT TO authenticated
WITH CHECK (
  student_id = (SELECT auth.uid())
  AND public.can_access_document(document_id, (SELECT auth.uid()))
);

CREATE POLICY bookmarks_delete_self ON public.bookmarks
FOR DELETE TO authenticated
USING (student_id = (SELECT auth.uid()));

CREATE POLICY activity_logs_select_self_or_admin ON public.activity_logs
FOR SELECT TO authenticated
USING (actor_id = (SELECT auth.uid()) OR public.is_admin((SELECT auth.uid())));

CREATE POLICY activity_logs_insert_self ON public.activity_logs
FOR INSERT TO authenticated
WITH CHECK (actor_id = (SELECT auth.uid()));

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT SELECT ON public.class_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT ON public.document_views TO authenticated;
GRANT SELECT, INSERT ON public.document_downloads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.bookmarks TO authenticated;
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_class_member(UUID, UUID) TO authenticated;

REVOKE UPDATE, DELETE ON public.document_views FROM authenticated;
REVOKE UPDATE, DELETE ON public.document_downloads FROM authenticated;
REVOKE UPDATE, DELETE ON public.activity_logs FROM authenticated;
