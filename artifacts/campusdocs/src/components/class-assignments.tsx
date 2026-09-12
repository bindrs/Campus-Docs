import { FormEvent, useState } from 'react';
import { CalendarClock, ClipboardList, Plus } from 'lucide-react';
import type { AssignmentRow } from '@/lib/insforge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/empty-state';

type AssignmentValues = {
  title: string;
  instructions: string;
  deadline: string;
  totalMarks: string;
};

function formatDeadline(value?: string | null) {
  if (!value) return 'No deadline';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function ClassAssignments({
  assignments,
  canManage,
  onCreate,
  saving,
}: {
  assignments: AssignmentRow[];
  canManage: boolean;
  onCreate: (values: AssignmentValues) => Promise<boolean>;
  saving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [deadline, setDeadline] = useState('');
  const [totalMarks, setTotalMarks] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !instructions.trim()) return;
    const created = await onCreate({
      title: title.trim(),
      instructions: instructions.trim(),
      deadline,
      totalMarks,
    });
    if (!created) return;
    setTitle('');
    setInstructions('');
    setDeadline('');
    setTotalMarks('');
    setOpen(false);
  };

  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Keep instructions and deadlines in one place for the class.
        </p>
        {canManage && (
          <Button onClick={() => setOpen(true)} className="shrink-0 rounded-full">
            <Plus /> New assignment
          </Button>
        )}
      </div>

      {assignments.length ? (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <article key={assignment.id} className="surface p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[hsl(var(--accent)/.12)] text-accent">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-bold">{assignment.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {assignment.instructions}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatDeadline(assignment.deadline)}
                    </span>
                    {assignment.total_marks != null && (
                      <span className="rounded-full bg-muted px-3 py-1.5">
                        {assignment.total_marks} marks
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title={canManage ? 'No assignments yet' : 'No assignments'}
          body={
            canManage
              ? 'Create an assignment with instructions and an optional deadline.'
              : 'Your professor has not posted any assignments yet.'
          }
          action={
            canManage ? (
              <Button onClick={() => setOpen(true)} className="rounded-full">
                <Plus /> Create assignment
              </Button>
            ) : undefined
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">New assignment</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4 pt-2">
            <label className="block text-xs font-bold">
              Title
              <Input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Reading response · Week 5"
                className="mt-1.5 rounded-xl"
              />
            </label>
            <label className="block text-xs font-bold">
              Instructions
              <Textarea
                required
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder="Explain what students should submit..."
                className="mt-1.5 min-h-28 rounded-xl"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-bold">
                Deadline
                <Input
                  type="datetime-local"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  className="mt-1.5 rounded-xl"
                />
              </label>
              <label className="block text-xs font-bold">
                Total marks
                <Input
                  type="number"
                  min="0"
                  value={totalMarks}
                  onChange={(event) => setTotalMarks(event.target.value)}
                  placeholder="Optional"
                  className="mt-1.5 rounded-xl"
                />
              </label>
            </div>
            <Button disabled={saving} type="submit" className="h-11 w-full rounded-xl">
              {saving ? 'Publishing…' : 'Publish assignment'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}