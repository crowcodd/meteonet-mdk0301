import { Global, Injectable, Module } from '@nestjs/common';
import type { Tx } from '../prisma/prisma.service';

interface Change {
  from: string | null;
  to: string;
  comment?: string;
}

/** пишет в журнал, когда меняется статус замера или состояние прибора */
@Injectable()
export class AuditService {
  async record(tx: Tx, entity: 'Measurement' | 'Instrument', entityId: number, changes: Change[], actorId: number | null) {
    if (changes.length === 0) return;
    await tx.auditLog.createMany({
      data: changes.map((c) => ({
        entity,
        entityId,
        fromState: c.from,
        toState: c.to,
        comment: c.comment ?? null,
        actorId,
      })),
    });
  }
}

@Global()
@Module({ providers: [AuditService], exports: [AuditService] })
export class AuditModule {}
