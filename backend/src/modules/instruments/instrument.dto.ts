import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { InstrumentRole, InstrumentState } from '@/domain/enums';
import { RefParameterDto, RefStationDto } from '../measurements/measurement.dto';

export const VERIFICATION_STATUSES = ['OK', 'DUE_SOON', 'OVERDUE'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export class ReportFailureDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(1000) description: string;

  @ApiPropertyOptional({ description: 'Резервный прибор, который берёт на себя функции' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  reserveInstrumentId?: number;
}

export class ListInstrumentsQuery {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @IsPositive() stationId?: number;
}

export class InstrumentDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty() model: string;
  @ApiProperty({ type: RefStationDto }) station: RefStationDto;
  @ApiProperty({ enum: InstrumentRole, enumName: 'InstrumentRole' }) role: InstrumentRole;
  @ApiProperty({ enum: InstrumentState, enumName: 'InstrumentState' }) state: InstrumentState;
  @ApiProperty() commissionedAt: Date;
  @ApiProperty() nextVerificationAt: Date;
  @ApiProperty({ enum: VERIFICATION_STATUSES, enumName: 'VerificationStatus' }) verificationStatus: VerificationStatus;
  @ApiProperty({ type: [RefParameterDto] }) parameters: RefParameterDto[];
}

class FailureInstrumentDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty() model: string;
}

export class FailureDto {
  @ApiProperty() id: number;
  @ApiProperty({ type: FailureInstrumentDto }) instrument: FailureInstrumentDto;
  @ApiProperty({ type: FailureInstrumentDto, nullable: true }) reserveInstrument: FailureInstrumentDto | null;
  @ApiProperty({ type: RefStationDto }) station: RefStationDto;
  @ApiProperty() reportedBy: string;
  @ApiProperty() description: string;
  @ApiProperty() openedAt: Date;
  @ApiProperty({ type: Date, nullable: true }) closedAt: Date | null;
}
