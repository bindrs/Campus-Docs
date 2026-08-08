import { type ReactNode, useState } from 'react';
import {
  Bell,
  ChevronRight,
  CircleHelp,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Search,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Logo } from '@/components/logo';
import { useCampusSession } from '@/hooks/use-campus';
import { initials } from '@/lib/format';
import { insforge } from '@/lib/insforge';
import { isProfessor } from '@/lib/role';

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, displayName } = useCampusSession();
  const professor = isProfessor(profile?.role);

  const nav = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/classes', label: 'My classes', icon: GraduationCap },
    ...(professor ? [{ href: '/analytics', label: 'Analytics', icon: TrendingUp }] : []),
  ];

  return (
    <div className="min-h-[100dvh] bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col bg-sidebar px-5 py-6 text-sidebar-foreground transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo dark />
          <button
            onClick={() => setMobileOpen(false)}
            data-testid="button-close-menu"
            className="rounded-lg p-2 text-white/60 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[.06] p-3">
          <div className="flex items-center gap-3">
            <span className="avatar border border-white/10 bg-[hsl(var(--sidebar-primary))] text-sidebar">
              {initials(displayName || user?.profile?.name)}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold">
                {displayName || user?.profile?.name || 'Your profile'}
              </div>
              <div className="truncate text-[11px] text-white/50">
                {professor ? 'Professor workspace' : 'Student workspace'}
              </div>
            </div>
            <MoreHorizontal className="ml-auto h-4 w-4 text-white/40" />
          </div>
        </div>

        <div className="mt-8 font-mono text-[10px] uppercase tracking-[.16em] text-white/35">
          Workspace
        </div>
        <nav className="mt-3 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                location === href
                  ? 'bg-white/10 text-white'
                  : 'text-white/55 hover:bg-white/[.06] hover:text-white'
              }`}
            >
              <Icon
                className={`h-[17px] w-[17px] ${location === href ? 'text-sidebar-primary' : ''}`}
              />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 font-mono text-[10px] uppercase tracking-[.16em] text-white/35">
          Account
        </div>
        <nav className="mt-3 space-y-1">
          <Link
            href="/profile"
            data-testid="link-nav-profile"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
              location === '/profile'
                ? 'bg-white/10 text-white'
                : 'text-white/55 hover:bg-white/[.06] hover:text-white'
            }`}
          >
            <UserRound className="h-[17px] w-[17px]" />
            Profile
          </Link>
          <button
            onClick={() =>
              void insforge.auth.signOut().then(() => {
                window.location.href = '/';
              })
            }
            data-testid="button-signout"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/55 hover:bg-white/[.06] hover:text-white"
          >
            <LogOut className="h-[17px] w-[17px]" />
            Sign out
          </button>
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[.06] p-4">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CircleHelp className="h-4 w-4 text-sidebar-primary" />
            Need a hand?
          </div>
          <p className="mt-2 text-xs leading-relaxed text-white/50">
            We keep the busywork out of the way.
          </p>
          <button
            data-testid="button-help"
            className="mt-3 text-xs font-bold text-sidebar-primary hover:underline"
          >
            Visit help centre
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          aria-label="Close navigation"
          data-testid="button-overlay-menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-sidebar/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-border/70 bg-background/85 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              data-testid="button-open-menu"
              className="rounded-xl p-2 hover:bg-muted lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <span>Workspace</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-semibold text-foreground">
                {location === '/dashboard' ? 'Overview' : location.slice(1).split('/')[0]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              data-testid="button-search"
              className="hidden items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground sm:flex"
            >
              <Search className="h-4 w-4" />
              Search
              <kbd className="ml-3 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘ K</kbd>
            </button>
            <button
              data-testid="button-notifications"
              className="relative rounded-xl p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
            </button>
            <Link
              href="/profile"
              data-testid="link-header-profile"
              className="avatar bg-[hsl(var(--secondary))] text-foreground"
            >
              {initials(displayName || user?.profile?.name)}
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
