import { Injectable } from '@nestjs/common';
import { MeasurementStatus } from '@/domain/enums';
import type { Measurement } from '@/domain/measurement/measurement';
import type { Parameter } from '@/domain/parameter/parameter';
import { QualityControl } from '@/domain/quality/quality-control';
import type { CheckContext } from '@/domain/quality/quality-check';
import type { Tx } from '../prisma/prisma.service';

const NEIGHBOR_WINDOW_MS = 90 * 60_000;
const HISTORY_SIZE = 30;

interface Target {
  id: number;
  stationId: number;
  districtId: number;
  observedAt: Date;
}

/**
 * достаёт из базы соседей и историю станции, гоняет проверки и сохраняет результаты,
 * а какой статус поставить, решает сам Measurement
 */
@Injectable()
export class QualityControlService {
  private readonly qc = QualityControl.standard();

  async checkAndApply(tx: Tx, target: Target, parameter: Parameter, measurement: Measurement): Promise<void> {
    const ctx = await this.buildContext(tx, target, parameter, measurement.value);
    const outcomes = this.qc.run(ctx);

    await tx.checkResult.createMany({
      data: outcomes.map((o) => ({
        measurementId: target.id,
        revision: measurement.revision,
        type: o.type,
        verdict: o.verdict,
        deviation: o.deviation,
        referenceValue: o.referenceValue,
        note: o.note,
      })),
    });
    measurement.applyChecks(outcomes);
  }

  private async buildContext(tx: Tx, t: Target, parameter: Parameter, value: number): Promise<CheckContext> {
    const from = new Date(t.observedAt.getTime() - NEIGHBOR_WINDOW_MS);
    const to = new Date(t.observedAt.getTime() + NEIGHBOR_WINDOW_MS);

    const [neighbors, history] = await Promise.all([
      tx.measurement.findMany({
        where: {
          parameterId: parameter.id,
          stationId: { not: t.stationId },
          station: { districtId: t.districtId },
          observedAt: { gte: from, lte: to },
          status: { not: MeasurementStatus.REJECTED },
        },
        select: { stationId: true, value: true, observedAt: true },
      }),
      tx.measurement.findMany({
        where: {
          stationId: t.stationId,
          parameterId: parameter.id,
          observedAt: { lt: t.observedAt },
          status: MeasurementStatus.ACCEPTED,
          id: { not: t.id },
        },
        orderBy: { observedAt: 'desc' },
        take: HISTORY_SIZE,
        select: { value: true },
      }),
    ]);

    // от каждой соседней станции берём одну запись, самую близкую по времени
    const closest = new Map<number, { value: number; gap: number }>();
    for (const n of neighbors) {
      const gap = Math.abs(n.observedAt.getTime() - t.observedAt.getTime());
      const prev = closest.get(n.stationId);
      if (!prev || gap < prev.gap) closest.set(n.stationId, { value: n.value, gap });
    }

    return {
      parameter,
      value,
      neighborValues: [...closest.values()].map((n) => n.value),
      stationHistory: history.map((h) => h.value),
    };
  }
}
