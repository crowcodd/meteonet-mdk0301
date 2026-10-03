import { Controller, Get, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { DomainErrorFilter } from './core/domain-error.filter';
import { AuditModule } from './modules/audit/audit.service';
import { Public } from './modules/auth/auth.decorators';
import { AuthModule } from './modules/auth/auth.controller';
import { AuthGuard } from './modules/auth/auth.guard';
import { InstrumentsModule } from './modules/instruments/instruments.controller';
import { MeasurementsModule } from './modules/measurements/measurements.controller';
import { PrismaModule } from './modules/prisma/prisma.service';
import { ReferenceModule } from './modules/reference/reference.controller';
import { ReportsModule } from './modules/reports/reports.controller';

@Controller()
class HealthController {
  @Public()
  @Get('healthz')
  health() {
    return { ok: true };
  }
}

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, ReferenceModule, MeasurementsModule, InstrumentsModule, ReportsModule],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: DomainErrorFilter },
  ],
})
export class AppModule {}
