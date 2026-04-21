import { Inject, Injectable } from '@nestjs/common';
import { Ledger } from './ledger.interface';
import Database from 'better-sqlite3';
import { HCM_DB_TOKEN } from '../../../common/constants/database.constants';

@Injectable()
export class LedgerRepository {
  constructor(@Inject(HCM_DB_TOKEN) private connection: Database.Database) {}

  save(ledger: Ledger): void {
    this.connection
      .prepare(
        `INSERT INTO ledger (employee_id, location_id, delta, reason, timestamp, idempotency_key)
       VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        ledger.employee_id,
        ledger.location_id,
        ledger.delta,
        ledger.reason,
        ledger.timestamp,
        ledger.idempotency_key,
      );
  }

  getEmployeeLedger(employeeId: number): Ledger[] {
    const rows = this.connection
      .prepare('SELECT * FROM ledger WHERE employee_id = ?')
      .all(employeeId) as Ledger[];
    return rows;
  }
}
