import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BalanceUpdatedEvent } from '../../../contracts/events/balance.events';
import { BalanceSnapshotService } from './balance-snapshot.service';

@Injectable()
export class BalanceSnapshotListener {
  constructor(private balanceService: BalanceSnapshotService) {}

  @OnEvent(BalanceUpdatedEvent.eventName)
  handleBalanceUpdatedEvent(payload: BalanceUpdatedEvent) {
    this.balanceService.upsert({
      employeeId: payload.employeeId,
      locationId: payload.locationId,
      amount: payload.newBalance,
      version: payload.version,
    });
  }
}
