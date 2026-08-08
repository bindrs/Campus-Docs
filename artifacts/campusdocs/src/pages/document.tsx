import { useEffect, useState } from 'react';
import {
  Activity,
  Bookmark,
  BookmarkCheck,
  Download,
  FileText,
  MoreHorizontal,
} from 'lucide-react';
import { Link, useParams } from 'wouter';
import { ErrorState } from '@/components/error-state';
import { LoadingPage } from '@/components/loading-page';
import { Button } from '@/components/ui/button';
import { useCampusSession } from '@/hooks/use-campus';
import { useToast } from '@/hooks/use-toast';
import { formatDate, formatSize } from '@/lib/format';
import {
  type DocumentRow,
  addBookmark,
  fileBucket,
  findBookmark,
  getDocument,
  recordDownload,
  recordView,
  removeBookmark,
} from '@/lib/insforge';
import { isStudent } from '@/lib/role';

type CampusDocument = DocumentRow;

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-xs font-bold">{value}</div>
    </div>
  );
}

export function DocumentPage() {
  const params = useParams<{ id: string }>();
  const docId = params.id || '';
  const { user, profile } = useCampusSession();
  const [bookmarkedId, setBookmarkedId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [doc, setDoc] = useState<CampusDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!docId) return;
    void (async () => {
      setLoading(true);
      const result = await getDocument(docId);
      setDoc(result.data);
      setError(result.error);
      setLoading(false);

      if (result.data && user?.id && isStudent(profile?.role)) {
        void recordView(result.data.id, user.id);
        const bookmark = await findBookmark(result.data.id, user.id);
        setBookmarkedId(bookmark.data?.id || null);
      }
    })();
  }, [docId, user?.id, profile?.role]);

  if (loading) return <LoadingPage />;
  if (error || !doc) {
    return (
      <ErrorState message="This document isn’t available. Join the class first, or ask your professor to share it." />
    );
  }

  const download = async () => {
    setDownloading(true);
    let url = doc.file_url;
    if (doc.file_key) {
      const result = await fileBucket().download(doc.file_key);
      if (result.data) url = URL.createObjectURL(result.data);
    }
    if (url) {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = doc.file_name || doc.title;
      anchor.click();
      if (user?.id) void recordDownload(doc.id, user.id);
      toast({
        title: 'Download started',
        description: 'A copy is on its way to your device.',
      });
    } else {
      toast({
        title: 'File unavailable',
        description: 'This document does not have a downloadable file yet.',
        variant: 'destructive',
      });
    }
    setDownloading(false);
  };

  const toggleBookmark = async () => {
    if (!user?.id) return;
    if (bookmarkedId) {
      const result = await removeBookmark(bookmarkedId);
      if (result.error) {
        toast({
          title: 'Could not remove bookmark',
          description: result.error.message,
          variant: 'destructive',
        });
      } else {
        setBookmarkedId(null);
        toast({ title: 'Removed from saved' });
      }
      return;
    }

    const result = await addBookmark(doc.id, user.id);
    if (result.error) {
      toast({
        title: 'Could not save bookmark',
        description: result.error.message,
        variant: 'destructive',
      });
    } else {
      const created = Array.isArray(result.data) ? result.data[0] : result.data;
      setBookmarkedId(created?.id || 'saved');
      toast({ title: 'Saved for later' });
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <Link
        href={`/classes/${doc.class_id}`}
        data-testid="link-back-document-class"
        className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary"
      >
        Back to class
      </Link>

      <div className="grid gap-6 xl:grid-cols-[1.12fr_.88fr]">
        <section className="surface min-h-[520px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[hsl(var(--primary)/.1)] text-primary">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-bold">{doc.file_name || 'document.pdf'}</div>
                <div className="text-[11px] text-muted-foreground">
                  {doc.file_type || 'PDF'} · {formatSize(doc.file_size)}
                </div>
              </div>
            </div>
            <button
              data-testid="button-document-more"
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <div className="flex min-h-[440px] items-center justify-center bg-[#e8e6dd] p-6">
            {doc.file_url && (doc.mime_type || '').includes('pdf') ? (
              <iframe
                title={doc.title}
                src={doc.file_url}
                className="h-[440px] w-full rounded-lg border border-border bg-white"
              />
            ) : (
              <div className="relative aspect-[.72] w-full max-w-[340px] overflow-hidden rounded bg-[#fffdf4] p-8 shadow-xl">
                <div className="font-mono text-[9px] uppercase tracking-[.15em] text-primary">
                  {doc.file_type || 'lecture notes'} · campusdocs
                </div>
                <div className="mt-12 font-display text-4xl font-semibold leading-[.95] tracking-[-.06em] text-sidebar">
                  {doc.title}
                </div>
                <div className="mt-8 h-1 w-12 bg-accent" />
                <p className="mt-8 text-sm text-muted-foreground">
                  Preview isn’t available for this file type. Download to open it.
                </p>
              </div>
            )}
          </div>
        </section>

        <aside>
          <div className="surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">
                  Document details
                </div>
                <h1
                  data-testid={`text-document-title-${doc.id}`}
                  className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-.05em]"
                >
                  {doc.title}
                </h1>
              </div>
              {isStudent(profile?.role) && (
                <button
                  onClick={toggleBookmark}
                  data-testid="button-toggle-bookmark"
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors ${
                    bookmarkedId
                      ? 'bg-[hsl(var(--accent)/.14)] text-accent'
                      : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {bookmarkedId ? (
                    <BookmarkCheck className="h-5 w-5" />
                  ) : (
                    <Bookmark className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {doc.description ||
                'Shared by your professor for this class. Open it here or download a copy.'}
            </p>
            <Button
              disabled={downloading}
              onClick={download}
              data-testid="button-download-document"
              className="mt-6 h-11 w-full rounded-xl"
            >
              {downloading ? 'Preparing file…' : 'Download document'} <Download />
            </Button>
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/70 pt-5">
              <InfoItem label="Uploaded" value={formatDate(doc.uploaded_at)} />
              <InfoItem label="File size" value={formatSize(doc.file_size)} />
              <InfoItem label="Type" value={doc.file_type || 'File'} />
              <InfoItem label="Access" value="Class members only" />
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-[hsl(var(--primary)/.18)] bg-[hsl(var(--primary)/.06)] p-5">
            <div className="flex gap-3">
              <Activity className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="text-sm font-bold">Class-only access</div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Students see this only after joining the class. Professors manage what gets
                  shared.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
