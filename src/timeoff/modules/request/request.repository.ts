import { Inject, Injectable } from '@nestjs/common';
import { InvalidDaysError } from './errors.map';
import { Request } from './request.interface';
import Database from 'better-sqlite3';
import { TIMEOFF_DB_TOKEN } from '../../../common/constants/database.constants';

@Injectable()
export class RequestRepository {
  constructor(
    @Inject(TIMEOFF_DB_TOKEN) private connection: Database.Database,
  ) {}

  create(input: {
    employeeId: number;
    locationId: number;
    idempotencyKey: string;
    days: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
  }) {
    if (input.days <= 0) throw new InvalidDaysError();

    const tx = this.connection.transaction(() => {
      return this.connection
        .prepare(
          `INSERT INTO requests (employee_id, location_id, idempotency_key, days)
            VALUES (:employee, :location, :idempotencyKey, :days)
            RETURNING *`,
        )
        .get({
          employee: input.employeeId,
          location: input.locationId,
          idempotencyKey: input.idempotencyKey,
          days: input.days,
        }) as Request;
    });

    return tx();
  }

  getByIdempotencyKey(idempotencyKey: string): Request | null {
    const row = this.connection
      .prepare('SELECT * FROM requests WHERE idempotency_key = :idempotencyKey')
      .get({ idempotencyKey }) as Request | undefined;
    return row || null;
  }

  updateStatusByIdempotencyKey(
    idempotencyKey: string,
    input: {
      status: 'APPROVED' | 'REJECTED';
      errorReason: string | null;
    },
  ) {
    const tx = this.connection.transaction(() => {
      this.connection
        .prepare(
          `UPDATE requests
            SET status = :status, error_reason = :errorReason, updated_at = CURRENT_TIMESTAMP
            WHERE idempotency_key = :idempotencyKey
              AND status = 'PENDING'
            RETURNING *`,
        )
        .get({
          idempotencyKey,
          status: input.status,
          errorReason: input.errorReason,
        }) as Request | undefined;

      return this.getByIdempotencyKey(idempotencyKey);
    });

    return tx();
  }
}
