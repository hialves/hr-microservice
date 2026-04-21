export interface Balance {
  id: number;
  employee_id: number;
  location_id: number;
  amount: number;
  version: number;
  updated_at: string;
}

export interface CreateBalanceInput {
  employeeId: number;
  locationId: number;
  days: number;
  reason: string | null;
  idempotencyKey: string;
}
