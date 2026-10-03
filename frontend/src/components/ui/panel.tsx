import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** двойная рамка: светлая подложка снаружи, рабочая поверхность внутри */
export function Panel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-[24px] bg-shell/70 p-1.5 ring-1 ring-line', className)} {...props}>
      <div className="h-full rounded-[18px] bg-surface shadow-[inset_0_1px_0_rgb(255_255_255),0_1px_2px_rgb(21_23_28/0.04)]">
        {children}
      </div>
    </div>
  );
}

export function PanelHeader({ title, note, aside }: { title: string; note?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {note && <p className="mt-1 max-w-[60ch] text-sm text-ink-3">{note}</p>}
      </div>
      {aside}
    </div>
  );
}

export function PanelBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5', className)} {...props} />;
}

export function PageHeader({ title, note, aside }: { title: string; note?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-[28px]">{title}</h1>
        {note && <p className="mt-1.5 max-w-[62ch] text-[15px] text-ink-2">{note}</p>}
      </div>
      {aside}
    </div>
  );
}
