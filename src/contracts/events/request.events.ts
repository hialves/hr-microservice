import { Event } from './event.interface';

export class RequestApprovedEvent implements Event {
  static readonly eventName = 'request.approved';
  readonly eventName = RequestApprovedEvent.eventName;

  constructor(
    readonly idempotencyKey: string,
    readonly employeeId: number,
    readonly locationId: number,
    readonly days: number,
  ) {}
}

export class RequestRejectedEvent implements Event {
  static readonly eventName = 'request.rejected';
  readonly eventName = RequestRejectedEvent.eventName;

  constructor(
    readonly idempotencyKey: string,
    readonly reason: string | null,
  ) {}
}
