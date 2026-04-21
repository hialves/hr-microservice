import { Logger, Module } from '@nestjs/common';
import { HcmDbModule } from './database/hcm-db.module';
import { BalanceService } from './modules/balance/balance.service';
import { BalanceRepository } from './modules/balance/balance.repository';
import { LedgerService } from './modules/ledger/ledger.service';
import { LedgerRepository } from './modules/ledger/ledger.repository';
import { DispatchEventModule } from '../common/event/dispatch-event.module';
import { BalanceListener } from './modules/balance/balance.listener';
import { BalanceController } from './modules/balance/balance.controller';

@Module({
  imports: [HcmDbModule, DispatchEventModule],
  controllers: [BalanceController],
  providers: [
    BalanceRepository,
    BalanceService,
    BalanceListener,
    LedgerRepository,
    LedgerService,
    { provide: Logger, useValue: new Logger() },
  ],
})
export class HcmModule {}
