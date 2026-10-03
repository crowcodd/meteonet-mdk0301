import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CheckType, MeasurementStatus, Verdict } from '@/domain/enums';

// что приходит от клиента

export class CreateMeasurementDto {
  @ApiProperty() @IsInt() @IsPositive() parameterId: number;
  @ApiProperty() @IsInt() @IsPositive() instrumentId: number;
  @ApiProperty({ description: 'Срок наблюдения, ISO 8601' }) @IsDateString() observedAt: string;
  @ApiProperty() @IsNumber({ allowNaN: false, allowInfinity: false }) value: number;
}

export class BatchItemDto extends CreateMeasurementDto {
  @ApiProperty({ description: 'Локальный id записи в очереди клиента' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  clientId: string;
}

export class BatchDto {
  @ApiProperty({ type: [BatchItemDto] })
  @ValidateNested({ each: true })
  @Type(() => BatchItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  items: BatchItemDto[];
}

export class RecheckDto {
  @ApiProperty() @IsNumber({ allowNaN: false, allowInfinity: false }) value: number;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(500) reason: string;
}

export class ListMeasurementsQuery {
  @ApiPropertyOptional({ enum: MeasurementStatus, enumName: 'MeasurementStatus' })
  @IsOptional()
  @IsIn(Object.values(MeasurementStatus))
  status?: MeasurementStatus;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @IsPositive() stationId?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

// что отдаём клиенту

export class RefStationDto {
  @ApiProperty() id: number;
  @ApiProperty() code: string;
  @ApiProperty() name: string;
}

export class RefParameterDto {
  @ApiProperty() id: number;
  @ApiProperty() code: string;
  @ApiProperty() name: string;
  @ApiProperty() unit: string;
  @ApiProperty() precision: number;
}

export class RefInstrumentDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
}

export class CheckResultDto {
  @ApiProperty() id: number;
  @ApiProperty() revision: number;
  @ApiProperty({ enum: CheckType, enumName: 'CheckType' }) type: CheckType;
  @ApiProperty({ enum: Verdict, enumName: 'Verdict' }) verdict: Verdict;
  @ApiProperty({ type: Number, nullable: true }) deviation: number | null;
  @ApiProperty({ type: Number, nullable: true }) referenceValue: number | null;
  @ApiProperty() note: string;
  @ApiProperty() createdAt: Date;
}

export class RevisionDto {
  @ApiProperty() revision: number;
  @ApiProperty() value: number;
  @ApiProperty({ type: String, nullable: true }) reason: string | null;
  @ApiProperty() author: string;
  @ApiProperty() createdAt: Date;
}

export class HistoryEntryDto {
  @ApiProperty({ type: String, nullable: true }) fromState: string | null;
  @ApiProperty() toState: string;
  @ApiProperty({ type: String, nullable: true }) comment: string | null;
  @ApiProperty() createdAt: Date;
}

export class MeasurementDto {
  @ApiProperty() id: number;
  @ApiProperty({ type: RefStationDto }) station: RefStationDto;
  @ApiProperty({ type: RefParameterDto }) parameter: RefParameterDto;
  @ApiProperty({ type: RefInstrumentDto }) instrument: RefInstrumentDto;
  @ApiProperty() observedAt: Date;
  @ApiProperty() receivedAt: Date;
  @ApiProperty() delayed: boolean;
  @ApiProperty({ enum: MeasurementStatus, enumName: 'MeasurementStatus' }) status: MeasurementStatus;
  @ApiProperty() value: number;
  @ApiProperty() currentRevision: number;
  @ApiProperty({ type: [CheckResultDto], description: 'Проверки текущей ревизии' }) checks: CheckResultDto[];
  @ApiProperty({ type: [RevisionDto] }) revisions: RevisionDto[];
  @ApiProperty({ type: [HistoryEntryDto] }) history: HistoryEntryDto[];
}

export const BATCH_ITEM_STATUSES = ['created', 'duplicate', 'error'] as const;

export class BatchResultItemDto {
  @ApiProperty() clientId: string;
  @ApiProperty({ enum: BATCH_ITEM_STATUSES }) status: (typeof BATCH_ITEM_STATUSES)[number];
  @ApiPropertyOptional() measurementId?: number;
  @ApiPropertyOptional() error?: string;
}

export class BatchResultDto {
  @ApiProperty({ type: [BatchResultItemDto] }) items: BatchResultItemDto[];
}

export class CommentDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(500) comment: string;
}
