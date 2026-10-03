import { MeasurementStatus as S } from '../enums';
import { DomainError, InvalidTransitionError } from '../errors';
import type { CheckOutcome } from '../quality/quality-check';

/**
 * какие переходы статуса разрешены, назад ходить нельзя
 * из RECHECKED снова в FLAGGED можно, это не откат, а новая проверка уже исправленного значения
 */
const TRANSITIONS: Record<S, readonly S[]> = {
  [S.DRAFT]: [S.RECEIVED],
  [S.RECEIVED]: [S.FLAGGED, S.ACCEPTED],
  [S.FLAGGED]: [S.RETURNED, S.ACCEPTED, S.REJECTED],
  [S.RETURNED]: [S.RECHECKED],
  [S.RECHECKED]: [S.FLAGGED, S.ACCEPTED],
  [S.ACCEPTED]: [],
  [S.REJECTED]: [],
};

export interface StatusChange {
  from: S;
  to: S;
  comment?: string;
}

export interface MeasurementProps {
  id?: number;
  status: S;
  value: number;
  revision: number;
}

/**
 * замер следит за своим статусом, значением и ревизиями и не даёт нарушить правила
 * смены статуса копятся внутри, сервис потом забирает их и пишет в журнал
 */
export class Measurement {
  private status_: S;
  private value_: number;
  private revision_: number;
  private readonly changes: StatusChange[] = [];

  private constructor(readonly id: number | undefined, props: MeasurementProps) {
    this.status_ = props.status;
    this.value_ = props.value;
    this.revision_ = props.revision;
  }

  /** замер только что пришёл в центр, поэтому из черновика сразу переводим в получено */
  static receive(value: number): Measurement {
    const m = new Measurement(undefined, { status: S.DRAFT, value, revision: 1 });
    m.transitionTo(S.RECEIVED);
    return m;
  }

  static restore(props: MeasurementProps): Measurement {
    return new Measurement(props.id, props);
  }

  get status(): S { return this.status_; }
  get value(): number { return this.value_; }
  get revision(): number { return this.revision_; }

  /** если хоть одна проверка что-то заподозрила, помечаем, иначе принимаем */
  applyChecks(outcomes: CheckOutcome[]): void {
    if (this.status_ !== S.RECEIVED && this.status_ !== S.RECHECKED) {
      throw new DomainError(`Проверка возможна только для статусов RECEIVED/RECHECKED, текущий ${this.status_}`);
    }
    const suspects = outcomes.filter((o) => o.isSuspect).map((o) => o.type);
    if (suspects.length > 0) {
      this.transitionTo(S.FLAGGED, `Подозрение: ${suspects.join(', ')}`);
    } else {
      this.transitionTo(S.ACCEPTED, 'Все проверки пройдены');
    }
  }

  returnToStation(comment: string): void {
    this.requireComment(comment);
    this.transitionTo(S.RETURNED, comment);
  }

  /** руководитель разобрался и считает значение верным */
  accept(comment: string): void {
    this.requireComment(comment);
    this.transitionTo(S.ACCEPTED, comment);
  }

  reject(comment: string): void {
    this.requireComment(comment);
    this.transitionTo(S.REJECTED, comment);
  }

  /**
   * наблюдатель перепроверил замер: если значение поменялось, заводим новую ревизию,
   * если нет, просто считаем его подтверждённым
   * @returns true, если появилась новая ревизия
   */
  recheck(newValue: number, reason: string): boolean {
    this.requireComment(reason);
    const corrected = newValue !== this.value_;
    this.transitionTo(S.RECHECKED, corrected ? `Исправлено: ${reason}` : `Подтверждено: ${reason}`);
    if (corrected) {
      this.value_ = newValue;
      this.revision_ += 1;
    }
    return corrected;
  }

  pullChanges(): StatusChange[] {
    return this.changes.splice(0);
  }

  static canTransition(from: S, to: S): boolean {
    return TRANSITIONS[from].includes(to);
  }

  private transitionTo(next: S, comment?: string): void {
    if (!Measurement.canTransition(this.status_, next)) {
      throw new InvalidTransitionError('Замер', this.status_, next);
    }
    this.changes.push({ from: this.status_, to: next, comment });
    this.status_ = next;
  }

  private requireComment(text: string): void {
    if (!text || !text.trim()) throw new DomainError('Нужно указать обоснование');
  }
}
