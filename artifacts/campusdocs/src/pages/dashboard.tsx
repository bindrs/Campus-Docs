import {
  ArrowRight,
  Bookmark,
  ChevronRight,
  ClipboardList,
  CloudUpload,
  FileText,
  GraduationCap,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClassRow } from '@/components/class-card';
import { ErrorState } from '@/components/error-state';
import { LoadingPage } from '@/components/loading-page';
import { PageIntro } from '@/components/page-intro';
import { ProfileNudge } from '@/components/profile-nudge';
import { StatCard } from '@/components/stat-card';
import {
  useCampusSession,
  useMyClasses,
  useRecentDocuments,
} from '@/hooks/use-campus';
import { formatDate, formatSize } from '@/lib/format';
import { isProfessor } from '@/lib/role';

export function Dashboard() {
  const { user, profile, displayName, isLoading, error } = useCampusSession();
  const professor = isProfessor(profile?.role);
  const classesQuery = useMyClasses(!!user && !!profile?.role);
  const docsQuery = useRecentDocuments(!!user && !!profile?.role);

  if (isLoading || classesQuery.isLoading) return <LoadingPage />;
  if (error && !user) return <ErrorState message="We couldn't restore your session." />;

  const classes = classesQuery.data;
  const docs = docsQuery.data;
  const firstName = displayName.split(' ')[0] || (professor ? 'professor' : 'there');

  const stats = professor
    ? [
        { label: 'Your classes', value: classes.length, note: 'Classes you teach', icon: GraduationCap, color: 'primary' },
        { label: 'Documents shared', value: docs.length, note: 'Visible to enrolled students', icon: FileText, color: 'accent' },
        { label: 'Ready to upload', value: classes.length ? 'Yes' : 'Create a class', note: 'Send notes to a class', icon: CloudUpload, color: 'secondary' },
        { label: 'Workspace', value: 'Professor', note: 'Create · upload · share', icon: TrendingUp, color: 'primary' },
      ]
    : [
        { label: 'Joined classes', value: classes.length, note: 'Use a join code to enroll', icon: GraduationCap, color: 'primary' },
        { label: 'Class documents', value: docs.length, note: 'Shared by your professors', icon: FileText, color: 'accent' },
        { label: 'Saved for later', value: '—', note: 'Bookmark from any document', icon: Bookmark, color: 'secondary' },
        { label: 'Workspace', value: 'Student', note: 'Join · read · download', icon: ClipboardList, color: 'primary' },
      ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageIntro
        eyebrow={professor ? 'Professor workspace' : 'Student workspace'}
        title={`Welcome, ${firstName}.`}
        description={
          professor
            ? 'Create classes, share a join code, and upload documents for your students.'
            : 'Join a class with a code, then open documents your professor has shared.'
        }
        action={
          <Button asChild data-testid="button-browse-classes" className="rounded-full">
            <Link href="/classes">
              {professor ? 'Manage classes' : 'My classes'} <ArrowRight />
            </Link>
          </Button>
        }
      />

      {!profile?.full_name && <ProfileNudge />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-[1.38fr_.82fr]">
        <section className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-bold">
                {professor ? 'Recent documents you shared' : 'Documents from your classes'}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {professor
                  ? 'Students in each class can open these files.'
                  : 'Only documents from classes you joined appear here.'}
              </p>
            </div>
            <Link
              href="/classes"
              data-testid="link-view-all-classes"
              className="text-xs font-bold text-primary hover:underline"
            >
              View classes
            </Link>
          </div>
          <div className="divide-y divide-border/60">
            {docs.slice(0, 5).map((doc, index) => (
              <Link
                href={`/documents/${doc.id}`}
                key={doc.id}
                data-testid={`row-recent-document-${doc.id}`}
                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                    index % 2
                      ? 'bg-[hsl(var(--accent)/.12)] text-accent'
                      : 'bg-[hsl(var(--primary)/.1)] text-primary'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold group-hover:text-primary">{doc.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{doc.file_type || 'Document'}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{formatSize(doc.file_size)}</span>
                  </div>
                </div>
                <div className="hidden text-right text-xs text-muted-foreground sm:block">
                  {formatDate(doc.uploaded_at)}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
            {!docs.length && (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                {professor
                  ? 'No documents yet. Open a class and upload your first file.'
                  : 'No documents yet. Join a class to see materials your professor shares.'}
              </div>
            )}
          </div>
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">Your classes</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {professor ? 'Classes you created.' : 'Classes you joined.'}
              </p>
            </div>
            <Link
              href="/classes"
              data-testid="link-dashboard-classes"
              className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-foreground hover:bg-primary hover:text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 space-y-2">
            {classes.slice(0, 4).map((item, index) => (
              <ClassRow key={item.id} item={item} index={index} />
            ))}
            {!classes.length && (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-xs text-muted-foreground">
                {professor ? 'Create your first class to get a join code.' : 'Join a class with the code from your professor.'}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="mt-5">
        <div className="surface relative overflow-hidden bg-sidebar p-5 text-sidebar-foreground sm:p-6">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full border-[20px] border-sidebar-primary/20" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge className="border-0 bg-sidebar-primary text-sidebar-primary-foreground">
                {professor ? 'Professor tip' : 'Student tip'}
              </Badge>
              <p className="mt-3 max-w-2xl font-display text-xl font-semibold leading-snug">
                {professor
                  ? 'Share your join code with students. Only they can see the documents you upload.'
                  : 'Ask your professor for the class join code. Documents appear after you enroll.'}
              </p>
            </div>
            <Button asChild className="rounded-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
              <Link href="/classes">{professor ? 'Create or open a class' : 'Join a class'}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
