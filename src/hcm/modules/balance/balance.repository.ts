import { Inject, Injectable } from '@nestjs/common';
import { Balance } from './balance.interface';
import {
  AlreadyProcessedError,
  InsufficientBalanceError,
  InvalidDeltaError,
} from './errors.map';
import Database from 'better-sqlite3';
import { HCM_DB_TOKEN } from '../../../common/constants/database.constants';

interface BalanceInput {
  employeeId: number;
  locationId: number;
  delta: number;
  reason: string | null;
  idempotencyKey: string;
}

@Injectable()
export class BalanceRepository {
  constructor(@Inject(HCM_DB_TOKEN) private connection: Database.Database) {}

  create(input: BalanceInput) {
    const tx = this.connection.transaction(() => {
      const existing = this.checkIdempotency(input.idempotencyKey);
      if (existing) throw new AlreadyProcessedError();

      const balanceCreated = this.connection
        .prepare(
          `INSERT INTO balances
            (employee_id, location_id, amount, version, updated_at)
            VALUES (:employee, :location, :amount, 1, CURRENT_TIMESTAMP)
            ON CONFLICT (employee_id, location_id) DO NOTHING
            RETURNING *`,
        )
        .get({
          employee: input.employeeId,
          location: input.locationId,
          amount: input.delta,
        }) as Balance | undefined;
      if (!balanceCreated) {
        throw new AlreadyProcessedError();
      }

      this.insertLedgerEntry(input);
      this.insertProcessedRequest(input.idempotencyKey);

      return balanceCreated;
    });

    return tx();
  }

  findSince(since: string, id: number, limit: number) {
    const rows = this.connection
      .prepare(
        `SELECT * FROM balances
        WHERE updated_at > :since 
          OR (updated_at = :since AND id > :id)
        ORDER BY updated_at ASC, id ASC
        LIMIT :limit`,
      )
      .all({ since, id, limit }) as Balance[];
    return rows;
  }

  getBalance(employeeId: number, locationId: number): Balance | null {
    const row = this.connection
      .prepare(
        'SELECT * FROM balances WHERE employee_id = :employee AND location_id = :location',
      )
      .get({ employee: employeeId, location: locationId }) as
      | Balance
      | undefined;
    return row || null;
  }

  deduct(input: BalanceInput) {
    if (input.delta >= 0) throw new InvalidDeltaError();

    const tx = this.connection.transaction(() => {
      const existing = this.checkIdempotency(input.idempotencyKey);
      if (existing) throw new AlreadyProcessedError();

      const balanceUpdate = this.connection
        .prepare(
          ` UPDATE balances
            SET amount = amount + :delta,
                updated_at = CURRENT_TIMESTAMP,
                version = version + 1
            WHERE employee_id = :employee
              AND location_id = :location
              AND amount + :delta >= 0
            RETURNING *
          `,
        )
        .get({
          delta: input.delta,
          employee: input.employeeId,
          location: input.locationId,
        }) as Balance | undefined;
      if (!balanceUpdate) throw new InsufficientBalanceError();

      this.insertLedgerEntry(input);
      this.insertProcessedRequest(input.idempotencyKey);

      return balanceUpdate;
    });

    return tx();
  }

  recalculateBalance(employeeId: number, locationId: number) {
    const tx = this.connection.transaction(() => {
      return this.connection
        .prepare(
          `
          INSERT INTO balances (employee_id, location_id, amount, updated_at)
            VALUES (:employee, :location, (
              SELECT COALESCE(SUM(delta), 0)
              FROM ledger
              WHERE employee_id = :employee
                AND location_id = :location
            ), CURRENT_TIMESTAMP)
            ON CONFLICT(employee_id, location_id)
            DO UPDATE SET amount = EXCLUDED.amount, updated_at = CURRENT_TIMESTAMP
          RETURNING *
          `,
        )
        .get({ employee: employeeId, location: locationId }) as Balance;
    });

    return tx();
  }

  private insertLedgerEntry(input: BalanceInput) {
    this.connection
      .prepare(
        ` INSERT INTO ledger
              (employee_id, location_id, delta, reason, idempotency_key) VALUES
              (:employee, :location, :delta, :reason, :idempotencyKey)
          `,
      )
      .run({
        employee: input.employeeId,
        location: input.locationId,
        delta: input.delta,
        reason: input.reason,
        idempotencyKey: input.idempotencyKey,
      });
  }

  private insertProcessedRequest(idempotencyKey: string) {
    this.connection
      .prepare(
        `INSERT INTO processed_requests (idempotency_key) VALUES (:idempotencyKey)`,
      )
      .run({ idempotencyKey });
  }

  private checkIdempotency(idempotencyKey: string): boolean {
    const existing = this.connection
      .prepare(
        'SELECT * FROM processed_requests WHERE idempotency_key = :idempotencyKey',
      )
      .get({ idempotencyKey });
    return !!existing;
  }
}
