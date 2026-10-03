import { NeighborsCheck, OutlierCheck, RangeCheck } from './checks';
import type { CheckContext, CheckOutcome, QualityCheck } from './quality-check';

/** прогоняет значение через все проверки, новую проверку достаточно добавить в список */
export class QualityControl {
  constructor(private readonly checks: QualityCheck[]) {}

  static standard(): QualityControl {
    return new QualityControl([new RangeCheck(), new NeighborsCheck(), new OutlierCheck()]);
  }

  run(ctx: CheckContext): CheckOutcome[] {
    return this.checks.map((check) => check.run(ctx));
  }
}
