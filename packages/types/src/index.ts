export type PaperSize = 'A4' | 'Letter';

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export type AssetKind = 'original' | 'preprocessed' | 'edge_map' | 'pdf';

export type Complexity = 'simple' | 'standard' | 'detailed';

export type LineThickness = 'thin' | 'medium' | 'thick';

export interface User {
  id: string;
  email: string;
  created_at: Date;
  last_login_at: Date;
}

export interface Job {
  id: string;
  user_id: string;
  status: JobStatus;
  params_json: JobParams;
  cost_cents?: number;
  model?: string;
  started_at?: Date;
  ended_at?: Date;
  error?: string;
  created_at: Date;
  updated_at: Date;
}

export interface JobParams {
  asset_id: string;
  complexity: Complexity;
  line_thickness: LineThickness;
  paper_size?: PaperSize;
  title?: string;
}

export interface Asset {
  id: string;
  user_id: string;
  kind: AssetKind;
  storage_path: string;
  width?: number;
  height?: number;
  bytes?: number;
  hash?: string;
  created_at: Date;
}

export interface Credits {
  user_id: string;
  balance: number;
  updated_at: Date;
}

export interface CreditEvent {
  id: string;
  user_id: string;
  delta: number;
  reason: string;
  stripe_event_id?: string;
  created_at: Date;
}

export interface GenerationRequest {
  asset_id: string;
  complexity: Complexity;
  line_thickness: LineThickness;
  idempotency_key?: string;
}

export interface PDFExportRequest {
  job_id: string;
  paper_size: PaperSize;
  title?: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
}