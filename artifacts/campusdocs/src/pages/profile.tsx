import { type FormEvent, useState } from 'react';
import { Check, Settings2 } from 'lucide-react';
import { PageIntro } from '@/components/page-intro';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useCampusSession } from '@/hooks/use-campus';
import { useToast } from '@/hooks/use-toast';
import { initials } from '@/lib/format';
import { saveCampusProfile } from '@/lib/insforge';

export function Profile() {
  const { user, profile, displayName, refresh } = useCampusSession();
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const result = await saveCampusProfile(
      user.id,
      {
        full_name: String(form.get('name') || ''),
        department: String(form.get('department') || ''),
        semester: String(form.get('semester') || '') || null,
        roll_number: String(form.get('roll_number') || ''),
        role: profile?.role,
      },
      profile,
    );
    setSaving(false);
    if (result.error) {
      toast({
        title: 'Could not save profile',
        description: result.error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile saved',
        description: 'Your workspace details are up to date.',
      });
      await refresh();
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageIntro
        eyebrow="Account"
        title="Your profile"
        description="Your role was set when you signed in. Students join classes; professors create them and send documents."
      />

      <div className="grid gap-6 lg:grid-cols-[.68fr_1.32fr]">
        <section className="surface relative overflow-hidden bg-sidebar p-6 text-sidebar-foreground sm:p-8">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full border-[35px] border-sidebar-primary/15" />
          <div className="relative">
            <span className="grid h-20 w-20 place-items-center rounded-[1.5rem] bg-sidebar-primary font-display text-2xl font-bold text-sidebar">
              {initials(displayName || user?.profile?.name)}
            </span>
            <h2 className="mt-6 font-display text-2xl font-bold">
              {displayName || 'Complete your profile'}
            </h2>
            <div className="mt-1 text-sm text-white/50">
              {user?.email || 'Sign in to sync your account'}
            </div>
            <Badge className="mt-5 border-0 bg-white/10 text-white">
              {profile?.role === 'professor'
                ? 'Professor'
                : profile?.role === 'student'
                  ? 'Student'
                  : 'Role not set'}
            </Badge>
            <div className="mt-14 border-t border-white/10 pt-5">
              <div className="flex justify-between text-xs">
                <span className="text-white/50">Profile completion</span>
                <span className="font-mono text-sidebar-primary">
                  {profile?.full_name ? '100%' : '70%'}
                </span>
              </div>
              <Progress
                value={profile?.full_name ? 100 : 70}
                className="mt-3 h-1.5 bg-white/10"
              />
            </div>
          </div>
        </section>

        <form onSubmit={save} className="surface p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-border/70 pb-5">
            <div>
              <h2 className="font-display text-xl font-bold">Personal details</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Role can’t be switched after setup. Use a different Google account for the other
                role.
              </p>
            </div>
            <Settings2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-xs font-bold">
              Full name
              <Input
                name="name"
                defaultValue={profile?.full_name || user?.profile?.name || ''}
                data-testid="input-profile-name"
                placeholder="Anika Rao"
                className="mt-1.5 rounded-xl"
              />
            </label>
            <label className="text-xs font-bold">
              Email
              <Input
                value={user?.email || ''}
                readOnly
                data-testid="input-profile-email"
                className="mt-1.5 rounded-xl bg-muted"
              />
            </label>
            <label className="text-xs font-bold">
              Department
              <Input
                name="department"
                defaultValue={String(profile?.department || '')}
                data-testid="input-profile-department"
                placeholder="Psychology"
                className="mt-1.5 rounded-xl"
              />
            </label>
            <label className="text-xs font-bold">
              Semester
              <Input
                name="semester"
                defaultValue={String(profile?.semester || '')}
                data-testid="input-profile-semester"
                placeholder="3"
                className="mt-1.5 rounded-xl"
              />
            </label>
            <label className="text-xs font-bold">
              Student / faculty ID
              <Input
                name="roll_number"
                defaultValue={String(profile?.roll_number || profile?.faculty_id || '')}
                data-testid="input-profile-id"
                placeholder="PSY24-018"
                className="mt-1.5 rounded-xl"
              />
            </label>
            <label className="text-xs font-bold">
              Role
              <Input
                value={
                  profile?.role === 'professor'
                    ? 'Professor'
                    : profile?.role === 'student'
                      ? 'Student'
                      : 'Not set'
                }
                readOnly
                data-testid="input-profile-role"
                className="mt-1.5 rounded-xl bg-muted"
              />
            </label>
          </div>
          <div className="mt-8 flex justify-end">
            <Button
              disabled={saving}
              type="submit"
              data-testid="button-save-profile"
              className="rounded-xl"
            >
              {saving ? 'Saving…' : 'Save changes'} <Check />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
