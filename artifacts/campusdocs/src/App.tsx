import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { AppShell } from '@/components/app-shell';
import { ErrorState } from '@/components/error-state';
import { RequireAuth } from '@/components/require-auth';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Analytics } from '@/pages/analytics';
import { ChooseRole } from '@/pages/choose-role';
import { ClassDetail } from '@/pages/class-detail';
import { Classes } from '@/pages/classes';
import { Dashboard } from '@/pages/dashboard';
import { DocumentPage } from '@/pages/document';
import { Landing } from '@/pages/landing';
import { Profile } from '@/pages/profile';

const queryClient = new QueryClient();

function Shell({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}

function AppRouter() {
  const [location] = useLocation();

  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/choose-role" component={ChooseRole} />
        <Route path="/dashboard">
          <Shell>
            <Dashboard />
          </Shell>
        </Route>
        <Route path="/classes">
          <Shell>
            <Classes />
          </Shell>
        </Route>
        <Route path="/classes/:id">
          <Shell>
            <ClassDetail />
          </Shell>
        </Route>
        <Route path="/documents/:id">
          <Shell>
            <DocumentPage />
          </Shell>
        </Route>
        <Route path="/analytics">
          <Shell>
            <Analytics />
          </Shell>
        </Route>
        <Route path="/profile">
          <Shell>
            <Profile />
          </Shell>
        </Route>
        <Route>
          <ErrorState message="This page does not exist." />
        </Route>
      </Switch>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppRouter />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
