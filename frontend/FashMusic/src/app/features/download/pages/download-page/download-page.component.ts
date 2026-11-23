import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DownloadService } from '../../services/download.service';
import { DownloadTask } from '../../models/download-task.model';
import { ProgressBarComponent } from '../../components/progress-bar/progress-bar.component';

type DownloadTab = 'all' | 'active' | 'completed' | 'failed';

@Component({
  selector: 'app-download-page',
  standalone: true,
  imports: [RouterLink, ProgressBarComponent],
  templateUrl: './download-page.component.html',
  styleUrl: './download-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DownloadPageComponent {
  protected readonly downloads = inject(DownloadService);
  protected readonly activeTab = signal<DownloadTab>('all');

  protected readonly filteredTasks = computed(() => {
    const tab = this.activeTab();
    const list = this.downloads.tasks();
    if (tab === 'active') {
      return list.filter((t) => t.status === 'pending' || t.status === 'downloading' || t.status === 'converting');
    }
    if (tab === 'completed') return list.filter((t) => t.status === 'completed');
    if (tab === 'failed') return list.filter((t) => t.status === 'failed');
    return list;
  });

  getStatusText(task: DownloadTask): string {
    switch (task.status) {
      case 'pending': return 'Preparando cola de extracción...';
      case 'downloading': return 'Descargando flujo de alta calidad';
      case 'converting': return `Incrustando portada JPG y convirtiendo a ${task.format.toUpperCase()}`;
      case 'completed': return task.output_path || 'Completado con metadatos ID3';
      case 'failed': return task.error_message || 'Error en la descarga';
    }
  }

  getBadgeClass(status: DownloadTask['status']): string {
    switch (status) {
      case 'completed': return 'badge badge-success';
      case 'failed': return 'badge badge-danger';
      default: return 'badge badge-primary';
    }
  }

  getStatusLabel(status: DownloadTask['status']): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'downloading': return 'Descargando';
      case 'converting': return 'Convirtiendo FFmpeg';
      case 'completed': return 'Completado';
      case 'failed': return 'Error';
    }
  }
}
