import { type ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { LoadingPage } from '@/components/loading-page';
import { useCampusSession } from '@/hooks/use-campus';
import { getPendingRole } from '@/lib/role';

/** Protects app routes: requires auth + a campus role profile. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { user, profile, isLoading, refresh } = useCampusSession();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setLocation('/');
      return;
    }
    if (!profile?.role) {
      if (getPendingRole()) {
        void refresh();
        return;
      }
      setLocation('/choose-role');
    }
  }, [isLoading, user, profile, setLocation, refresh]);

  if (isLoading) return <LoadingPage />;
  if (!user) return null;
  if (!profile?.role) return <LoadingPage />;

  return <>{children}</>;
}
