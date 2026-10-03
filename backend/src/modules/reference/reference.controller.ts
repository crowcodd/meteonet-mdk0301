import { Controller, Get, Module } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Role, StationType } from '@/domain/enums';
import { Roles } from '../auth/auth.decorators';
import { PrismaService } from '../prisma/prisma.service';

export class ParameterDto {
  @ApiProperty() id: number;
  @ApiProperty() code: string;
  @ApiProperty() name: string;
  @ApiProperty() unit: string;
  @ApiProperty() minValue: number;
  @ApiProperty() maxValue: number;
  @ApiProperty() precision: number;
  @ApiProperty() neighborTolerance: number;
}

export class StationDto {
  @ApiProperty() id: number;
  @ApiProperty() code: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: StationType, enumName: 'StationType' }) type: StationType;
  @ApiProperty() latitude: number;
  @ApiProperty() longitude: number;
  @ApiProperty() district: string;
}

/** справочники только читаются и логики в них нет, поэтому отдельный сервис не заводили */
@ApiTags('reference')
@ApiBearerAuth()
@Controller()
export class ReferenceController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('parameters')
  @ApiOkResponse({ type: [ParameterDto] })
  parameters(): Promise<ParameterDto[]> {
    return this.prisma.parameter.findMany({ orderBy: { id: 'asc' } });
  }

  @Get('stations')
  @Roles(Role.MANAGER)
  @ApiOkResponse({ type: [StationDto] })
  async stations(): Promise<StationDto[]> {
    const rows = await this.prisma.station.findMany({ include: { district: true }, orderBy: { code: 'asc' } });
    return rows.map(({ district, districtId: _, ...s }) => ({ ...s, type: s.type as StationType, district: district.name }));
  }
}

@Module({ controllers: [ReferenceController] })
export class ReferenceModule {}
