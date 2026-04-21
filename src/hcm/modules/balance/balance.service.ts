import { Injectable } from '@nestjs/common';
import { BalanceRepository } from './balance.repository';
import { Balance, CreateBalanceInput } from './balance.interface';
import * as BalanceEvents from '../../../contracts/events/balance.events';
import { DispatchEventService } from '../../../common/event/dispatch-event.service';
import { InvalidDaysError } from './errors.map';
import { BalanceBatchSyncResponse } from '../../../contracts/rest/balance.response';

@Injectable()
export class BalanceService {
  constructor(
    private repo: BalanceRepository,
    private dispatchEvent: DispatchEventService,
  ) {}

  create(input: CreateBalanceInput) {
    const balance = this.repo.create({ delta: input.days, ...input });

    this.dispatchEvent.dispatch(
      new BalanceEvents.BalanceUpdatedEvent(
        balance.employee_id,
        balance.location_id,
        balance.amount,
        balance.version,
      ),
    );

    return balance;
  }

  getSync(since: string, id: number, limit: number): BalanceBatchSyncResponse {
    const balances = this.repo.findSince(since, id, limit);
    const lastRecord = balances.at(-1);

    return {
      data: balances,
      meta: {
        nextCursor: lastRecord
          ? {
              updatedAt: lastRecord.updated_at,
              id: lastRecord.id,
            }
          : { updatedAt: since, id },
        hasMore: balances.length === limit,
      },
    };
  }

  deduct(input: {
    employeeId: number;
    locationId: number;
    days: number;
    reason: string | null;
    idempotencyKey: string;
  }) {
    if (input.days <= 0) {
      this.dispatchEvent.dispatch(
        new BalanceEvents.DeductProcessedEvent(
          input.idempotencyKey,
          'REJECTED',
          input.reason,
        ),
      );
      return;
    }

    try {
      const updatedBalance = this.repo.deduct({ delta: -input.days, ...input });
      this.dispatchEvent.dispatch(
        new BalanceEvents.BalanceUpdatedEvent(
          updatedBalance.employee_id,
          updatedBalance.location_id,
          updatedBalance.amount,
          updatedBalance.version,
        ),
        new BalanceEvents.DeductProcessedEvent(
          input.idempotencyKey,
          'APPROVED',
          null,
        ),
      );
      return updatedBalance;
    } catch (err) {
      if (err instanceof Error)
        this.dispatchEvent.dispatch(
          new BalanceEvents.DeductProcessedEvent(
            input.idempotencyKey,
            'REJECTED',
            err.message,
          ),
        );

      throw err;
    }
  }

  recalculateBalance(employeeId: number, locationId: number): Balance | null {
    return this.repo.recalculateBalance(employeeId, locationId);
  }
}
