import { Body, Controller, Get, Module, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@/domain/enums';
import { type AuthUser, CurrentUser, Roles } from '../auth/auth.decorators';
import { FailureDto, InstrumentDto, ListInstrumentsQuery, ReportFailureDto } from './instrument.dto';
import { InstrumentsService } from './instruments.service';

@ApiTags('instruments')
@ApiBearerAuth()
@Controller()
export class InstrumentsController {
  constructor(private readonly service: InstrumentsService) {}

  @Get('instruments')
  @ApiOkResponse({ type: [InstrumentDto] })
  list(@CurrentUser() user: AuthUser, @Query() query: ListInstrumentsQuery) {
    return this.service.list(user, query.stationId);
  }

  @Post('instruments/:id/failure')
  @Roles(Role.OBSERVER)
  @ApiOkResponse({ type: FailureDto })
  reportFailure(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number, @Body() dto: ReportFailureDto) {
    return this.service.reportFailure(user, id, dto);
  }

  @Get('failures')
  @ApiOkResponse({ type: [FailureDto] })
  listFailures(@CurrentUser() user: AuthUser) {
    return this.service.listFailures(user);
  }
}

@Module({ controllers: [InstrumentsController], providers: [InstrumentsService] })
export class InstrumentsModule {}
