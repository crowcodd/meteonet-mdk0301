import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InstrumentRole, InstrumentState, Role } from '@/domain/enums';
import { DomainError } from '@/domain/errors';
import type { AuthUser } from '../auth/auth.decorators';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { FailureDto, InstrumentDto, ReportFailureDto, VerificationStatus } from './instrument.dto';
import { toDomainInstrument } from './instrument.mapper';

const instrumentInclude = {
  station: { select: { id: true, code: true, name: true } },
  parameters: { include: { parameter: { select: { id: true, code: true, name: true, unit: true, precision: true } } } },
} as const;

const failureInclude = {
  instrument: { select: { id: true, name: true, model: true } },
  reserveInstrument: { select: { id: true, name: true, model: true } },
  station: { select: { id: true, code: true, name: true } },
  reportedBy: { select: { fullName: true } },
} as const;

@Injectable()
export class InstrumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** наблюдатель видит только свою станцию, руководитель всю сеть */
  async list(user: AuthUser, stationId?: number): Promise<InstrumentDto[]> {
    const scope = user.role === Role.OBSERVER ? this.stationOf(user) : stationId;
    const rows = await this.prisma.instrument.findMany({
      where: { stationId: scope },
      include: instrumentInclude,
      orderBy: [{ stationId: 'asc' }, { id: 'asc' }],
    });
    const now = new Date();
    return rows.map((r) => {
      const domain = toDomainInstrument(r);
      const verificationStatus: VerificationStatus = domain.isVerificationOverdue(now)
        ? 'OVERDUE'
        : domain.isVerificationDueSoon(now)
          ? 'DUE_SOON'
          : 'OK';
      return {
        id: r.id,
        name: r.name,
        model: r.model,
        station: r.station,
        role: r.role as InstrumentRole,
        state: r.state as InstrumentState,
        commissionedAt: r.commissionedAt,
        nextVerificationAt: r.nextVerificationAt,
        verificationStatus,
        parameters: r.parameters.map((p) => p.parameter),
      };
    });
  }

  /** помечаем прибор неисправным, пишем запись в журнал сбоев и, если указан резерв, переключаемся на него */
  async reportFailure(user: AuthUser, id: number, dto: ReportFailureDto): Promise<FailureDto> {
    const stationId = this.stationOf(user);
    const failureId = await this.prisma.$transaction(async (tx) => {
      const row = await tx.instrument.findUnique({ where: { id }, include: { parameters: true } });
      if (!row) throw new NotFoundException('Прибор не найден');
      if (row.stationId !== stationId) throw new ForbiddenException('Прибор другой станции');

      const broken = toDomainInstrument(row);
      broken.markBroken();

      if (dto.reserveInstrumentId !== undefined) {
        if (dto.reserveInstrumentId === id) throw new DomainError('Прибор не может заменить сам себя');
        const reserveRow = await tx.instrument.findUnique({
          where: { id: dto.reserveInstrumentId },
          include: { parameters: true },
        });
        if (!reserveRow) throw new DomainError('Резервный прибор не найден');
        const reserve = toDomainInstrument(reserveRow);
        reserve.takeOverFrom(broken);
        await tx.instrument.update({ where: { id: reserve.id }, data: { role: reserve.role } });
      }

      await tx.instrument.update({ where: { id }, data: { state: broken.state } });
      await this.audit.record(tx, 'Instrument', id, broken.pullChanges().map((c) => ({ ...c, comment: dto.description })), user.id);

      const failure = await tx.failureLog.create({
        data: {
          instrumentId: id,
          stationId,
          reportedById: user.id,
          description: dto.description,
          reserveInstrumentId: dto.reserveInstrumentId ?? null,
        },
      });
      return failure.id;
    });

    const row = await this.prisma.failureLog.findUniqueOrThrow({ where: { id: failureId }, include: failureInclude });
    return toFailureDto(row);
  }

  async listFailures(user: AuthUser): Promise<FailureDto[]> {
    const where = user.role === Role.OBSERVER ? { stationId: this.stationOf(user) } : {};
    const rows = await this.prisma.failureLog.findMany({ where, include: failureInclude, orderBy: { openedAt: 'desc' } });
    return rows.map(toFailureDto);
  }

  private stationOf(user: AuthUser): number {
    if (!user.stationId) throw new ForbiddenException('Пользователь не привязан к станции');
    return user.stationId;
  }
}

type FailureRow = {
  id: number;
  description: string;
  openedAt: Date;
  closedAt: Date | null;
  instrument: { id: number; name: string; model: string };
  reserveInstrument: { id: number; name: string; model: string } | null;
  station: { id: number; code: string; name: string };
  reportedBy: { fullName: string };
};

function toFailureDto(r: FailureRow): FailureDto {
  return {
    id: r.id,
    instrument: r.instrument,
    reserveInstrument: r.reserveInstrument,
    station: r.station,
    reportedBy: r.reportedBy.fullName,
    description: r.description,
    openedAt: r.openedAt,
    closedAt: r.closedAt,
  };
}
