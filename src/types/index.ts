// Job status types
export type JobStatus = 'pending' | 'processing' | 'waiting_cta' | 'completed' | 'failed';

// Tool categories
export type ToolCategory = 'image-conversion' | 'image-compression' | 'file-conversion' | 'file-compression';

// Supported image formats
export type ImageFormat = 'jpg' | 'jpeg' | 'png' | 'webp';

// Tool definition
export interface Tool {
  id: string;
  name: string;
  slug: string;
  category: ToolCategory;
  priority: boolean;
  inputFormats: ImageFormat[];
  outputFormats: ImageFormat[];
  description: string;
}

// Job definition
export interface Job {
  id: string;
  toolSlug: string;
  status: JobStatus;
  totalFiles: number;
  processedFiles: number;
  creditsUsed: number;
  createdAt: Date;
  expiresAt: Date;
}

// Job session for CTA tracking
export interface JobSession {
  id: string;
  jobId: string;
  creditStep: number;
  status: 'pending' | 'completed';
  createdAt: Date;
}

// File upload result
export interface UploadResult {
  jobId: string;
  files: UploadedFile[];
  creditsRequired: number;
}

// Uploaded file info
export interface UploadedFile {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
}

// Processed file result
export interface ProcessedFile {
  id: string;
  originalName: string;
  originalSize: number;
  newSize: number;
  outputPath: string;
  savedPercent: number;
}

// Job status response
export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  totalFiles: number;
  processedFiles: number;
  progress: number;
  creditsUsed: number;
  creditsRequired: number;
  showCta: boolean;
  downloadUrl?: string;
  files?: ProcessedFile[];
}

// Upload API request
export interface UploadRequest {
  files: File[];
  toolSlug: string;
}

// API error response
export interface ApiError {
  error: string;
  message: string;
}

// Rate limit info
export interface RateLimitInfo {
  ip: string;
  fileCount: number;
  resetAt: Date;
}
