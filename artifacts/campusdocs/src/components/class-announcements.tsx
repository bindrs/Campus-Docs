import { FormEvent, useState } from 'react';
import { Megaphone, Plus } from 'lucide-react';
import type { AnnouncementRow } from '@/lib/insforge';
import { formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/empty-state';

type AnnouncementValues = { title: string; message: string };

export function ClassAnnouncements({
  announcements,
  canManage,
  onCreate,
  saving,
}: {
  announcements: AnnouncementRow[];
  canManage: boolean;
  onCreate: (values: AnnouncementValues) => Promise<boolean>;
  saving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !message.trim()) return;
    const created = await onCreate({ title: title.trim(), message: message.trim() });
    if (!created) return;
    setTitle('');
    setMessage('');
    setOpen(false);
  };

  return (
    <div className="mt-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Updates posted here are visible to every enrolled student.
        </p>
        {canManage && (
          <Button onClick={() => setOpen(true)} className="shrink-0 rounded-full">
            <Plus /> New announcement
          </Button>
        )}
      </div>

      {announcements.length ? (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <article key={announcement.id} className="surface p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[hsl(var(--primary)/.1)] text-primary">
                  <Megaphone className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-bold">{announcement.title}</h3>
                    <time className="text-xs text-muted-foreground">
                      {formatDate(announcement.created_at)}
                    </time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {announcement.message}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Megaphone}
          title={canManage ? 'No announcements yet' : 'No announcements'}
          body={
            canManage
              ? 'Share a course update with your enrolled students.'
              : 'Your professor has not posted any class updates yet.'
          }
          action={
            canManage ? (
              <Button onClick={() => setOpen(true)} className="rounded-full">
                <Plus /> Create announcement
              </Button>
            ) : undefined
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">New announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4 pt-2">
            <label className="block text-xs font-bold">
              Title
              <Input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Week 5 class update"
                className="mt-1.5 rounded-xl"
              />
            </label>
            <label className="block text-xs font-bold">
              Message
              <Textarea
                required
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tell students what they need to know..."
                className="mt-1.5 min-h-32 rounded-xl"
              />
            </label>
            <Button disabled={saving} type="submit" className="h-11 w-full rounded-xl">
              {saving ? 'Publishing…' : 'Publish announcement'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}