import { Injectable, Logger } from '@nestjs/common';
import { BalanceService } from './balance.service';
import { OnEvent } from '@nestjs/event-emitter';
import { DeductRequestedEvent } from '../../../contracts/events/balance.events';

@Injectable()
export class BalanceListener {
  constructor(
    private service: BalanceService,
    private logger: Logger,
  ) {}

  @OnEvent(DeductRequestedEvent.eventName)
  handleDeductRequestedEvent(payload: DeductRequestedEvent) {
    try {
      this.service.deduct(payload);
    } catch (error) {
      this.logger.warn(error);
    }
  }
}
