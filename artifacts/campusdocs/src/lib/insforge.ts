import { createClient } from '@insforge/sdk';

const baseUrl = import.meta.env.VITE_INSFORGE_URL;
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY;

export const insforge = createClient({
  baseUrl: baseUrl || '',
  anonKey: anonKey || undefined,
});

export type UserRole = 'student' | 'professor' | 'admin';

export type Profile = {
  id: string;
  email?: string;
  full_name?: string;
  name?: string;
  avatar_url?: string;
  role?: UserRole;
  department?: string;
  semester?: string | number | null;
  roll_number?: string | null;
  faculty_id?: string | null;
  [key: string]: unknown;
};

export type ClassRow = {
  id: string;
  class_name: string;
  course_code: string;
  department?: string | null;
  section?: string | null;
  description?: string | null;
  join_code: string;
  professor_id: string;
  created_at?: string;
  [key: string]: unknown;
};

export type DocumentRow = {
  id: string;
  title: string;
  description?: string | null;
  file_url: string;
  file_key: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_type: string;
  class_id: string;
  professor_id?: string;
  uploaded_at?: string;
  [key: string]: unknown;
};

export type BookmarkRow = {
  id: string;
  document_id: string;
  student_id: string;
  created_at?: string;
};

type DbResult<T> = { data: T | null; error: Error | null };

function asError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return new Error(String(error || 'Unknown error'));
}

export function displayName(profile?: Profile | null, authName?: string) {
  return profile?.full_name || profile?.name || authName || '';
}

export function generateJoinCode(courseCode?: string) {
  const prefix = (courseCode || 'CLASS')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, 'X');
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

export async function getCurrentUser() {
  return insforge.auth.getCurrentUser();
}

