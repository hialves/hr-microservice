export interface Request {
  id: number;
  idempotency_key: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  employee_id: number;
  location_id: number;
  days: number;
  error_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRequestInput {
  employeeId: number;
  locationId: number;
  days: number;
}
