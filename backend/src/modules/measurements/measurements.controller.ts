import { Body, Controller, Get, Module, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@/domain/enums';
import { type AuthUser, CurrentUser, Roles } from '../auth/auth.decorators';
import {
  BatchDto,
  BatchResultDto,
  CommentDto,
  CreateMeasurementDto,
  ListMeasurementsQuery,
  MeasurementDto,
  RecheckDto,
} from './measurement.dto';
import { MeasurementsService } from './measurements.service';
import { QualityControlService } from './quality-control.service';

@ApiTags('measurements')
@ApiBearerAuth()
@Controller('measurements')
export class MeasurementsController {
  constructor(private readonly service: MeasurementsService) {}

  @Post()
  @Roles(Role.OBSERVER)
  @ApiOkResponse({ type: MeasurementDto })
  submit(@CurrentUser() user: AuthUser, @Body() dto: CreateMeasurementDto) {
    return this.service.submit(user, dto);
  }

  /** то, что накопилось без связи, считаем задержанной передачей */
  @Post('batch')
  @Roles(Role.OBSERVER)
  @ApiOkResponse({ type: BatchResultDto })
  async submitBatch(@CurrentUser() user: AuthUser, @Body() dto: BatchDto): Promise<BatchResultDto> {
    return { items: await this.service.submitBatch(user, dto.items) };
  }

  @Get('station')
  @Roles(Role.OBSERVER)
  @ApiOkResponse({ type: [MeasurementDto] })
  listForStation(@CurrentUser() user: AuthUser) {
    return this.service.listForStation(user);
  }

  @Get('returned')
  @Roles(Role.OBSERVER)
  @ApiOkResponse({ type: [MeasurementDto] })
  listReturned(@CurrentUser() user: AuthUser) {
    return this.service.listReturned(user);
  }

  @Post(':id/recheck')
  @Roles(Role.OBSERVER)
  @ApiOkResponse({ type: MeasurementDto })
  recheck(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: RecheckDto) {
    return this.service.recheck(user, id, dto);
  }

  @Get()
  @Roles(Role.MANAGER)
  @ApiOkResponse({ type: [MeasurementDto] })
  listAll(@Query() query: ListMeasurementsQuery) {
    return this.service.listAll(query);
  }
}

@ApiTags('anomalies')
@ApiBearerAuth()
@Roles(Role.MANAGER)
@Controller('anomalies')
export class AnomaliesController {
  constructor(private readonly service: MeasurementsService) {}

  @Get()
  @ApiOkResponse({ type: [MeasurementDto] })
  list() {
    return this.service.listAnomalies();
  }

  @Post(':id/return')
  @ApiOkResponse({ type: MeasurementDto })
  returnToStation(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: CommentDto) {
    return this.service.review(user, id, 'return', dto.comment);
  }

  @Post(':id/accept')
  @ApiOkResponse({ type: MeasurementDto })
  accept(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: CommentDto) {
    return this.service.review(user, id, 'accept', dto.comment);
  }

  @Post(':id/reject')
  @ApiOkResponse({ type: MeasurementDto })
  reject(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: CommentDto) {
    return this.service.review(user, id, 'reject', dto.comment);
  }
}

@Module({
  controllers: [MeasurementsController, AnomaliesController],
  providers: [MeasurementsService, QualityControlService],
})
export class MeasurementsModule {}
