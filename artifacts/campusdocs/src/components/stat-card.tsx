import type { LucideIcon } from 'lucide-react';
import { MoreHorizontal } from 'lucide-react';

export function StatCard({
  label,
  value,
  note,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="surface group p-5 transition-transform duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${
            color === 'accent'
              ? 'bg-[hsl(var(--accent)/.12)] text-accent'
              : color === 'secondary'
                ? 'bg-[hsl(var(--secondary))] text-foreground'
                : 'bg-[hsl(var(--primary)/.1)] text-primary'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <div className="mt-6 font-display text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs font-bold">{label}</div>
      <div className="mt-2 text-[11px] text-muted-foreground">{note}</div>
    </div>
  );
}
