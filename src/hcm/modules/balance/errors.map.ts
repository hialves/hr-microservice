import { DomainError } from '../../../error/domain.error';

export class InvalidDaysError extends DomainError {
  code = 'HCM_INVALID_DAYS';
  constructor() {
    super('HCM_INVALID_DAYS');
  }
}

export class InsufficientBalanceError extends DomainError {
  code = 'INSUFFICIENT_BALANCE';
  constructor() {
    super('INSUFFICIENT_BALANCE');
  }
}

export class AlreadyProcessedError extends DomainError {
  code = 'ALREADY_PROCESSED';
  constructor() {
    super('ALREADY_PROCESSED');
  }
}

export class InvalidDeltaError extends DomainError {
  code = 'INVALID_DELTA_FOR_DEDUCT';
  constructor() {
    super('INVALID_DELTA_FOR_DEDUCT');
  }
}

export const balanceErrors: Map<Function, number> = new Map([
  [InvalidDaysError, 400],
  [InsufficientBalanceError, 400],
  [AlreadyProcessedError, 409],
  [InvalidDeltaError, 400],
]);
