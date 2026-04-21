import type { Balance } from '../../hcm/modules/balance/balance.interface';

export interface BalanceBatchSyncResponse {
  data: Balance[];
  meta: {
    nextCursor: {
      updatedAt: string;
      id: number;
    };
    hasMore: boolean;
  };
}
