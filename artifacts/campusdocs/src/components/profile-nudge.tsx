import { UserRound } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export function ProfileNudge() {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[hsl(var(--accent)/.25)] bg-[hsl(var(--accent)/.08)] p-4 sm:flex-row sm:items-center">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[hsl(var(--accent)/.15)] text-accent">
        <UserRound className="h-5 w-5" />
      </span>
      <div className="flex-1">
        <div className="text-sm font-bold">Make this space yours</div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Complete your profile so classmates know who they’re learning with.
        </p>
      </div>
      <Button
        asChild
        data-testid="button-complete-profile"
        variant="outline"
        size="sm"
        className="rounded-full border-accent/30 text-accent"
      >
        <Link href="/profile">Complete profile</Link>
      </Button>
    </div>
  );
}
