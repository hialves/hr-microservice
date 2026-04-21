import { DomainError } from '../../../error/domain.error';

export class InvalidDaysError extends DomainError {
  code = 'TIMEOFF_INVALID_DAYS';
  constructor() {
    super('TIMEOFF_INVALID_DAYS');
  }
}

export class NotFoundError extends DomainError {
  code = 'NOT_FOUND';
  constructor() {
    super('NOT_FOUND');
  }
}

export const requestErrors: Map<Function, number> = new Map([
  [InvalidDaysError, 400],
  [NotFoundError, 404],
]);
