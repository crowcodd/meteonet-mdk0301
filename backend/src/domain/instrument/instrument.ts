import { InstrumentRole, InstrumentState } from '../enums';
import { DomainError, InvalidTransitionError } from '../errors';

export interface InstrumentProps {
  id: number;
  name: string;
  stationId: number;
  role: InstrumentRole;
  state: InstrumentState;
  nextVerificationAt: Date;
  parameterIds: number[];
}

export interface StateChange {
  from: InstrumentState;
  to: InstrumentState;
}

/** прибор на станции: что меряет, в каком состоянии, основной или резерв и когда поверка */
export class Instrument {
  static readonly VERIFICATION_WARNING_DAYS = 30;

  private state_: InstrumentState;
  private role_: InstrumentRole;
  private readonly changes: StateChange[] = [];

  constructor(private readonly props: InstrumentProps) {
    this.state_ = props.state;
    this.role_ = props.role;
  }

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get stationId() { return this.props.stationId; }
  get state() { return this.state_; }
  get role() { return this.role_; }

  isVerificationOverdue(now = new Date()): boolean {
    return this.props.nextVerificationAt.getTime() < now.getTime();
  }

  isVerificationDueSoon(now = new Date()): boolean {
    const days = (this.props.nextVerificationAt.getTime() - now.getTime()) / 86_400_000;
    return days >= 0 && days <= Instrument.VERIFICATION_WARNING_DAYS;
  }

  /** мерить можно только исправным прибором своей станции и только тот параметр, который он умеет */
  assertCanMeasure(stationId: number, parameterId: number): void {
    if (this.props.stationId !== stationId) {
      throw new DomainError(`Прибор «${this.name}» не закреплён за станцией`);
    }
    if (this.state_ !== InstrumentState.IN_SERVICE) {
      throw new DomainError(`Прибор «${this.name}» не в работе (${this.state_})`);
    }
    if (!this.props.parameterIds.includes(parameterId)) {
      throw new DomainError(`Прибор «${this.name}» не измеряет выбранный параметр`);
    }
  }

  markBroken(): void {
    if (this.state_ !== InstrumentState.IN_SERVICE) {
      throw new InvalidTransitionError('Прибор', this.state_, InstrumentState.BROKEN);
    }
    this.changes.push({ from: this.state_, to: InstrumentState.BROKEN });
    this.state_ = InstrumentState.BROKEN;
  }

  /** резервный прибор становится основным вместо сломанного */
  takeOverFrom(broken: Instrument): void {
    if (this.role_ !== InstrumentRole.RESERVE) {
      throw new DomainError(`Прибор «${this.name}» не резервный`);
    }
    if (this.state_ !== InstrumentState.IN_SERVICE) {
      throw new DomainError(`Резервный прибор «${this.name}» не в работе`);
    }
    if (this.stationId !== broken.stationId) {
      throw new DomainError('Резервный прибор должен быть на той же станции');
    }
    const shared = broken.props.parameterIds.some((id) => this.props.parameterIds.includes(id));
    if (!shared) {
      throw new DomainError(`Резервный прибор «${this.name}» не измеряет параметры неисправного`);
    }
    this.role_ = InstrumentRole.PRIMARY;
  }

  pullChanges(): StateChange[] {
    return this.changes.splice(0);
  }
}
