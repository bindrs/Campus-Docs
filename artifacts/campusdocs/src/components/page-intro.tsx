import type { ReactNode } from 'react';

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <div className="font-mono text-[10px] font-medium uppercase tracking-[.18em] text-primary">
          {eyebrow}
        </div>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.045em] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
