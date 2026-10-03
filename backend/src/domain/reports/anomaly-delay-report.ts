import { CheckType, MeasurementStatus } from '../enums';

/** замер вместе с итогами его проверок, из таких строк строится отчёт */
export interface ReportMeasurement {
  stationId: number;
  stationCode: string;
  stationName: string;
  observedAt: Date;
  receivedAt: Date;
  delayed: boolean;
  status: MeasurementStatus;
  currentRevision: number;
  /** какие проверки хоть раз что-то заподозрили, на любой ревизии */
  suspectTypes: CheckType[];
  /** возвращали ли замер наблюдателю на перепроверку */
  rechecked: boolean;
}

export interface StationRow {
  stationId: number;
  stationCode: string;
  stationName: string;
  total: number;
  flagged: number;
  flaggedRange: number;
  flaggedNeighbors: number;
  flaggedOutlier: number;
  confirmedAfterRecheck: number;
  correctedAfterRecheck: number;
  rejected: number;
  /** доля ложных срабатываний: замер пометили, но потом приняли с тем же значением */
  falsePositiveShare: number | null;
  delayedCount: number;
  delayTotalMin: number;
  delayAvgMin: number | null;
  /** самая долгая задержка, по ней видно, сколько станция была без связи */
  maxOutageMin: number;
}

export interface DailyRow {
  date: string;
  flagged: number;
  delayed: number;
}

export type ReportTotals = Omit<StationRow, 'stationId' | 'stationCode' | 'stationName'>;

export interface TopStation {
  stationCode: string;
  stationName: string;
  flagged: number;
}

export interface AnomalyDelayReportResult {
  from: Date;
  to: Date;
  stations: StationRow[];
  totals: ReportTotals;
  daily: DailyRow[];
  topStation: TopStation | null;
}

const minutes = (ms: number) => Math.round(ms / 60_000);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** отчёт по выбросам и задержанным передачам, считает всё в памяти и в базу не ходит */
export class AnomalyDelayReport {
  constructor(
    private readonly from: Date,
    private readonly to: Date,
  ) {}

  build(items: ReportMeasurement[]): AnomalyDelayReportResult {
    const byStation = new Map<number, ReportMeasurement[]>();
    for (const m of items) {
      const list = byStation.get(m.stationId) ?? [];
      list.push(m);
      byStation.set(m.stationId, list);
    }

    const stations = [...byStation.values()]
      .map((list) => ({
        stationId: list[0]!.stationId,
        stationCode: list[0]!.stationCode,
        stationName: list[0]!.stationName,
        ...this.aggregate(list),
      }))
      .sort((a, b) => a.stationCode.localeCompare(b.stationCode));

    const top = stations.reduce<StationRow | null>((best, s) => (s.flagged > (best?.flagged ?? 0) ? s : best), null);

    return {
      from: this.from,
      to: this.to,
      stations,
      totals: this.aggregate(items),
      daily: this.daily(items),
      topStation: top ? { stationCode: top.stationCode, stationName: top.stationName, flagged: top.flagged } : null,
    };
  }

  private aggregate(list: ReportMeasurement[]): ReportTotals {
    const flagged = list.filter((m) => m.suspectTypes.length > 0);
    const byType = (t: CheckType) => flagged.filter((m) => m.suspectTypes.includes(t)).length;
    const rechecked = flagged.filter((m) => m.rechecked);
    const falsePositives = flagged.filter((m) => m.status === MeasurementStatus.ACCEPTED && m.currentRevision === 1);
    const delays = list.filter((m) => m.delayed).map((m) => m.receivedAt.getTime() - m.observedAt.getTime());
    const delayTotal = delays.reduce((s, d) => s + d, 0);

    return {
      total: list.length,
      flagged: flagged.length,
      flaggedRange: byType(CheckType.RANGE),
      flaggedNeighbors: byType(CheckType.NEIGHBORS),
      flaggedOutlier: byType(CheckType.OUTLIER),
      confirmedAfterRecheck: rechecked.filter((m) => m.currentRevision === 1).length,
      correctedAfterRecheck: rechecked.filter((m) => m.currentRevision > 1).length,
      rejected: list.filter((m) => m.status === MeasurementStatus.REJECTED).length,
      falsePositiveShare: flagged.length ? round2(falsePositives.length / flagged.length) : null,
      delayedCount: delays.length,
      delayTotalMin: minutes(delayTotal),
      delayAvgMin: delays.length ? minutes(delayTotal / delays.length) : null,
      maxOutageMin: minutes(Math.max(0, ...delays)),
    };
  }

  private daily(items: ReportMeasurement[]): DailyRow[] {
    const days = new Map<string, DailyRow>();
    for (const m of items) {
      const date = m.observedAt.toISOString().slice(0, 10);
      const row = days.get(date) ?? { date, flagged: 0, delayed: 0 };
      if (m.suspectTypes.length) row.flagged += 1;
      if (m.delayed) row.delayed += 1;
      days.set(date, row);
    }
    return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  }
}
