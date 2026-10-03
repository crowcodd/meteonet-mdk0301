import { ArrowRight, CheckCircle, Warning } from '@phosphor-icons/react/ssr';
import type { Measurement } from '@/api';
import { formatDateTime, formatValue } from '@/shared/format';
import { CHECK_LABEL, STATUS_LABEL } from '@/shared/labels';

/** результаты проверок текущей ревизии */
export function ChecksList({ measurement: m }: { measurement: Measurement }) {
  const { precision, unit } = m.parameter;
  return (
    <ul className="grid gap-2 sm:grid-cols-3">
      {m.checks.map((c) => {
        const suspect = c.verdict === 'SUSPECT';
        return (
          <li key={c.id} className={suspect ? 'rounded-xl bg-warn-soft/70 px-3.5 py-3' : 'rounded-xl bg-canvas/70 px-3.5 py-3'}>
            <div className="flex items-center gap-1.5 text-[13px] font-medium">
              {suspect ? <Warning size={16} className="text-warn" /> : <CheckCircle size={16} className="text-good" />}
              {CHECK_LABEL[c.type]}
            </div>
            <p className="mt-1 text-[13px] leading-snug text-ink-2">{c.note}</p>
            {c.referenceValue !== null && (
              <p className="mt-1.5 font-mono text-[12px] text-ink-3">
                эталон {formatValue(c.referenceValue, precision, unit)}, откл. {formatValue(c.deviation, precision, unit)}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const label = (s: string) => STATUS_LABEL[s as keyof typeof STATUS_LABEL] ?? s;

/** ревизии и журнал смены статусов */
export function MeasurementHistory({ measurement: m }: { measurement: Measurement }) {
  const { precision, unit } = m.parameter;
  return (
    <div className="grid gap-6 text-[13px] sm:grid-cols-2">
      <div>
        <div className="mb-2 font-medium text-ink-2">Ревизии</div>
        <ul className="flex flex-col gap-2">
          {m.revisions.map((r) => (
            <li key={r.revision} className="text-ink-2">
              <span className="font-mono text-ink">
                {r.revision}. {formatValue(r.value, precision, unit)}
              </span>
              <span className="text-ink-3">, {r.author}, {formatDateTime(r.createdAt)}</span>
              {r.reason && <div className="text-ink-3">«{r.reason}»</div>}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="mb-2 font-medium text-ink-2">Статусы</div>
        <ul className="flex flex-col gap-2">
          {m.history.map((h, i) => (
            <li key={i}>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[12px] text-ink-3">{formatDateTime(h.createdAt)}</span>
                {h.fromState && (
                  <>
                    <span className="text-ink-3">{label(h.fromState)}</span>
                    <ArrowRight size={12} className="text-ink-3" />
                  </>
                )}
                <span className="font-medium">{label(h.toState)}</span>
              </div>
              {h.comment && <div className="text-ink-3">{h.comment}</div>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
