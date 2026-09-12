import { Bell, Check, CheckCheck } from 'lucide-react';
import type { NotificationRow } from '@/lib/insforge';
import { formatDate } from '@/lib/format';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function NotificationsPopover({
  notifications,
  onRead,
}: {
  notifications: NotificationRow[];
  onRead: (notification: NotificationRow) => void;
}) {
  const unread = notifications.filter((notification) => !notification.is_read);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={unread.length ? `${unread.length} unread notifications` : 'Notifications'}
          data-testid="button-notifications"
          className="relative rounded-xl p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread.length > 0 && (
            <span className="absolute right-1.5 top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
              {unread.length > 9 ? '9+' : unread.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="font-display font-bold">Notifications</h2>
            <p className="text-xs text-muted-foreground">
              {unread.length ? `${unread.length} unread` : 'You’re all caught up'}
            </p>
          </div>
          {unread.length > 0 && <CheckCheck className="h-4 w-4 text-primary" />}
        </div>
        <div className="max-h-96 overflow-auto p-2">
          {notifications.length ? (
            notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => onRead(notification)}
                className={`flex w-full gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted ${
                  notification.is_read ? 'opacity-65' : 'bg-primary/[.05]'
                }`}
              >
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  {notification.is_read ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{notification.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {notification.body}
                  </span>
                  <span className="mt-1.5 block text-[10px] text-muted-foreground">
                    {formatDate(notification.created_at)}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}