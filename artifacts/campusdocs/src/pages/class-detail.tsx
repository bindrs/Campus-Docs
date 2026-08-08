import { type FormEvent, useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  Bell,
  ClipboardList,
  CloudUpload,
  Plus,
  Upload,
  Users,
} from 'lucide-react';
import { Link, useParams } from 'wouter';
import { DocumentList } from '@/components/document-list';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingPage } from '@/components/loading-page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  useCampusData,
  useCampusSession,
  useRealtimeRefresh,
} from '@/hooks/use-campus';
import { useToast } from '@/hooks/use-toast';
import {
  type ClassRow,
  type DocumentRow,
  createDocument,
  fileBucket,
  getClass,
  listClassDocuments,
} from '@/lib/insforge';
import { isProfessor } from '@/lib/role';

type CampusDocument = DocumentRow;

function TabEmpty({
  tab,
  professor,
  onAction,
}: {
  tab: string;
  professor?: boolean;
  onAction?: () => void;
}) {
  return (
    <div className="mt-5">
      <EmptyState
        icon={tab === 'Members' ? Users : tab === 'Assignments' ? ClipboardList : Bell}
        title={`No ${tab.toLowerCase()} yet`}
        body={
          professor
            ? `You can add ${tab.toLowerCase()} later.`
            : `Nothing here yet for ${tab.toLowerCase()}.`
        }
        action={
          professor && onAction ? (
            <Button
              onClick={onAction}
              data-testid={`button-create-${tab.toLowerCase()}`}
              className="rounded-full"
            >
              <Plus />
              Create {tab.slice(0, -1)}
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

export function ClassDetail() {
  const params = useParams<{ id: string }>();
  const classId = params.id || '';
  const [item, setItem] = useState<ClassRow | null>(null);
  const [classLoading, setClassLoading] = useState(true);
  const [classError, setClassError] = useState<Error | null>(null);
  const [tab, setTab] = useState('Documents');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const { profile, user } = useCampusSession();
  const professor = isProfessor(profile?.role);
  const { toast } = useToast();

  const docsQuery = useCampusData<CampusDocument>(
    () => listClassDocuments(classId),
    [classId],
    !!classId,
  );

  useRealtimeRefresh(docsQuery.refresh, 'documents');

  useEffect(() => {
    if (!classId) return;
    void (async () => {
      setClassLoading(true);
      const result = await getClass(classId);
      setItem(result.data);
      setClassError(result.error);
      setClassLoading(false);
    })();
  }, [classId]);

  const upload = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || !title.trim() || !user?.id || !classId) return;
    if (!professor) {
      toast({
        title: 'Professors only',
        description: 'Only the class professor can upload documents.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    const path = `${user.id}/${classId}/${Date.now()}-${file.name}`;
    const uploaded = await fileBucket().upload(path, file);
    if (uploaded.error || !uploaded.data) {
      toast({
        title: 'Upload failed',
        description: uploaded.error?.message,
        variant: 'destructive',
      });
      setUploading(false);
      return;
    }

    const result = await createDocument({
      title,
      class_id: classId,
      professor_id: user.id,
      file_url: uploaded.data.url,
      file_key: uploaded.data.key,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || 'application/octet-stream',
      file_type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
    });
    setUploading(false);

    if (result.error) {
      toast({
        title: 'Could not save document',
        description: result.error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Document sent',
        description: 'Students in this class can open it now.',
      });
      setUploadOpen(false);
      setFile(null);
      setTitle('');
      void docsQuery.refresh();
    }
  };

  if (classLoading || docsQuery.isLoading) return <LoadingPage />;
  if (classError || !item) {
    return (
      <ErrorState message="This class isn’t available. Join it first, or check the link." />
    );
  }

  const canUpload = professor && item.professor_id === user?.id;

  return (
    <div className="animate-in fade-in duration-500">
      <Link
        href="/classes"
        data-testid="link-back-classes"
        className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary"
      >
        <ArrowRight className="rotate-180" />
        All classes
      </Link>

      <div className="relative overflow-hidden rounded-[1.5rem] bg-sidebar p-6 text-sidebar-foreground sm:p-8">
        <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full border-[32px] border-sidebar-primary/15" />
        <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <div>
            <Badge className="border-0 bg-sidebar-primary text-sidebar-primary-foreground">
              {item.course_code}
            </Badge>
            <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold tracking-[-.05em] sm:text-5xl">
              {item.class_name}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
              {item.description ||
                (professor
                  ? 'Upload documents here for enrolled students.'
                  : 'Documents shared by your professor appear below.')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {canUpload && (
              <div className="rounded-xl border border-white/10 bg-white/[.08] px-4 py-3">
                <div className="font-mono text-[9px] uppercase tracking-[.15em] text-white/45">
                  Student join code
                </div>
                <div className="mt-1 font-mono text-sm font-medium tracking-[.15em] text-sidebar-primary">
                  {item.join_code}
                </div>
              </div>
            )}
            {canUpload && (
              <Button
                onClick={() => setUploadOpen(true)}
                data-testid="button-open-upload"
                className="rounded-xl bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              >
                <Upload />
                Send document
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-1 overflow-auto border-b border-border/70">
        {['Documents', 'Announcements', 'Assignments', 'Members'].map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            data-testid={`tab-class-${name.toLowerCase()}`}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
              tab === name
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {name}
            {name === 'Documents' && (
              <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                {docsQuery.data.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'Documents' ? (
        docsQuery.data.length ? (
          <DocumentList docs={docsQuery.data} />
        ) : (
          <div className="mt-5">
            <EmptyState
              icon={CloudUpload}
              title={canUpload ? 'No documents sent yet' : 'No documents in this class'}
              body={
                canUpload
                  ? 'Upload a file and enrolled students will see it here.'
                  : 'When your professor sends materials, they’ll show up here.'
              }
              action={
                canUpload ? (
                  <Button onClick={() => setUploadOpen(true)} className="rounded-full">
                    <Upload /> Send document
                  </Button>
                ) : undefined
              }
            />
          </div>
        )
      ) : (
        <TabEmpty tab={tab} professor={canUpload} />
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent data-testid="dialog-upload-document" className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Send a document</DialogTitle>
          </DialogHeader>
          <form onSubmit={upload} className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Students who joined this class will be able to open and download this file.
            </p>
            <label className="block text-xs font-bold">
              Document title
              <Input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                data-testid="input-upload-title"
                placeholder="Week 05 · Decision making"
                className="mt-1.5 rounded-xl"
              />
            </label>
            <label
              data-testid="input-upload-file-label"
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/[.04] px-5 py-8 text-center transition-colors hover:bg-primary/[.08]"
            >
              <CloudUpload className="h-7 w-7 text-primary" />
              <span className="mt-3 text-sm font-bold">
                {file ? file.name : 'Choose a file to upload'}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                PDF, DOCX, PPTX, images · up to 50MB
              </span>
              <input
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                data-testid="input-upload-file"
                className="sr-only"
              />
            </label>
            <Button
              disabled={uploading || !file || !title}
              type="submit"
              data-testid="button-submit-upload"
              className="h-11 w-full rounded-xl"
            >
              {uploading ? 'Sending…' : 'Send to class'}{' '}
              <ArrowDownToLine className="rotate-180" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
