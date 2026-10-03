import { CheckType, Verdict } from '../enums';
import type { Parameter } from '../parameter/parameter';

/** всё, что нужно проверкам, сервис собирает это из базы */
export interface CheckContext {
  parameter: Parameter;
  value: number;
  /** тот же параметр на других станциях района в тот же срок */
  neighborValues: number[];
  /** последние принятые значения этой станции, по ним ищем выбросы */
  stationHistory: number[];
}

/** результат одной проверки */
export class CheckOutcome {
  constructor(
    readonly type: CheckType,
    readonly verdict: Verdict,
    readonly note: string,
    readonly deviation: number | null = null,
    readonly referenceValue: number | null = null,
  ) {}

  get isSuspect(): boolean {
    return this.verdict === Verdict.SUSPECT;
  }
}

/**
 * общая часть всех проверок: каждая проверка пишет свой evaluate,
 * а run одинаковый и округляет числа в результате до точности параметра
 */
export abstract class QualityCheck {
  abstract readonly type: CheckType;

  run(ctx: CheckContext): CheckOutcome {
    const raw = this.evaluate(ctx);
    const round = (n: number | null) => (n === null ? null : ctx.parameter.normalize(n));
    return new CheckOutcome(raw.type, raw.verdict, raw.note, round(raw.deviation), round(raw.referenceValue));
  }

  protected abstract evaluate(ctx: CheckContext): CheckOutcome;

  protected normal(note: string, deviation: number | null = null, reference: number | null = null) {
    return new CheckOutcome(this.type, Verdict.NORMAL, note, deviation, reference);
  }

  protected suspect(note: string, deviation: number | null = null, reference: number | null = null) {
    return new CheckOutcome(this.type, Verdict.SUSPECT, note, deviation, reference);
  }
}
