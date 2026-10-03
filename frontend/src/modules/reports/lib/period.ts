import type { ReportPeriod } from '@/api';

const DAY = 86_400_000;

export function defaultPeriod(days = 30): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to.getTime() - days * DAY);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

/** переводим даты из полей в ISO, конец периода берём до конца дня включительно */
export function toApiPeriod({ from, to }: { from: string; to: string }): ReportPeriod {
  return { from: new Date(`${from}T00:00:00`).toISOString(), to: new Date(`${to}T23:59:59`).toISOString() };
}
