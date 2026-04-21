import { Injectable } from '@nestjs/common';
import { BalanceSnapshotRepository } from './balance-snapshot.repository';
import { HcmIntegrationService } from '../hcm-integration/hcm-integration.service';

@Injectable()
export class BalanceSnapshotService {
  constructor(
    private repo: BalanceSnapshotRepository,
    private hcmService: HcmIntegrationService,
  ) {}

  upsert(input: {
    employeeId: number;
    locationId: number;
    amount: number;
    version: number;
  }) {
    return this.repo.upsert(input);
  }

  getBalance(employeeId: number, locationId: number) {
    return this.repo.getBalance(employeeId, locationId);
  }

  async syncBatch() {
    const syncState = this.repo.getLastSyncState();
    let hasMore = true;
    let cursor: { updatedAt: string; id: number } = {
      updatedAt: syncState.last_updated_at,
      id: syncState.last_id,
    };

    let count = 0;
    while (hasMore) {
      try {
        const { data, meta } = await this.hcmService.getBalanceSync(
          cursor?.updatedAt,
          cursor?.id,
          1000,
        );

        const { totalInserted } = this.repo.upsertBatch(
          data.map(({ employee_id, location_id, ...balance }) => ({
            ...balance,
            employeeId: employee_id,
            locationId: location_id,
          })),
        );

        count += totalInserted;
        cursor = meta.nextCursor;
        hasMore = meta.hasMore;
      } catch (error) {
        console.error('Error syncing balances from HCM:', error);
        hasMore = false;
      } finally {
        this.repo.updateSyncState(cursor.updatedAt, cursor.id);
      }
    }
  }
}
