import { CheckCircle, Info, Warning } from '@phosphor-icons/react/ssr';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** скелетон повторяет форму списка, чтобы при загрузке ничего не прыгало */
export function Skeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 px-5 py-4', className)} aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4">
          <div className="h-3.5 w-24 rounded-full bg-ink/[0.07]" />
          <div className="h-3.5 flex-1 rounded-full bg-ink/[0.05]" />
          <div className="h-3.5 w-16 rounded-full bg-ink/[0.07]" />
        </div>
      ))}
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-[46ch] text-sm text-ink-3">{hint}</p>}
    </div>
  );
}

const TONES = {
  danger: { box: 'bg-bad-soft text-bad', Icon: Warning },
  success: { box: 'bg-good-soft text-good', Icon: CheckCircle },
  info: { box: 'bg-accent-soft text-accent-strong', Icon: Info },
};

export function Alert({ tone = 'danger', children, className }: { tone?: keyof typeof TONES; children: ReactNode; className?: string }) {
  const { box, Icon } = TONES[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex animate-rise items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm', box, className)}
    >
      <Icon size={18} className="mt-px shrink-0" />
      <div>{children}</div>
    </div>
  );
}
