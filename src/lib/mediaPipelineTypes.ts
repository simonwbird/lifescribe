export type MediaPipelineStage = 'upload' | 'virus_scan' | 'ocr' | 'asr' | 'index';
export type MediaJobStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'retrying';
export type MediaVendorType = 'transcription' | 'ocr' | 'virus_scan' | 'storage';

export interface MediaPipelineJob {
  id: string;
  media_id: string;
  family_id: string;
  stage: MediaPipelineStage;
  status: MediaJobStatus;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  error_details: Record<string, any>;
  retry_count: number;
  vendor_used?: string;
  cost_usd: number;
  processing_time_ms?: number;
  raw_output: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined data
  media?: {
    file_name: string;
    mime_type: string;
    file_size: number;
  };
}

export interface MediaPipelineMetrics {
  id: string;
  date: string;
  stage: MediaPipelineStage;
  vendor?: string;
  total_jobs: number;
  successful_jobs: number;
  failed_jobs: number;
  total_cost_usd: number;
  avg_processing_time_ms: number;
  p95_processing_time_ms: number;
  created_at: string;
}

export interface MediaVendorStatus {
  id: string;
  vendor_type: MediaVendorType;
  vendor_name: string;
  is_active: boolean;
  last_health_check: string;
  health_status: 'healthy' | 'degraded' | 'outage';
  error_rate_24h: number;
  avg_response_time_ms: number;
  cost_per_unit: number;
  unit_type: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineOverviewStats {
  total_queue_depth: number;
  failures_24h: number;
  total_cost_24h: number;
  p95_processing_time: number;
  storage_gb_used: number;
  transcription_minutes_24h: number;
}

export interface PipelineStageStats {
  stage: MediaPipelineStage;
  queue_depth: number;
  success_rate_24h: number;
  avg_processing_time: number;
  total_cost_24h: number;
}