import { Controller, Post } from '@nestjs/common';
import { BalanceSnapshotService } from './balance-snapshot.service';

@Controller('timeoff/balances')
export class BalanceSnapshotController {
  constructor(private service: BalanceSnapshotService) {}

  @Post('sync')
  syncBatch() {
    return this.service.syncBatch();
  }
}
