import type { InstrumentRole, InstrumentState } from '@/domain/enums';
import { Instrument } from '@/domain/instrument/instrument';

interface InstrumentRecord {
  id: number;
  name: string;
  stationId: number;
  role: string;
  state: string;
  nextVerificationAt: Date;
  parameters: { parameterId: number }[];
}

export function toDomainInstrument(row: InstrumentRecord): Instrument {
  return new Instrument({
    id: row.id,
    name: row.name,
    stationId: row.stationId,
    role: row.role as InstrumentRole,
    state: row.state as InstrumentState,
    nextVerificationAt: row.nextVerificationAt,
    parameterIds: row.parameters.map((p) => p.parameterId),
  });
}
