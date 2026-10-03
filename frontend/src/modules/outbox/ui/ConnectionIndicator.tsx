'use client';

import { cn } from '@/lib/cn';
import { useConnection, useOutbox } from '../hooks/useOutbox';

export function ConnectionIndicator() {
  const { online } = useConnection();
  const queued = useOutbox().length;
  return (
    <span className="flex items-center gap-2 text-[13px] text-ink-2" aria-live="polite">
      <span className={cn('size-2 rounded-full', online ? 'bg-good' : 'bg-bad')} />
      <span className="hidden sm:inline">{online ? 'На связи' : 'Нет связи'}</span>
      {queued > 0 && <span className="rounded-full bg-warn-soft px-2 py-0.5 font-mono text-[12px] text-warn">{queued}</span>}
    </span>
  );
}
