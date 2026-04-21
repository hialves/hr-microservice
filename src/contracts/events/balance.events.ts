import { Event } from './event.interface';

export class BalanceUpdatedEvent implements Event {
  static readonly eventName = 'balance.updated';
  readonly eventName = BalanceUpdatedEvent.eventName;

  constructor(
    readonly employeeId: number,
    readonly locationId: number,
    readonly newBalance: number,
    readonly version: number,
  ) {}
}

export class DeductRequestedEvent implements Event {
  static readonly eventName = 'balance.deduct_requested';
  readonly eventName = DeductRequestedEvent.eventName;

  constructor(
    readonly idempotencyKey: string,
    readonly employeeId: number,
    readonly locationId: number,
    readonly days: number,
    readonly reason: string | null,
  ) {}
}

export class DeductProcessedEvent implements Event {
  static readonly eventName = 'balance.deduct_processed';
  readonly eventName = DeductProcessedEvent.eventName;

  constructor(
    readonly idempotencyKey: string,
    readonly status: 'APPROVED' | 'REJECTED',
    readonly errorReason: string | null,
  ) {}
}
