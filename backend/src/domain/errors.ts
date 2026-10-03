/** нарушено бизнес-правило, наружу уйдёт как 422 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

/** так менять статус нельзя, в том числе назад */
export class InvalidTransitionError extends DomainError {
  constructor(entity: string, from: string, to: string) {
    super(`${entity}: нельзя перейти из ${from} в ${to}`);
    this.name = 'InvalidTransitionError';
  }
}
