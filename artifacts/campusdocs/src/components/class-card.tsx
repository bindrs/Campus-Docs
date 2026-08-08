import { ArrowRight, BookOpen, Users } from 'lucide-react';
import { Link } from 'wouter';
import type { CampusClass } from '@/hooks/use-campus';

export function ClassCard({ item, index }: { item: CampusClass; index: number }) {
  const colors = ['bg-[#dfead8]', 'bg-[#f8dfd2]', 'bg-[#f3e8bd]'];

  return (
    <Link
      href={`/classes/${item.id}`}
      data-testid={`card-class-${item.id}`}
      className="group surface overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className={`relative h-32 ${colors[index % colors.length]} p-5`}>
        <div className="absolute -right-5 -top-10 h-36 w-36 rounded-full border-[22px] border-sidebar/10" />
        <span className="relative rounded-md bg-sidebar px-2 py-1 font-mono text-[10px] font-medium tracking-wider text-white">
          {item.course_code || 'COURSE'}
        </span>
        <div className="absolute bottom-4 left-5 flex items-center gap-2 text-xs font-bold text-sidebar">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Active this semester
        </div>
        <span className="absolute bottom-4 right-5 grid h-8 w-8 place-items-center rounded-full bg-white/65 text-sidebar transition-transform group-hover:translate-x-1">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
      <div className="p-5">
        <h2 className="font-display text-xl font-bold tracking-tight">
          {item.class_name}
        </h2>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {item.description ||
            'Your shared room for notes, questions, and the work in between.'}
        </p>
        <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Class workspace
          </span>
          <span className="font-mono text-[10px]">
            {item.section ? `SEC ${item.section}` : 'CLASS'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ClassRow({
  item,
  index,
}: {
  item: CampusClass;
  index: number;
}) {
  return (
    <Link
      href={`/classes/${item.id}`}
      data-testid={`card-dashboard-class-${item.id}`}
      className="class-row group"
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-lg ${
          index === 0 ? 'bg-[#e9ce86]' : index === 1 ? 'bg-[#efb08f]' : 'bg-[#afc6a9]'
        }`}
      >
        <BookOpen className="h-4 w-4 text-sidebar" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">
          {item.class_name}
        </span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">
          {item.course_code || 'Course'} · Section {item.section || 'A'}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 rotate-[-0deg] text-muted-foreground transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
