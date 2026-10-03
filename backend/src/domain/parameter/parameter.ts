import { DomainError } from '../errors';

export interface ParameterProps {
  id: number;
  code: string;
  name: string;
  unit: string;
  minValue: number;
  maxValue: number;
  precision: number;
  neighborTolerance: number;
}

/** что меряем: единица, допустимый диапазон и точность */
export class Parameter {
  constructor(private readonly props: ParameterProps) {
    if (props.minValue >= props.maxValue) {
      throw new DomainError(`Параметр ${props.code}: минимум должен быть меньше максимума`);
    }
    if (!Number.isInteger(props.precision) || props.precision < 0) {
      throw new DomainError(`Параметр ${props.code}: точность должна быть целым числом от нуля`);
    }
  }

  get id() { return this.props.id; }
  get code() { return this.props.code; }
  get name() { return this.props.name; }
  get unit() { return this.props.unit; }
  get minValue() { return this.props.minValue; }
  get maxValue() { return this.props.maxValue; }
  get precision() { return this.props.precision; }
  get neighborTolerance() { return this.props.neighborTolerance; }

  isInRange(value: number): boolean {
    return value >= this.props.minValue && value <= this.props.maxValue;
  }

  /**
   * округляет значение до точности параметра,
   * а выход за диапазон тут не ошибка, такой замер потом пометит RangeCheck
   */
  normalize(raw: unknown): number {
    if (typeof raw !== 'number' || !Number.isFinite(raw)) {
      throw new DomainError(`${this.props.name}: значение должно быть числом`);
    }
    const factor = 10 ** this.props.precision;
    return Math.round(raw * factor) / factor;
  }
}
