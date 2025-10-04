export type PaperSize = 'A4' | 'Letter';

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export type AssetKind = 'original' | 'preprocessed' | 'edge_map' | 'pdf' | 'thumbnail';

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
  asset_id?: string;
  complexity?: Complexity;
  line_thickness?: LineThickness;
  paper_size?: PaperSize;
  title?: string;
  text_prompt?: string;
  edit_parent_id?: string;
  edit_prompt?: string;
  edit_source_asset_id?: string;
  custom_prompt?: string;
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
  assetId: string;
  complexity: Complexity;
  lineThickness: LineThickness;
  customPrompt?: string;
}

export interface TextGenerationRequest {
  textPrompt: string;
  complexity: Complexity;
  lineThickness: LineThickness;
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