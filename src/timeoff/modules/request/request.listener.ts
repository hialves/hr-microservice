import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DeductProcessedEvent } from '../../../contracts/events/balance.events';
import { RequestService } from './request.service';

@Injectable()
export class RequestListener {
  constructor(private service: RequestService) {}

  @OnEvent(DeductProcessedEvent.eventName)
  handleDeductProcessedEvent(payload: DeductProcessedEvent) {
    this.service.updateStatus(payload.idempotencyKey, {
      status: payload.status,
      errorReason: payload.errorReason,
    });
  }
}
