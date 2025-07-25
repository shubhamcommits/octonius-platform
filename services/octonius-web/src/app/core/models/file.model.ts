export interface File {
  id: string;
  name: string;
  type: 'note' | 'file';
  icon: string;
  owner: string;
  owner_avatar: string;
  last_modified: string;
  size?: number;
  mime_type?: string;
  title?: string;
  content?: any;
  cdn_url?: string; // S3 CDN URL for public access
}

// S3 Upload Intent interfaces
export interface UploadIntentRequest {
  file_name: string;
  file_type: string;
  file_size: number;
  group_id?: string;
  source_context?: string;
}

export interface UploadIntentResponse {
  success: boolean;
  data: {
    upload_url: string;
    file_key: string;
    bucket: string;
    expires_in: number;
    metadata: {
      file_name: string;
      file_type: string;
      file_size: number;
      icon: string;
      resolved_group_id: string;
      user_id: string;
      workplace_id: string;
    };
  };
  message: string;
}

export interface CompleteUploadRequest {
  file_key: string;
  file_name: string;
  file_type: string;
  file_size: number;
  group_id: string;
  source_context?: string;
}

export interface FileDownloadUrlResponse {
  success: boolean;
  data: {
    type: 'file' | 'note';
    download_url?: string;
    cdn_url?: string;
    file_name: string;
    file_type?: string;
    file_size?: number;
    expires_in?: number;
    content?: any; // For notes
  };
  message: string;
} 