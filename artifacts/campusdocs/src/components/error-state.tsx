import { CircleHelp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';

export function ErrorState({ message }: { message: string }) {
  return (
    <EmptyState
      icon={CircleHelp}
      title="A small detour"
      body={message}
      action={
        <Button
          onClick={() => window.location.reload()}
          data-testid="button-retry"
          className="rounded-full"
        >
          Try again
        </Button>
      }
    />
  );
}
