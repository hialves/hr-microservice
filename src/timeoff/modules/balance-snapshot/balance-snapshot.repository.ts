import { Inject, Injectable } from '@nestjs/common';
import { BalanceSnapshot } from './balance-snapshot.interface';
import Database from 'better-sqlite3';
import { TIMEOFF_DB_TOKEN } from '../../../common/constants/database.constants';

interface BalanceInput {
  employeeId: number;
  locationId: number;
  amount: number;
  version: number;
}

@Injectable()
export class BalanceSnapshotRepository {
  private readonly insertStmt = {
    query: `
        INSERT INTO balance_snapshots
          (employee_id, location_id, amount, version, updated_at)
          VALUES (:employee, :location, :amount, :version, CURRENT_TIMESTAMP)
          ON CONFLICT(employee_id, location_id)
          DO UPDATE SET amount = EXCLUDED.amount, version = EXCLUDED.version, updated_at = CURRENT_TIMESTAMP
            WHERE balance_snapshots.version < EXCLUDED.version
      `,
    map: (input: BalanceInput) => ({
      employee: input.employeeId,
      location: input.locationId,
      amount: input.amount,
      version: input.version,
    }),
  };

  constructor(
    @Inject(TIMEOFF_DB_TOKEN) private connection: Database.Database,
  ) {}

  upsert(input: BalanceInput): BalanceSnapshot {
    const tx = this.connection.transaction(() => {
      return this.connection
        .prepare(`${this.insertStmt.query} RETURNING *`)
        .get(this.insertStmt.map(input)) as BalanceSnapshot;
    });
    return tx();
  }

  upsertBatch(input: BalanceInput[]): { totalInserted: number } {
    let totalInserted = 0;
    const insert = this.connection.prepare(this.insertStmt.query);
    const tx = this.connection.transaction(() => {
      for (const balance of input) {
        const params = this.insertStmt.map(balance);
        const result = insert.run(params);
        totalInserted += result.changes;
      }
      return totalInserted;
    });
    return { totalInserted: tx() };
  }

  getBalance(employeeId: number, locationId: number): BalanceSnapshot | null {
    const row = this.connection
      .prepare(
        'SELECT * FROM balance_snapshots WHERE employee_id = :employee AND location_id = :location',
      )
      .get({ employee: employeeId, location: locationId }) as
      | BalanceSnapshot
      | undefined;
    return row || null;
  }

  getLastSyncState() {
    const row = this.connection
      .prepare('SELECT * FROM sync_state WHERE id = 1')
      .get() as { last_updated_at: string; last_id: number } | undefined;
    return row || { last_updated_at: '1970-01-01 00:00:00', last_id: 0 };
  }

  updateSyncState(lastUpdatedAt: string, lastId: number) {
    const tx = this.connection.transaction(() => {
      this.connection
        .prepare(
          `
        INSERT INTO sync_state
          (id, last_updated_at, last_id)
          VALUES (1, :lastUpdatedAt, :lastId)
        ON CONFLICT (id)
          DO UPDATE SET last_updated_at = :lastUpdatedAt, last_id = :lastId
      `,
        )
        .run({ lastUpdatedAt, lastId });
    });
    return tx();
  }
}
