import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DownloadStatus } from '../../models/download-task.model';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressBarComponent {
  readonly progress = input.required<number>();
  readonly statusText = input<string>('Procesando...');
  readonly status = input<DownloadStatus>('downloading');
}
