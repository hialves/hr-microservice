export interface Ledger {
  id: number;
  employee_id: number;
  location_id: number;
  delta: number;
  reason: string | null;
  timestamp: string;
  idempotency_key: string;
}
