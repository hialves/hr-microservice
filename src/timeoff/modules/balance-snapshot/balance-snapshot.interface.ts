export interface BalanceSnapshot {
  id: number;
  employee_id: number;
  location_id: number;
  amount: number;
  version: number;
  updatedAt: string;
}
