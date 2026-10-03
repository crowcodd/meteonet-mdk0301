import type { ReactNode } from 'react';

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      {children}
      {error ? (
        <span className="text-[13px] text-bad">{error}</span>
      ) : hint ? (
        <span className="text-[13px] text-ink-3">{hint}</span>
      ) : null}
    </label>
  );
}
