import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import { TIMEOFF_DB_TOKEN } from '../../common/constants/database.constants';

@Injectable()
export class TimeoffDbService implements OnModuleInit {
  constructor(
    @Inject(TIMEOFF_DB_TOKEN) private connection: Database.Database,
  ) {}

  onModuleInit() {
    this.ensureTablesExist();
  }

  private ensureTablesExist() {
    this.connection.exec(`
      CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idempotency_key TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'PENDING',
        employee_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        days INTEGER NOT NULL,
        error_reason TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS balance_snapshots (
        employee_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        version INTEGER NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (employee_id, location_id)
      );

      CREATE TABLE IF NOT EXISTS sync_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        last_updated_at DATETIME NOT NULL DEFAULT '1970-01-01 00:00:00',
        last_id INTEGER NOT NULL DEFAULT 0
      );
    `);
  }
}
