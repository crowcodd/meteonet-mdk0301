const dateTime = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
const date = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDate = (iso: string) => date.format(new Date(iso));

export function formatValue(value: number | null | undefined, precision: number, unit?: string) {
  if (value === null || value === undefined) return 'нет';
  const s = value.toLocaleString('ru-RU', { minimumFractionDigits: precision, maximumFractionDigits: precision });
  return unit ? `${s} ${unit}` : s;
}

export function formatMinutes(min: number | null) {
  if (min === null) return 'нет';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} ч ${m} мин` : `${m} мин`;
}

/** строка для input type="datetime-local", в локальном времени */
export function toDateTimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** последний прошедший срок наблюдения, сроки идут каждые 3 часа по UTC */
export function lastObservationTerm(now = new Date()) {
  const step = 3 * 3_600_000;
  return new Date(Math.floor(now.getTime() / step) * step);
}
