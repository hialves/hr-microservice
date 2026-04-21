import { Module } from '@nestjs/common';
import { TimeoffDbModule } from './database/timeoff-db.module';
import { RequestService } from './modules/request/request.service';
import { BalanceSnapshotService } from './modules/balance-snapshot/balance-snapshot.service';
import { BalanceSnapshotListener } from './modules/balance-snapshot/balance-snapshot.listener';
import { BalanceSnapshotRepository } from './modules/balance-snapshot/balance-snapshot.repository';
import { RequestListener } from './modules/request/request.listener';
import { RequestRepository } from './modules/request/request.repository';
import { DispatchEventModule } from '../common/event/dispatch-event.module';
import { HcmIntegrationModule } from './modules/hcm-integration/hcm-integration.module';
import { BalanceSnapshotController } from './modules/balance-snapshot/balance-snapshot.controller';
import { RequestController } from './modules/request/request.controller';

@Module({
  imports: [TimeoffDbModule, DispatchEventModule, HcmIntegrationModule],
  controllers: [BalanceSnapshotController, RequestController],
  providers: [
    RequestService,
    RequestListener,
    RequestRepository,
    BalanceSnapshotService,
    BalanceSnapshotListener,
    BalanceSnapshotRepository,
  ],
  exports: [],
})
export class TimeOffModule {}
