import { Module } from '@nestjs/common';
import Database from 'better-sqlite3';
import { HcmDbService } from './hcm-db.service';
import { HCM_DB_TOKEN } from '../../common/constants/database.constants';

@Module({
  providers: [
    {
      provide: HCM_DB_TOKEN,
      useFactory: () => {
        const db = new Database('hcm.sqlite');
        db.pragma('journal_mode = WAL');
        return db;
      },
    },
    HcmDbService,
  ],
  exports: [HCM_DB_TOKEN],
})
export class HcmDbModule {}
