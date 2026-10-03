import { CheckType } from '../enums';
import { CheckOutcome, QualityCheck, type CheckContext } from './quality-check';

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

/** укладывается ли значение в допустимый диапазон параметра */
export class RangeCheck extends QualityCheck {
  readonly type = CheckType.RANGE;

  protected evaluate({ parameter: p, value }: CheckContext): CheckOutcome {
    if (value < p.minValue) {
      return this.suspect(`Ниже минимума ${p.minValue} ${p.unit}`, value - p.minValue, p.minValue);
    }
    if (value > p.maxValue) {
      return this.suspect(`Выше максимума ${p.maxValue} ${p.unit}`, value - p.maxValue, p.maxValue);
    }
    return this.normal(`В диапазоне [${p.minValue}; ${p.maxValue}]`);
  }
}

/** сильно ли значение отличается от среднего по соседним станциям за тот же срок */
export class NeighborsCheck extends QualityCheck {
  readonly type = CheckType.NEIGHBORS;
  static readonly MIN_NEIGHBORS = 2;

  protected evaluate({ parameter: p, value, neighborValues }: CheckContext): CheckOutcome {
    if (neighborValues.length < NeighborsCheck.MIN_NEIGHBORS) {
      return this.normal(`Недостаточно соседних станций (${neighborValues.length}), проверка пропущена`);
    }
    const avg = mean(neighborValues);
    const deviation = value - avg;
    const note = `Среднее по ${neighborValues.length} станциям района`;
    return Math.abs(deviation) > p.neighborTolerance
      ? this.suspect(`${note}; отклонение больше допуска ${p.neighborTolerance} ${p.unit}`, deviation, avg)
      : this.normal(note, deviation, avg);
  }
}

/** не выбивается ли значение из обычного ряда этой станции, считаем через z-оценку */
export class OutlierCheck extends QualityCheck {
  readonly type = CheckType.OUTLIER;
  static readonly MIN_HISTORY = 10;
  static readonly Z_THRESHOLD = 3;

  protected evaluate({ parameter: p, value, stationHistory }: CheckContext): CheckOutcome {
    if (stationHistory.length < OutlierCheck.MIN_HISTORY) {
      return this.normal(`Короткий ряд станции (${stationHistory.length}), проверка пропущена`);
    }
    const avg = mean(stationHistory);
    const deviation = value - avg;
    const std = Math.sqrt(mean(stationHistory.map((x) => (x - avg) ** 2)));

    // если ряд не меняется (например, осадков всё время 0), z посчитать нельзя, сравниваем с допуском
    if (std === 0) {
      return Math.abs(deviation) > p.neighborTolerance
        ? this.suspect(`Ряд станции постоянен, отклонение больше допуска ${p.neighborTolerance}`, deviation, avg)
        : this.normal('Ряд станции постоянен', deviation, avg);
    }
    const z = Math.abs(deviation) / std;
    const note = `z = ${z.toFixed(2)} по ${stationHistory.length} значениям`;
    return z > OutlierCheck.Z_THRESHOLD
      ? this.suspect(`${note}; порог ${OutlierCheck.Z_THRESHOLD}`, deviation, avg)
      : this.normal(note, deviation, avg);
  }
}
