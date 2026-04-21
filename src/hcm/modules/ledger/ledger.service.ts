import { Injectable } from '@nestjs/common';
import { LedgerRepository } from './ledger.repository';
import { Ledger } from './ledger.interface';

@Injectable()
export class LedgerService {
  constructor(private repo: LedgerRepository) {}

  save(ledger: Ledger) {
    return this.repo.save(ledger);
  }

  getEmployeeLedger(employeeId: number): Ledger[] {
    return this.repo.getEmployeeLedger(employeeId);
  }
}
