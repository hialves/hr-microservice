import { Injectable } from '@nestjs/common';
import { RequestRepository } from './request.repository';
import { DispatchEventService } from '../../../common/event/dispatch-event.service';
import { DeductRequestedEvent } from '../../../contracts/events/balance.events';
import { NotFoundError } from './errors.map';
import {
  RequestApprovedEvent,
  RequestRejectedEvent,
} from '../../../contracts/events/request.events';
import { Event } from '../../../contracts/events/event.interface';
import { CreateRequestInput } from './request.interface';

@Injectable()
export class RequestService {
  constructor(
    private repo: RequestRepository,
    private dispatchEvent: DispatchEventService,
  ) {}

  create(input: CreateRequestInput) {
    const idempotencyKey = `TIMEOFF-${new Date().getTime()}-${crypto.randomUUID()}`;
    const request = this.repo.create({
      ...input,
      status: 'PENDING' as const,
      idempotencyKey,
    });

    this.dispatchEvent.dispatch(
      new DeductRequestedEvent(
        request.idempotency_key,
        request.employee_id,
        request.location_id,
        request.days,
        'TIMEOFF',
      ),
    );

    return request;
  }

  updateStatus(
    idempotencyKey: string,
    input: {
      status: 'APPROVED' | 'REJECTED';
      errorReason: string | null;
    },
  ) {
    const request = this.repo.updateStatusByIdempotencyKey(idempotencyKey, {
      ...input,
      status: input.status,
      errorReason: input.status === 'REJECTED' ? input.errorReason : null,
    });

    if (!request) throw new NotFoundError();

    const events: Event[] = [];
    if (request.status === 'APPROVED') {
      events.push(
        new RequestApprovedEvent(
          request.idempotency_key,
          request.employee_id,
          request.location_id,
          request.days,
        ),
      );
    } else if (request.status === 'REJECTED') {
      events.push(
        new RequestRejectedEvent(request.idempotency_key, request.error_reason),
      );
    }

    this.dispatchEvent.dispatch(...events);

    return request;
  }
}
