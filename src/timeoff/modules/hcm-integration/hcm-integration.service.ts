import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { BalanceBatchSyncResponse } from '../../../contracts/rest/balance.response';

@Injectable()
export class HcmIntegrationService {
  constructor(private httpService: HttpService) {}

  async getBalanceSync(
    since: string | undefined,
    id: number | undefined,
    limit: number,
  ) {
    const query = new URLSearchParams();
    if (since) query.append('since', since);
    if (id) query.append('id', id.toString());
    query.append('limit', limit.toString());
    const { data } =
      await this.httpService.axiosRef.get<BalanceBatchSyncResponse>(
        `hcm/balances/sync?${query.toString()}`,
      );
    return data;
  }
}
