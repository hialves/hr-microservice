import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import { HCM_DB_TOKEN } from '../../common/constants/database.constants';

@Injectable()
export class HcmDbService implements OnModuleInit {
  constructor(@Inject(HCM_DB_TOKEN) private connection: Database.Database) {}

  onModuleInit() {
    this.ensureTablesExist();
  }

  private ensureTablesExist() {
    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS balances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        version INTEGER NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uk_balances_employee_location UNIQUE (employee_id, location_id)
      );

      CREATE INDEX IF NOT EXISTS idx_balances_sync_composite ON balances (updated_at, id);

      CREATE TABLE IF NOT EXISTS ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        delta INTEGER NOT NULL,
        reason TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        idempotency_key TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS processed_requests (
        idempotency_key TEXT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
}
