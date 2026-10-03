import type { Measurement } from '@/api';

/** что написал руководитель, когда последний раз вернул замер */
export function returnComment(m: Measurement): string | null {
  return [...m.history].reverse().find((h) => h.toState === 'RETURNED')?.comment ?? null;
}
