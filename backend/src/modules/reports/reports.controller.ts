import { Controller, Get, Header, Module, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { Role } from '@/domain/enums';
import type { StationRow } from '@/domain/reports/anomaly-delay-report';
import { Roles } from '../auth/auth.decorators';
import { AnomalyDelayReportDto, ReportQuery } from './report.dto';
import { ReportsService } from './reports.service';

const CSV_COLUMNS: [string, (r: StationRow) => string | number | null][] = [
  ['Код станции', (r) => r.stationCode],
  ['Станция', (r) => r.stationName],
  ['Замеров', (r) => r.total],
  ['Помечено', (r) => r.flagged],
  ['Диапазон', (r) => r.flaggedRange],
  ['Соседи', (r) => r.flaggedNeighbors],
  ['Выброс', (r) => r.flaggedOutlier],
  ['Подтверждено после перепроверки', (r) => r.confirmedAfterRecheck],
  ['Исправлено после перепроверки', (r) => r.correctedAfterRecheck],
  ['Отклонено', (r) => r.rejected],
  ['Доля ложных срабатываний', (r) => r.falsePositiveShare],
  ['Задержанных передач', (r) => r.delayedCount],
  ['Суммарная задержка, мин', (r) => r.delayTotalMin],
  ['Средняя задержка, мин', (r) => r.delayAvgMin],
  ['Макс. время без связи, мин', (r) => r.maxOutageMin],
];

function toCsv(rows: StationRow[]): string {
  const escape = (v: string | number | null) => {
    const s = v === null ? '' : String(v);
    // чтобы Excel не принял текст за формулу
    const safe = /^[=+\-@]/.test(s) && typeof v === 'string' ? `'${s}` : s;
    return /[";\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const lines = [CSV_COLUMNS.map(([h]) => h), ...rows.map((r) => CSV_COLUMNS.map(([, get]) => get(r)))];
  // BOM и точка с запятой нужны, чтобы русский Excel открыл файл сразу, без мастера импорта
  return '﻿' + lines.map((l) => l.map(escape).join(';')).join('\r\n');
}

@ApiTags('reports')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('anomalies-delays')
  @ApiOkResponse({ type: AnomalyDelayReportDto })
  anomaliesAndDelays(@Query() q: ReportQuery) {
    return this.service.anomaliesAndDelays(q.from, q.to);
  }

  @Get('anomalies-delays/csv')
  @ApiProduces('text/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="anomalies-delays.csv"')
  async anomaliesAndDelaysCsv(@Query() q: ReportQuery): Promise<string> {
    const report = await this.service.anomaliesAndDelays(q.from, q.to);
    return toCsv(report.stations);
  }
}

@Module({ controllers: [ReportsController], providers: [ReportsService] })
export class ReportsModule {}
