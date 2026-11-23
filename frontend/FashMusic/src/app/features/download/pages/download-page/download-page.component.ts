import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DownloadService } from '../../services/download.service';
import { DownloadTask } from '../../models/download-task.model';
import { ProgressBarComponent } from '../../components/progress-bar/progress-bar.component';

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

  getStatusText(task: DownloadTask): string {
    switch (task.status) {
      case 'pending': return 'En cola · preparando flujo...';
      case 'downloading': return 'Descargando audio de máxima calidad...';
      case 'converting': return `Convirtiendo a ${task.format.toUpperCase()} con FFmpeg + portada...`;
      case 'completed': return 'Descarga completada con metadatos';
      case 'failed': return task.error_message || 'Error en la descarga';
    }
  }

  getBadgeClass(status: DownloadTask['status']): string {
    switch (status) {
      case 'completed': return 'badge badge-success';
      case 'failed': return 'badge badge-danger';
      case 'converting': return 'badge badge-warning';
      default: return 'badge badge-primary';
    }
  }

  getStatusLabel(status: DownloadTask['status']): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'downloading': return 'Descargando';
      case 'converting': return 'Convirtiendo';
      case 'completed': return 'Completado';
      case 'failed': return 'Fallido';
    }
  }
}
