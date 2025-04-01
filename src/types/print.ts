
export interface PrintJob {
  id?: string;
  order_id: string;
  printer_id?: string;
  job_id: string;
  status: 'success' | 'failed' | 'pending';
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}
