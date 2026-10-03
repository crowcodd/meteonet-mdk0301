import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MeasurementStatus } from '@/domain/enums';
import { DomainError } from '@/domain/errors';
import { Measurement } from '@/domain/measurement/measurement';
import { Parameter } from '@/domain/parameter/parameter';
import type { Prisma } from '@/generated/prisma/client';
import type { AuthUser } from '../auth/auth.decorators';
import { AuditService } from '../audit/audit.service';
import { toDomainInstrument } from '../instruments/instrument.mapper';
import { PrismaService, type Tx } from '../prisma/prisma.service';
import type {
  BatchItemDto,
  BatchResultItemDto,
  CreateMeasurementDto,
  ListMeasurementsQuery,
  MeasurementDto,
  RecheckDto,
} from './measurement.dto';
import { measurementInclude, toMeasurementDto } from './measurement.mapper';
import { QualityControlService } from './quality-control.service';

/** насколько часы клиента могут спешить, прежде чем мы скажем, что срок в будущем */
const CLOCK_SKEW_MS = 10 * 60_000;

export type ReviewAction = 'return' | 'accept' | 'reject';

@Injectable()
export class MeasurementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qc: QualityControlService,
    private readonly audit: AuditService,
  ) {}

  // действия наблюдателя

  async submit(user: AuthUser, dto: CreateMeasurementDto): Promise<MeasurementDto> {
    const id = await this.prisma.$transaction((tx) => this.create(tx, user, dto, false));
    return this.getById(id);
  }

  /** пакет из очереди: каждую запись сохраняем в своей транзакции, чтобы одна ошибка не роняла весь пакет */
  async submitBatch(user: AuthUser, items: BatchItemDto[]): Promise<BatchResultItemDto[]> {
    const results: BatchResultItemDto[] = [];
    for (const item of items) {
      try {
        const measurementId = await this.prisma.$transaction((tx) => this.create(tx, user, item, true));
        results.push({ clientId: item.clientId, status: 'created', measurementId });
      } catch (e) {
        if (e instanceof DuplicateMeasurementError) {
          results.push({ clientId: item.clientId, status: 'duplicate', measurementId: e.existingId });
        } else if (e instanceof DomainError) {
          results.push({ clientId: item.clientId, status: 'error', error: e.message });
        } else {
          throw e;
        }
      }
    }
    return results;
  }

  async listForStation(user: AuthUser, limit = 50): Promise<MeasurementDto[]> {
    return this.list({ stationId: this.stationOf(user) }, limit);
  }

  async listReturned(user: AuthUser): Promise<MeasurementDto[]> {
    return this.list({ stationId: this.stationOf(user), status: MeasurementStatus.RETURNED }, 200);
  }

  async recheck(user: AuthUser, id: number, dto: RecheckDto): Promise<MeasurementDto> {
    const stationId = this.stationOf(user);
    await this.prisma.$transaction(async (tx) => {
      const row = await tx.measurement.findUnique({
        where: { id },
        include: { parameter: true, station: { select: { districtId: true } } },
      });
      if (!row) throw new NotFoundException('Замер не найден');
      if (row.stationId !== stationId) throw new ForbiddenException('Замер другой станции');

      const parameter = new Parameter(row.parameter);
      const m = Measurement.restore({ id: row.id, status: row.status as MeasurementStatus, value: row.value, revision: row.currentRevision });

      const corrected = m.recheck(parameter.normalize(dto.value), dto.reason);
      if (corrected) {
        await tx.measurementRevision.create({
          data: { measurementId: id, revision: m.revision, value: m.value, reason: dto.reason, authorId: user.id },
        });
      }
      await this.qc.checkAndApply(tx, { id, stationId, districtId: row.station.districtId, observedAt: row.observedAt }, parameter, m);
      await this.save(tx, id, m, user.id);
    });
    return this.getById(id);
  }

  // действия руководителя

  async listAll(query: ListMeasurementsQuery): Promise<MeasurementDto[]> {
    return this.list({ stationId: query.stationId, status: query.status }, query.limit ?? 50);
  }

  async listAnomalies(): Promise<MeasurementDto[]> {
    return this.list({ status: MeasurementStatus.FLAGGED }, 500);
  }

  async review(actor: AuthUser, id: number, action: ReviewAction, comment: string): Promise<MeasurementDto> {
    await this.prisma.$transaction(async (tx) => {
      const row = await tx.measurement.findUnique({ where: { id } });
      if (!row) throw new NotFoundException('Замер не найден');
      const m = Measurement.restore({ id, status: row.status as MeasurementStatus, value: row.value, revision: row.currentRevision });

      if (action === 'return') m.returnToStation(comment);
      else if (action === 'accept') m.accept(comment);
      else m.reject(comment);

      await this.save(tx, id, m, actor.id);
    });
    return this.getById(id);
  }

  // внутренние методы

  private async create(tx: Tx, user: AuthUser, dto: CreateMeasurementDto, delayed: boolean): Promise<number> {
    const stationId = this.stationOf(user);
    const observedAt = new Date(dto.observedAt);
    if (observedAt.getTime() > Date.now() + CLOCK_SKEW_MS) {
      throw new DomainError('Срок наблюдения не может быть в будущем');
    }

    const [paramRow, instrumentRow, station] = await Promise.all([
      tx.parameter.findUnique({ where: { id: dto.parameterId } }),
      tx.instrument.findUnique({ where: { id: dto.instrumentId }, include: { parameters: true } }),
      tx.station.findUniqueOrThrow({ where: { id: stationId }, select: { districtId: true } }),
    ]);
    if (!paramRow) throw new DomainError('Параметр не найден');
    if (!instrumentRow) throw new DomainError('Прибор не найден');

    const parameter = new Parameter(paramRow);
    toDomainInstrument(instrumentRow).assertCanMeasure(stationId, parameter.id);

    const existing = await tx.measurement.findUnique({
      where: { stationId_parameterId_observedAt: { stationId, parameterId: parameter.id, observedAt } },
      select: { id: true },
    });
    if (existing) throw new DuplicateMeasurementError(existing.id);

    const m = Measurement.receive(parameter.normalize(dto.value));
    const row = await tx.measurement.create({
      data: {
        stationId,
        parameterId: parameter.id,
        instrumentId: instrumentRow.id,
        observedAt,
        delayed,
        status: m.status,
        value: m.value,
        currentRevision: m.revision,
        revisions: { create: { revision: m.revision, value: m.value, authorId: user.id } },
      },
    });

    await this.qc.checkAndApply(tx, { id: row.id, stationId, districtId: station.districtId, observedAt }, parameter, m);
    await this.save(tx, row.id, m, user.id, delayed ? 'Задержанная передача' : undefined);
    return row.id;
  }

  /** сохраняет замер и записывает в журнал все смены статуса */
  private async save(tx: Tx, id: number, m: Measurement, actorId: number, firstComment?: string) {
    await tx.measurement.update({
      where: { id },
      data: { status: m.status, value: m.value, currentRevision: m.revision },
    });
    const changes = m.pullChanges().map((c, i) => ({ ...c, comment: c.comment ?? (i === 0 ? firstComment : undefined) }));
    await this.audit.record(tx, 'Measurement', id, changes, actorId);
  }

  private async list(where: Prisma.MeasurementWhereInput, take: number): Promise<MeasurementDto[]> {
    const rows = await this.prisma.measurement.findMany({
      where,
      include: measurementInclude,
      orderBy: [{ observedAt: 'desc' }, { id: 'desc' }],
      take,
    });
    const history = await this.prisma.auditLog.findMany({
      where: { entity: 'Measurement', entityId: { in: rows.map((r) => r.id) } },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => toMeasurementDto(r, history));
  }

  private async getById(id: number): Promise<MeasurementDto> {
    const [dto] = await this.list({ id }, 1);
    if (!dto) throw new NotFoundException('Замер не найден');
    return dto;
  }

  private stationOf(user: AuthUser): number {
    if (!user.stationId) throw new ForbiddenException('Пользователь не привязан к станции');
    return user.stationId;
  }
}

class DuplicateMeasurementError extends DomainError {
  constructor(readonly existingId: number) {
    super('Замер за этот срок уже передан');
  }
}
