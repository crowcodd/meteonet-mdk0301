import type { CheckType, MeasurementStatus, Verdict } from '@/domain/enums';
import type { Prisma } from '@/generated/prisma/client';
import type { MeasurementDto } from './measurement.dto';

export const measurementInclude = {
  station: { select: { id: true, code: true, name: true } },
  parameter: { select: { id: true, code: true, name: true, unit: true, precision: true } },
  instrument: { select: { id: true, name: true } },
  checks: { orderBy: { id: 'asc' } },
  revisions: { orderBy: { revision: 'asc' }, include: { author: { select: { fullName: true } } } },
} satisfies Prisma.MeasurementInclude;

type Row = Prisma.MeasurementGetPayload<{ include: typeof measurementInclude }>;
type AuditRow = { entityId: number; fromState: string | null; toState: string; comment: string | null; createdAt: Date };

export function toMeasurementDto(m: Row, history: AuditRow[] = []): MeasurementDto {
  return {
    id: m.id,
    station: m.station,
    parameter: m.parameter,
    instrument: m.instrument,
    observedAt: m.observedAt,
    receivedAt: m.receivedAt,
    delayed: m.delayed,
    status: m.status as MeasurementStatus,
    value: m.value,
    currentRevision: m.currentRevision,
    checks: m.checks
      .filter((c) => c.revision === m.currentRevision)
      .map((c) => ({
        id: c.id,
        revision: c.revision,
        type: c.type as CheckType,
        verdict: c.verdict as Verdict,
        deviation: c.deviation,
        referenceValue: c.referenceValue,
        note: c.note,
        createdAt: c.createdAt,
      })),
    revisions: m.revisions.map((r) => ({
      revision: r.revision,
      value: r.value,
      reason: r.reason,
      author: r.author.fullName,
      createdAt: r.createdAt,
    })),
    history: history
      .filter((h) => h.entityId === m.id)
      .map(({ fromState, toState, comment, createdAt }) => ({ fromState, toState, comment, createdAt })),
  };
}
