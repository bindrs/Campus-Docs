import { useEffect, useState } from 'react';
import { ArrowRight, GraduationCap, Upload } from 'lucide-react';
import { useLocation } from 'wouter';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { LoadingPage } from '@/components/loading-page';
import { useCampusSession } from '@/hooks/use-campus';
import { useToast } from '@/hooks/use-toast';
import { saveCampusProfile } from '@/lib/insforge';
import { clearPendingRole, setPendingRole } from '@/lib/role';

export function ChooseRole() {
  const { user, profile, refresh, isLoading } = useCampusSession();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && profile?.role) setLocation('/dashboard');
  }, [isLoading, profile?.role, setLocation]);

  if (isLoading) return <LoadingPage />;

  const choose = async (role: 'student' | 'professor') => {
    if (!user?.id) {
      setPendingRole(role);
      setLocation('/');
      return;
    }
    setSaving(true);
    setPendingRole(role);
    const result = await saveCampusProfile(
      user.id,
      {
        full_name: user.profile?.name || user.email?.split('@')[0] || 'Campus user',
        role,
      },
      profile,
    );
    clearPendingRole();
    setSaving(false);
    if (result.error) {
      toast({
        title: 'Could not set role',
        description: result.error.message,
        variant: 'destructive',
      });
      return;
    }
    await refresh();
    setLocation('/dashboard');
  };

  return (
    <main className="min-h-[100dvh] bg-background px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Logo />
        <h1 className="mt-12 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          One last step
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Tell us whether you’re joining as a student or teaching as a professor. This locks your
          workspace permissions.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Button
            disabled={saving}
            data-testid="button-setup-student"
            variant="outline"
            className="h-auto flex-col items-start gap-3 rounded-2xl p-6 text-left"
            onClick={() => void choose('student')}
          >
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-display text-xl">Student</span>
            <span className="text-xs font-normal text-muted-foreground">
              Join classes and open documents professors send.
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Button>
          <Button
            disabled={saving}
            data-testid="button-setup-professor"
            variant="outline"
            className="h-auto flex-col items-start gap-3 rounded-2xl p-6 text-left"
            onClick={() => void choose('professor')}
          >
            <Upload className="h-6 w-6 text-accent" />
            <span className="font-display text-xl">Professor</span>
            <span className="text-xs font-normal text-muted-foreground">
              Create classes and send documents to your students.
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-accent">
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Button>
        </div>
      </div>
    </main>
  );
}
