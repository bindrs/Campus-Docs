import { Bookmark, ChevronRight, FileText, FolderOpen } from 'lucide-react';
import { Link } from 'wouter';
import { EmptyState } from '@/components/empty-state';
import type { CampusDocument } from '@/hooks/use-campus';
import { formatDate, formatSize } from '@/lib/format';

export function DocumentList({ docs }: { docs: CampusDocument[] }) {
  return (
    <div className="mt-5 space-y-3">
      {docs.map((doc, index) => (
        <Link
          href={`/documents/${doc.id}`}
          key={doc.id}
          data-testid={`row-class-document-${doc.id}`}
          className="surface group flex items-center gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <span
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${
              index % 2
                ? 'bg-[hsl(var(--accent)/.12)] text-accent'
                : 'bg-[hsl(var(--primary)/.1)] text-primary'
            }`}
          >
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold group-hover:text-primary">{doc.title}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{doc.file_type || 'FILE'}</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>{formatSize(doc.file_size)}</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>{formatDate(doc.uploaded_at)}</span>
            </div>
          </div>
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <Bookmark className="h-4 w-4" />
            Save
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      ))}
      {!docs.length && (
        <EmptyState
          icon={FolderOpen}
          title="This class is still warming up"
          body="When documents arrive, they’ll land here."
        />
      )}
    </div>
  );
}
