import { useCallback, useEffect, useState } from 'react';
import {
  type ClassRow,
  type DocumentRow,
  type Profile,
  displayName,
  ensureCampusProfile,
  getCurrentUser,
  insforge,
  listMyClasses,
  listRecentDocuments,
  queryTable,
} from '@/lib/insforge';

export function useCampusSession() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getCurrentUser();
    if (result.error) setError(result.error instanceof Error ? result.error : new Error(String(result.error)));
    const currentUser = result.data?.user || null;
    setUser(currentUser);
    if (currentUser?.id) {
      const profileResult = await ensureCampusProfile(currentUser);
      setProfile(profileResult.data);
      if (profileResult.error && !result.error) setError(profileResult.error);
    } else {
      setProfile(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    user,
    profile,
    displayName: displayName(profile, user?.profile?.name),
    isLoading,
    error,
    refresh,
  };
}

export function useCampusData<T>(
  loader: () => Promise<{ data: T[] | null; error: Error | null }>,
  deps: unknown[] = [],
  enabled = true,
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setData([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const result = await loader();
    setData(result.data || []);
    setError(result.error);
    setIsLoading(false);
  }, [enabled, ...deps]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
}

export function useMyClasses(enabled = true) {
  return useCampusData<ClassRow>(() => listMyClasses(), [], enabled);
}

export function useRecentDocuments(enabled = true) {
  return useCampusData<DocumentRow>(() => listRecentDocuments(), [], enabled);
}

export type CampusDocument = DocumentRow;
export type CampusClass = ClassRow;

export function useRealtimeRefresh(refresh: () => void, table: string) {
  useEffect(() => {
    const realtime = (insforge as any).realtime;
    if (!realtime?.channel && !realtime?.subscribe) return;

    let unsubscribe: (() => void) | undefined;

    try {
      if (typeof realtime.channel === 'function') {
        const channel = realtime.channel(`campusdocs-${table}`);
        channel
          ?.on?.('postgres_changes', { event: '*', schema: 'public', table }, refresh)
          ?.subscribe?.();
        unsubscribe = () => channel?.unsubscribe?.();
      }
    } catch {
      // Realtime is optional for the core CRUD flows.
    }

    return () => {
      unsubscribe?.();
    };
  }, [refresh, table]);
}

// Keep a thin wrapper for ad-hoc table queries used by older call sites.
export function useTableQuery<T>(table: string, builder?: (query: any) => any, enabled = true) {
  return useCampusData<T>(() => queryTable<T>(table, builder), [table], enabled);
}
