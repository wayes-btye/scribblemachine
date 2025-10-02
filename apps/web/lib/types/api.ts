// API Response Types for Frontend

// Common response structure
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

// Error response
export interface ApiError {
  error: string
  message?: string
  retryAfter?: number
}

// Rate limit headers
export interface RateLimitHeaders {
  'X-RateLimit-Limit'?: string
  'X-RateLimit-Remaining'?: string
  'X-RateLimit-Reset'?: string
}

// Auth API Types
export interface MagicLinkRequest {
  email: string
}

export interface MagicLinkResponse {
  message: string
}

// Upload API Types
export interface UploadRequest {
  filename: string
  contentType: string
  size: number
}

export interface UploadResponse {
  assetId: string
  uploadUrl: string
  storagePath: string
}

// Jobs API Types
export interface CreateJobRequest {
  assetId: string
  complexity: 'simple' | 'standard' | 'detailed'
  lineThickness: 'thin' | 'medium' | 'thick'
  customPrompt?: string
}

export interface CreateJobResponse {
  jobId: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  message: string
}

export interface JobStatusResponse {
  id: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  params: {
    assetId: string
    complexity: string
    lineThickness: string
    customPrompt?: string
  }
  cost_cents?: number
  model?: string
  started_at?: string
  ended_at?: string
  error?: string
  created_at: string
  updated_at: string
  download_urls: Record<string, string>
}

// Credits API Types
export interface CreditEvent {
  delta: number
  reason: string
  created_at: string
}

export interface CreditsResponse {
  balance: number
  updated_at?: string
  recent_events: CreditEvent[]
}

// PDF Export API Types
export interface ExportPDFRequest {
  jobId: string
  paperSize: 'A4' | 'LETTER'
  title?: string
  includeCreditLine?: boolean
}

export interface ExportPDFResponse {
  message: string
  exportParams: {
    jobId: string
    paperSize: string
    title?: string
    includeCreditLine: boolean
    includeWatermark: boolean
  }
  estimatedTime: string
  note: string
}

// User Profile API Types
export interface UserStats {
  total_jobs: number
  successful_jobs: number
  failed_jobs: number
  pending_jobs: number
}

export interface UserCredits {
  balance: number
  updated_at?: string
}

export interface UserProfileResponse {
  id: string
  email: string
  created_at: string
  last_login_at: string
  credits: UserCredits
  stats: UserStats
}

export interface UpdateProfileRequest {
  last_login_at?: boolean
}

export interface UpdateProfileResponse {
  message: string
  profile: {
    id: string
    email: string
    created_at: string
    last_login_at: string
  }
}

// Gallery API Types
export interface GalleryQueryParams {
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'title'
  sort_order?: 'asc' | 'desc'
}

export interface GalleryItemResponse {
  job_id: string
  title: string | null
  image_url: string
  thumbnail_url?: string | null
  created_at: string
  complexity: 'simple' | 'standard' | 'detailed'
  line_thickness: 'thin' | 'medium' | 'thick'
  has_pdf: boolean
}

export interface GalleryPaginationMeta {
  page: number
  limit: number
  total_count: number
  has_more: boolean
}

export interface GalleryResponse {
  items: GalleryItemResponse[]
  pagination: GalleryPaginationMeta
}

// Frontend Hook Types
export interface UseJobPollingOptions {
  jobId: string
  onComplete?: (job: JobStatusResponse) => void
  onError?: (error: string) => void
  interval?: number
}

export interface UseCreditsOptions {
  refetchInterval?: number
}

export interface UseUploadOptions {
  onSuccess?: (response: UploadResponse) => void
  onError?: (error: string) => void
}

// Frontend State Types
export interface UploadState {
  file: File | null
  uploading: boolean
  uploadProgress: number
  assetId: string | null
  error: string | null
}

export interface GenerationState {
  jobId: string | null
  status: 'idle' | 'uploading' | 'generating' | 'completed' | 'failed'
  progress: number
  error: string | null
  result: JobStatusResponse | null
}

export interface UserState {
  profile: UserProfileResponse | null
  loading: boolean
  error: string | null
}