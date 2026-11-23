import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DownloadTask } from '../models/download-task.model';
import { SongResult } from '../../search/models/search-result.model';

@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  private readonly _tasks = signal<DownloadTask[]>([
    {
      song_id: 'pFptt7Cargc',
      title: 'Let It Happen',
      uploader: 'Tame Impala',
      thumbnail: 'https://i.ytimg.com/vi/pFptt7Cargc/hqdefault.jpg',
      format: 'mp3',
      status: 'completed',
      progress: 100,
      output_path: 'downloads/Tame Impala - Let It Happen.mp3',
      error_message: '',
      created_at: Date.now() - 180000
    }
  ]);

  readonly tasks = this._tasks.asReadonly();
  readonly activeCount = computed(() =>
    this._tasks().filter((t) => t.status === 'pending' || t.status === 'downloading' || t.status === 'converting').length
  );
  readonly completedCount = computed(() =>
    this._tasks().filter((t) => t.status === 'completed').length
  );
  readonly failedCount = computed(() =>
    this._tasks().filter((t) => t.status === 'failed').length
  );

  startDownload(song: SongResult, format: 'mp3' | 'mp4'): void {
    const taskKey = `${song.id}_${format}_${Date.now()}`;
    const newTask: DownloadTask = {
      song_id: taskKey,
      title: song.title,
      uploader: song.uploader,
      thumbnail: song.thumbnail,
      format,
      status: 'pending',
      progress: 8,
      output_path: '',
      error_message: '',
      created_at: Date.now()
    };

    this._tasks.update((list) => [newTask, ...list]);
    this.toast.info(`Descarga iniciada (${format.toUpperCase()})`, `${song.uploader} — ${song.title}`);

    this.api.post<Partial<DownloadTask>>('/api/v1/download/', { song_id: song.id, format }).pipe(
      catchError(() => of(null))
    ).subscribe(() => {
      this.simulateProgress(taskKey, song, format);
    });
  }

  retryTask(taskId: string): void {
    const existing = this._tasks().find((t) => t.song_id === taskId);
    if (!existing) return;

    this.updateTask(taskId, { status: 'pending', progress: 10, error_message: '' });
    const songLike: SongResult = {
      id: taskId,
      title: existing.title || taskId,
      uploader: existing.uploader || 'YouTube',
      duration: 0,
      duration_formatted: '0:00',
      url: '',
      thumbnail: existing.thumbnail ?? null
    };
    this.simulateProgress(taskId, songLike, existing.format);
  }

  removeTask(taskId: string): void {
    this._tasks.update((list) => list.filter((t) => t.song_id !== taskId));
  }

  clearCompleted(): void {
    this._tasks.update((list) => list.filter((t) => t.status !== 'completed'));
    this.toast.info('Cola limpiada', 'Se removieron las descargas completadas');
  }

  private simulateProgress(taskKey: string, song: SongResult, format: 'mp3' | 'mp4'): void {
    const steps: Array<{ delay: number; progress: number; status: DownloadTask['status'] }> = [
      { delay: 450, progress: 28, status: 'downloading' },
      { delay: 1100, progress: 56, status: 'downloading' },
      { delay: 1850, progress: 82, status: 'converting' },
      { delay: 2650, progress: 100, status: 'completed' }
    ];

    for (const step of steps) {
      setTimeout(() => {
        const exists = this._tasks().some((t) => t.song_id === taskKey);
        if (!exists) return;

        if (step.status === 'completed') {
          const safeTitle = `${song.uploader} - ${song.title}`.replace(/[<>:"/\\|?*]/g, '');
          this.updateTask(taskKey, {
            status: 'completed',
            progress: 100,
            output_path: `downloads/${safeTitle}.${format}`
          });
          this.toast.success('Descarga lista', `${song.title}.${format}`);
        } else {
          this.updateTask(taskKey, {
            status: step.status,
            progress: step.progress
          });
        }
      }, step.delay);
    }
  }

  private updateTask(taskId: string, patch: Partial<DownloadTask>): void {
    this._tasks.update((list) =>
      list.map((t) => (t.song_id === taskId ? { ...t, ...patch } : t))
    );
  }
}
