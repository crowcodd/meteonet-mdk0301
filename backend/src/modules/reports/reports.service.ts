import { BadRequestException, Injectable } from '@nestjs/common';
import { type CheckType, type MeasurementStatus, Verdict } from '@/domain/enums';
import { AnomalyDelayReport, type AnomalyDelayReportResult } from '@/domain/reports/anomaly-delay-report';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_PERIOD_DAYS = 30;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async anomaliesAndDelays(fromIso?: string, toIso?: string): Promise<AnomalyDelayReportResult> {
    const to = toIso ? new Date(toIso) : new Date();
    const from = fromIso ? new Date(fromIso) : new Date(to.getTime() - DEFAULT_PERIOD_DAYS * 86_400_000);
    if (from >= to) throw new BadRequestException('Начало периода должно быть раньше конца');

    const rows = await this.prisma.measurement.findMany({
      where: { observedAt: { gte: from, lte: to } },
      select: {
        id: true,
        observedAt: true,
        receivedAt: true,
        delayed: true,
        status: true,
        currentRevision: true,
        station: { select: { id: true, code: true, name: true } },
        checks: { where: { verdict: Verdict.SUSPECT }, select: { type: true } },
      },
    });

    const recheckedIds = new Set(
      (
        await this.prisma.auditLog.findMany({
          where: { entity: 'Measurement', toState: 'RECHECKED', entityId: { in: rows.map((r) => r.id) } },
          select: { entityId: true },
        })
      ).map((a) => a.entityId),
    );

    return new AnomalyDelayReport(from, to).build(
      rows.map((r) => ({
        stationId: r.station.id,
        stationCode: r.station.code,
        stationName: r.station.name,
        observedAt: r.observedAt,
        receivedAt: r.receivedAt,
        delayed: r.delayed,
        status: r.status as MeasurementStatus,
        currentRevision: r.currentRevision,
        suspectTypes: [...new Set(r.checks.map((c) => c.type as CheckType))],
        rechecked: recheckedIds.has(r.id),
      })),
    );
  }
}
