import { Skeleton } from '@/components/ui/skeleton';

export function LoadingPage() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-2/3 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} className="h-36 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
