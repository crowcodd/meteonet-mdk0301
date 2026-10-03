import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ReportQuery {
  @ApiPropertyOptional({ description: 'Начало периода (ISO), по умолчанию −30 дней' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Конец периода (ISO), по умолчанию сейчас' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class ReportTotalsDto {
  @ApiProperty() total: number;
  @ApiProperty() flagged: number;
  @ApiProperty() flaggedRange: number;
  @ApiProperty() flaggedNeighbors: number;
  @ApiProperty() flaggedOutlier: number;
  @ApiProperty() confirmedAfterRecheck: number;
  @ApiProperty() correctedAfterRecheck: number;
  @ApiProperty() rejected: number;
  @ApiProperty({ type: Number, nullable: true }) falsePositiveShare: number | null;
  @ApiProperty() delayedCount: number;
  @ApiProperty() delayTotalMin: number;
  @ApiProperty({ type: Number, nullable: true }) delayAvgMin: number | null;
  @ApiProperty() maxOutageMin: number;
}

export class ReportStationRowDto extends ReportTotalsDto {
  @ApiProperty() stationId: number;
  @ApiProperty() stationCode: string;
  @ApiProperty() stationName: string;
}

export class ReportDailyRowDto {
  @ApiProperty() date: string;
  @ApiProperty() flagged: number;
  @ApiProperty() delayed: number;
}

export class ReportTopStationDto {
  @ApiProperty() stationCode: string;
  @ApiProperty() stationName: string;
  @ApiProperty() flagged: number;
}

export class AnomalyDelayReportDto {
  @ApiProperty() from: Date;
  @ApiProperty() to: Date;
  @ApiProperty({ type: [ReportStationRowDto] }) stations: ReportStationRowDto[];
  @ApiProperty({ type: ReportTotalsDto }) totals: ReportTotalsDto;
  @ApiProperty({ type: [ReportDailyRowDto] }) daily: ReportDailyRowDto[];
  @ApiProperty({ type: ReportTopStationDto, nullable: true }) topStation: ReportTopStationDto | null;
}
