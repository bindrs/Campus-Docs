import { Library } from 'lucide-react';
import { Link } from 'wouter';

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" data-testid="link-logo" className="flex items-center gap-3">
      <span
        className={`grid h-9 w-9 place-items-center rounded-xl ${
          dark
            ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]'
            : 'bg-primary text-primary-foreground'
        }`}
      >
        <Library className="h-[18px] w-[18px]" />
      </span>
      <span className="font-display text-[17px] font-bold tracking-tight">
        Campus
        <span className={dark ? 'text-[hsl(var(--sidebar-primary))]' : 'text-primary'}>
          Docs
        </span>
      </span>
    </Link>
  );
}