export async function getCampusProfile(userId: string): Promise<DbResult<Profile>> {
  try {
    const result = await insforge.database
      .from('profiles')
      .select()
      .eq('id', userId)
      .maybeSingle();
    if (result.error) return { data: null, error: asError(result.error) };
    const row = result.data as Profile | null;
    if (!row) return { data: null, error: null };
    return {
      data: {
        ...row,
        name: row.full_name || row.name,
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error: asError(error) };
  }
}

export async function ensureCampusProfile(user: {
  id: string;
  email?: string | null;
  profile?: { name?: string; avatar_url?: string } | null;
}): Promise<DbResult<Profile>> {
  const existing = await getCampusProfile(user.id);
  if (existing.data || existing.error) return existing;

  // Role is chosen on the landing page before OAuth and stored locally.
  const { getPendingRole, clearPendingRole } = await import('@/lib/role');
  const pendingRole = getPendingRole();
  if (!pendingRole) return { data: null, error: null };

  const insert = await insforge.database
    .from('profiles')
    .insert([
      {
        id: user.id,
        email: user.email || '',
        full_name: user.profile?.name || '',
        avatar_url: user.profile?.avatar_url || null,
        role: pendingRole,
      },
    ])
    .select()
    .maybeSingle();

  clearPendingRole();

  if (insert.error) {
    const again = await getCampusProfile(user.id);
    if (again.data) return again;
    return { data: null, error: asError(insert.error) };
  }

  const row = insert.data as Profile;
  return {
    data: { ...row, name: row.full_name || row.name },
    error: null,
  };
}

export async function saveCampusProfile(
  userId: string,
  values: {
    full_name: string;
    role?: UserRole | '';
    department?: string;
    semester?: string | number | null;
    roll_number?: string;
  },
  existing?: Profile | null,
): Promise<DbResult<Profile>> {
  const semesterValue =
    values.semester === '' || values.semester == null
      ? null
      : Number.isFinite(Number(values.semester))
        ? Number(values.semester)
        : values.semester;

  const payload: Record<string, unknown> = {
    full_name: values.full_name,
    department: values.department || null,
    semester: semesterValue,
    roll_number: values.roll_number || null,
  };

  try {
    if (!existing) {
      if (!values.role) {
        return { data: null, error: new Error('Choose a role to finish setup') };
      }
      const current = await getCurrentUser();
      const insert = await insforge.database
        .from('profiles')
        .insert([
          {
            id: userId,
            email: current.data?.user?.email || '',
            role: values.role,
            ...payload,
          },
        ])
        .select()
        .maybeSingle();
      if (insert.error) return { data: null, error: asError(insert.error) };
      const row = insert.data as Profile;
      return { data: { ...row, name: row.full_name }, error: null };
    }

    const update = await insforge.database
      .from('profiles')
      .update(payload)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (update.error) return { data: null, error: asError(update.error) };
    const row = update.data as Profile;
    return { data: { ...row, name: row.full_name }, error: null };
  } catch (error) {
    return { data: null, error: asError(error) };
  }
}

export async function queryTable<T>(
  table: string,
  builder?: (query: any) => any,
): Promise<DbResult<T[]>> {
  try {
    let query = insforge.database.from(table).select();
    if (builder) query = builder(query);
    const result = await query;
    return {
      data: (result.data || []) as T[],
      error: result.error ? asError(result.error) : null,
    };
  } catch (error) {
    return { data: null, error: asError(error) };
  }
}

export async function queryOne<T>(table: string, id: string): Promise<DbResult<T>> {
  try {
    const result = await insforge.database.from(table).select().eq('id', id).maybeSingle();
    return {
      data: (result.data as T) || null,
      error: result.error ? asError(result.error) : null,
    };
  } catch (error) {
    return { data: null, error: asError(error) };
  }
}

export async function insertRow(table: string, values: Record<string, unknown>) {
  const result = await insforge.database.from(table).insert([values]).select();
  return {
    data: result.data,
    error: result.error ? asError(result.error) : null,
  };
}

export async function updateRow(table: string, id: string, values: Record<string, unknown>) {
  const result = await insforge.database.from(table).update(values).eq('id', id).select();
  return {
    data: result.data,
    error: result.error ? asError(result.error) : null,
  };
}

export async function deleteRow(table: string, id: string) {
  const result = await insforge.database.from(table).delete().eq('id', id);
  return {
    data: result.data,
    error: result.error ? asError(result.error) : null,
  };
}

export async function joinClassByCode(joinCode: string) {
  const result = await insforge.database.rpc('join_class_by_code', {
    code: joinCode,
  });
  return {
    data: result.data,
    error: result.error ? asError(result.error) : null,
  };
}

export async function removeClassMember(classId: string, studentId: string) {
  const result = await insforge.database.rpc('remove_class_member', {
    class_uuid: classId,
    student_uuid: studentId,
  });
  return {
    data: result.data,
    error: result.error ? asError(result.error) : null,
  };
}

export async function listMyClasses() {
  return queryTable<ClassRow>('classes', (query) =>
    query.order('created_at', { ascending: false }),
  );
}

export async function listClassDocuments(classId: string) {
  return queryTable<DocumentRow>('documents', (query) =>
    query.eq('class_id', classId).order('uploaded_at', { ascending: false }),
  );
}

export async function listRecentDocuments() {
  return queryTable<DocumentRow>('documents', (query) =>
    query.order('uploaded_at', { ascending: false }).limit(12),
  );
}

export async function getDocument(id: string) {
  return queryOne<DocumentRow>('documents', id);
}

export async function getClass(id: string) {
  return queryOne<ClassRow>('classes', id);
}

export async function createClass(values: {
  class_name: string;
  course_code: string;
  department?: string;
  section?: string;
  description?: string;
  professor_id?: string;
}) {
  // Prefer secure RPC so professor_id comes from the JWT, not the client.
  const rpc = await insforge.database.rpc('create_class', {
    p_class_name: values.class_name,
    p_course_code: values.course_code,
    p_department: values.department || null,
    p_section: values.section || null,
    p_description: values.description || null,
  });

  if (!rpc.error) {
    return {
      data: rpc.data ? [rpc.data as ClassRow] : null,
      error: null,
    };
  }

  // Fallback for environments where the RPC is not applied yet.
  return insertRow('classes', {
    class_name: values.class_name,
    course_code: values.course_code,
    department: values.department || null,
    section: values.section || null,
    description: values.description || null,
    professor_id: values.professor_id,
    join_code: generateJoinCode(values.course_code),
  });
}

export async function createDocument(values: Record<string, unknown>) {
  return insertRow('documents', values);
}

export async function recordDownload(documentId: string, studentId: string) {
  return insertRow('document_downloads', {
    document_id: documentId,
    student_id: studentId,
  });
}

export async function recordView(documentId: string, studentId: string) {
  return insertRow('document_views', {
    document_id: documentId,
    student_id: studentId,
  });
}

export async function listBookmarks(studentId: string) {
  return queryTable<BookmarkRow>('bookmarks', (query) =>
    query.eq('student_id', studentId).order('created_at', { ascending: false }),
  );
}

export async function findBookmark(documentId: string, studentId: string) {
  try {
    const result = await insforge.database
      .from('bookmarks')
      .select()
      .eq('document_id', documentId)
      .eq('student_id', studentId)
      .maybeSingle();
    return {
      data: (result.data as BookmarkRow) || null,
      error: result.error ? asError(result.error) : null,
    };
  } catch (error) {
    return { data: null, error: asError(error) };
  }
}

export async function addBookmark(documentId: string, studentId: string) {
  return insertRow('bookmarks', {
    document_id: documentId,
    student_id: studentId,
  });
}

export async function removeBookmark(bookmarkId: string) {
  return deleteRow('bookmarks', bookmarkId);
}

export function fileBucket() {
  return insforge.storage.from('documents');
}
