import { Module } from '@nestjs/common';
import Database from 'better-sqlite3';
import { TimeoffDbService } from './timeoff-db.service';
import { TIMEOFF_DB_TOKEN } from '../../common/constants/database.constants';

@Module({
  providers: [
    {
      provide: TIMEOFF_DB_TOKEN,
      useFactory: () => {
        const db = new Database('timeoff.sqlite');
        db.pragma('journal_mode = WAL');
        return db;
      },
    },
    TimeoffDbService,
  ],
  exports: [TIMEOFF_DB_TOKEN],
})
export class TimeoffDbModule {}
