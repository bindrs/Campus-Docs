import { type FormEvent, useState } from 'react';
import { ArrowRight, GraduationCap, Plus, Search } from 'lucide-react';
import { ClassCard } from '@/components/class-card';
import { EmptyState } from '@/components/empty-state';
import { LoadingPage } from '@/components/loading-page';
import { PageIntro } from '@/components/page-intro';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCampusSession, useMyClasses } from '@/hooks/use-campus';
import { useToast } from '@/hooks/use-toast';
import { createClass, joinClassByCode } from '@/lib/insforge';
import { isProfessor, isStudent } from '@/lib/role';

export function Classes() {
  const { user, profile } = useCampusSession();
  const professor = isProfessor(profile?.role);
  const student = isStudent(profile?.role);
  const [search, setSearch] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const classesQuery = useMyClasses(!!user && !!profile?.role);

  const classes = classesQuery.data.filter((item) =>
    `${item.class_name} ${item.course_code} ${item.department || ''}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const join = async () => {
    if (!joinCode.trim()) return;
    if (!student) {
      toast({
        title: 'Students only',
        description: 'Only student accounts can join classes with a code.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    const result = await joinClassByCode(joinCode.trim().toUpperCase());
    setSaving(false);
    if (result.error) {
      toast({
        title: 'That code didn’t work',
        description: result.error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Class joined', description: 'You can now open documents for this class.' });
      setJoinOpen(false);
      setJoinCode('');
      void classesQuery.refresh();
    }
  };

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!professor || !user?.id) {
      toast({
        title: 'Professors only',
        description: 'Only professor accounts can create classes.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const result = await createClass({
      class_name: String(form.get('name') || ''),
      course_code: String(form.get('code') || ''),
      department: String(form.get('department') || '') || undefined,
      section: String(form.get('section') || '') || undefined,
      description: String(form.get('description') || '') || undefined,
      professor_id: user.id,
    });
    setSaving(false);
    if (result.error) {
      toast({
        title: 'Could not create class',
        description: result.error.message,
        variant: 'destructive',
      });
    } else {
      const created = Array.isArray(result.data) ? result.data[0] : result.data;
      toast({
        title: 'Class created',
        description: created?.join_code
          ? `Share join code ${created.join_code} with your students.`
          : 'Your class is ready.',
      });
      setCreateOpen(false);
      void classesQuery.refresh();
    }
  };

  if (classesQuery.isLoading) return <LoadingPage />;

  return (
    <div className="animate-in fade-in duration-500">
      <PageIntro
        eyebrow={professor ? 'Teaching' : 'Learning'}
        title="My classes"
        description={
          professor
            ? 'Create a class, share the join code, then upload documents for enrolled students.'
            : 'Join with a professor’s code. You’ll only see documents shared to that class.'
        }
        action={
          <div className="flex gap-2">
            {student && (
              <Button
                onClick={() => setJoinOpen(true)}
                data-testid="button-open-join-class"
                className="rounded-full"
              >
                <ArrowRight className="rotate-[-45deg]" />
                Join with code
              </Button>
            )}
            {professor && (
              <Button
                onClick={() => setCreateOpen(true)}
                data-testid="button-open-create-class"
                className="rounded-full"
              >
                <Plus />
                Create class
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            data-testid="input-search-classes"
            placeholder="Search by course, name, or department"
            className="h-10 rounded-xl border-border bg-card pl-10"
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {classes.map((item, index) => (
          <ClassCard item={item} index={index} key={item.id} />
        ))}
        {!classes.length && (
          <EmptyState
            icon={GraduationCap}
            title={professor ? 'No classes yet' : 'You haven’t joined a class'}
            body={
              professor
                ? 'Create a class to get a join code for your students.'
                : 'Ask your professor for the class join code, then enroll here.'
            }
            action={
              professor ? (
                <Button onClick={() => setCreateOpen(true)} className="rounded-full">
                  <Plus /> Create class
                </Button>
              ) : (
                <Button onClick={() => setJoinOpen(true)} className="rounded-full">
                  Join with code
                </Button>
              )
            }
          />
        )}
      </div>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent data-testid="dialog-join-class" className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Join a class</DialogTitle>
          </DialogHeader>
          <div className="pt-2">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Enter the join code from your professor. After joining, documents for that class
              appear in your workspace.
            </p>
            <Input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              data-testid="input-join-code"
              placeholder="Enter class code"
              className="mt-5 h-12 rounded-xl text-center font-mono text-lg uppercase tracking-[.15em]"
            />
            <Button
              disabled={saving || !joinCode}
              onClick={join}
              data-testid="button-submit-join-class"
              className="mt-3 h-11 w-full rounded-xl"
            >
              {saving ? 'Joining…' : 'Join class'} <ArrowRight />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent data-testid="dialog-create-class" className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Create a class</DialogTitle>
          </DialogHeader>
          <form onSubmit={create} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
              <label className="text-xs font-bold">
                Class name
                <Input
                  required
                  name="name"
                  data-testid="input-create-class-name"
                  placeholder="Cognitive Science"
                  className="mt-1.5 rounded-xl"
                />
              </label>
              <label className="text-xs font-bold">
                Course code
                <Input
                  required
                  name="code"
                  data-testid="input-create-class-code"
                  placeholder="PSY 204"
                  className="mt-1.5 rounded-xl"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold">
                Department
                <Input
                  name="department"
                  data-testid="input-create-class-department"
                  placeholder="Psychology"
                  className="mt-1.5 rounded-xl"
                />
              </label>
              <label className="text-xs font-bold">
                Section
                <Input
                  name="section"
                  data-testid="input-create-class-section"
                  placeholder="A"
                  className="mt-1.5 rounded-xl"
                />
              </label>
            </div>
            <label className="block text-xs font-bold">
              Description
              <Textarea
                name="description"
                data-testid="input-create-class-description"
                placeholder="What will students explore?"
                className="mt-1.5 rounded-xl"
              />
            </label>
            <Button
              disabled={saving}
              type="submit"
              data-testid="button-submit-create-class"
              className="h-11 w-full rounded-xl"
            >
              {saving ? 'Creating…' : 'Create class'} <Plus />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
