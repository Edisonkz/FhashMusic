export type DownloadStatus = 'pending' | 'downloading' | 'converting' | 'completed' | 'failed';

export interface DownloadTask {
  song_id: string;
  title?: string;
  uploader?: string;
  thumbnail?: string | null;
  format: 'mp3' | 'mp4';
  status: DownloadStatus;
  progress: number;
  output_path: string;
  error_message: string;
  created_at?: number;
}
