import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Download,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Link } from 'wouter';
import { EmptyState } from '@/components/empty-state';
import { PageIntro } from '@/components/page-intro';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCampusSession } from '@/hooks/use-campus';
import { sampleDocs } from '@/lib/sample-data';

export function Analytics() {
  const { profile } = useCampusSession();

  if (profile?.role !== 'professor') {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Professor access only"
        body="Analytics are available to the people teaching the class."
        action={
          <Button asChild data-testid="button-return-dashboard" className="rounded-full">
            <Link href="/dashboard">Back to overview</Link>
          </Button>
        }
      />
    );
  }

  const stats = [
    { value: '1,284', label: 'Total views', delta: '+18.4%', icon: TrendingUp },
    { value: '436', label: 'Downloads', delta: '+9.8%', icon: Download },
    { value: '74%', label: 'Read-through rate', delta: '+4.2%', icon: Activity },
    { value: '32', label: 'Active students', delta: '+3 this week', icon: Users },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <PageIntro
        eyebrow="Professor workspace"
        title="Analytics"
        description="A clear read on what your students are opening, saving, and returning to."
        action={
          <Button data-testid="button-export-analytics" variant="outline" className="rounded-full">
            <ArrowDownToLine />
            Export report
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="surface p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[hsl(var(--primary)/.1)] text-primary">
                <stat.icon className="h-4 w-4" />
              </span>
              <span className="font-mono text-[10px] text-primary">{stat.delta}</span>
            </div>
            <div className="mt-7 font-display text-3xl font-semibold">{stat.value}</div>
            <div className="mt-1 text-xs font-bold">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <section className="surface p-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">Engagement over time</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Views and downloads across all classes.
              </p>
            </div>
            <select
              data-testid="select-analytics-range"
              className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs"
            >
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>This semester</option>
            </select>
          </div>
          <div className="relative mt-10 h-64">
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map((line) => (
                <div key={line} className="border-t border-dashed border-border/70" />
              ))}
            </div>
            <svg
              viewBox="0 0 700 230"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              <path
                d="M0 184 C70 160, 90 176, 140 130 S220 148, 280 110 S350 118, 410 92 S490 106, 540 52 S630 80, 700 28"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M0 210 C75 205, 100 190, 150 180 S240 189, 285 160 S365 170, 420 145 S505 156, 550 120 S630 132, 700 95"
                fill="none"
                stroke="hsl(var(--accent))"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="7 8"
              />
            </svg>
            <div className="absolute inset-x-0 bottom-[-25px] flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>01 FEB</span>
              <span>08 FEB</span>
              <span>15 FEB</span>
              <span>22 FEB</span>
              <span>28 FEB</span>
            </div>
          </div>
          <div className="mt-12 flex gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <i className="h-2 w-2 rounded-full bg-primary" />
              Views
            </span>
            <span className="flex items-center gap-2">
              <i className="h-2 w-2 rounded-full bg-accent" />
              Downloads
            </span>
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="font-display text-lg font-bold">Top documents</h2>
          <p className="mt-1 text-xs text-muted-foreground">Most useful to your students.</p>
          <div className="mt-6 space-y-4">
            {sampleDocs.map((doc, index) => (
              <div key={doc.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-xs font-bold">{doc.title}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {[82, 68, 49][index]}%
                  </span>
                </div>
                <Progress value={[82, 68, 49][index]} className="mt-2 h-1.5 bg-muted" />
              </div>
            ))}
          </div>
          <Button
            asChild
            variant="outline"
            data-testid="button-view-document-analytics"
            className="mt-7 w-full rounded-xl text-xs"
          >
            <Link href="/classes">
              View all documents <ArrowRight />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
