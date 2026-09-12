import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { getAuthRedirectUrl, insforge } from '@/lib/insforge';
import { setPendingRole } from '@/lib/role';

type RoleChoice = 'student' | 'professor';

export function Landing() {
  const { toast } = useToast();
  const [role, setRole] = useState<RoleChoice | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const signIn = async (selected: RoleChoice) => {
    setRole(selected);
    setPendingRole(selected);
    setSigningIn(true);
    const { error } = await insforge.auth.signInWithOAuth('google', {
      redirectTo: getAuthRedirectUrl(),
      additionalParams: { prompt: 'select_account' },
    });
    setSigningIn(false);
    if (error) {
      toast({
        title: 'Could not open Google sign-in',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-[hsl(var(--background))]">
      <div className="relative mx-auto flex min-h-[100dvh] max-w-[1440px] flex-col px-6 py-6 lg:px-12">
        <header className="flex items-center justify-between">
          <Logo />
          <Badge className="rounded-full border border-primary/20 bg-primary/10 text-primary">
            <Sparkles className="h-3.5 w-3.5" /> CampusDocs
          </Badge>
        </header>

        <section className="relative grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="max-w-3xl font-display text-[clamp(2.8rem,6.5vw,5.8rem)] font-semibold leading-[.94] tracking-[-.07em] text-foreground">
              Choose how you
              <br />
              <span className="text-primary">use campus.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Students join classes and read what professors share. Professors create classes and
              send documents to their students.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                data-testid="button-choose-student"
                onClick={() => void signIn('student')}
                disabled={signingIn}
                className={`group rounded-[1.5rem] border p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${
                  role === 'student'
                    ? 'border-primary bg-primary/[.06] shadow-md'
                    : 'border-border bg-card'
                }`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[hsl(var(--primary)/.12)] text-primary">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <div className="mt-5 font-display text-2xl font-bold">I’m a student</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Join with a class code and access documents your professor sends.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary" /> Join classes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary" /> View class documents
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary" /> Download & save notes
                  </li>
                </ul>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">
                  Continue with Google <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              <button
                type="button"
                data-testid="button-choose-professor"
                onClick={() => void signIn('professor')}
                disabled={signingIn}
                className={`group rounded-[1.5rem] border p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg ${
                  role === 'professor'
                    ? 'border-accent bg-accent/[.06] shadow-md'
                    : 'border-border bg-card'
                }`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[hsl(var(--accent)/.14)] text-accent">
                  <Upload className="h-5 w-5" />
                </span>
                <div className="mt-5 font-display text-2xl font-bold">I’m a professor</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Create classes, share a join code, and send documents to students.
                </p>
                <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-accent" /> Create classes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-accent" /> Upload documents
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-accent" /> Share with enrolled students
                  </li>
                </ul>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-accent">
                  Continue with Google <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>

            {signingIn && (
              <p className="mt-4 text-sm text-muted-foreground" data-testid="text-signing-in">
                Opening Google sign-in…
              </p>
            )}
          </div>

          <div className="relative mx-auto hidden w-full max-w-[500px] animate-in fade-in zoom-in-95 duration-1000 lg:block">
            <div className="absolute -inset-8 rounded-[50%] bg-[hsl(var(--accent)/.12)] blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-[#e7efe6] p-4 shadow-xl">
              <div className="rounded-[1.4rem] bg-sidebar p-5 text-sidebar-foreground">
                <div className="flex items-center gap-2">
                  <Logo dark />
                </div>
                <div className="mt-10 grid gap-3">
                  <div className="rounded-2xl bg-[#f5f0df] p-4 text-foreground">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-primary">
                      Professor flow
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-display text-lg font-semibold">Create Cognitive Science</div>
                        <div className="text-xs text-muted-foreground">Join code · MIND-24</div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-white/45">
                      Student access
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#efb08f]" />
                      <div>
                        <div className="text-sm font-bold">Week 04 · Attention & memory</div>
                        <div className="text-xs text-white/50">Only visible to joined students</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/55">
                    <ShieldCheck className="h-4 w-4 text-sidebar-primary" />
                    Class-level privacy keeps documents with the right people.
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/55">
                    <Users className="h-4 w-4 text-sidebar-primary" />
                    One role per account, chosen when you start.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
