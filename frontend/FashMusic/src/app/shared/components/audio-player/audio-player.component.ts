import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PlayerStore } from '../../../core/services/player.store';
import { LibraryService } from '../../../features/library/services/library.service';
import { DownloadService } from '../../../features/download/services/download.service';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [DurationPipe],
  templateUrl: './audio-player.component.html',
  styleUrl: './audio-player.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AudioPlayerComponent {
  protected readonly player = inject(PlayerStore);
  protected readonly library = inject(LibraryService);
  protected readonly downloads = inject(DownloadService);

  onSeek(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.player.seek(parseFloat(el.value));
  }

  onVolumeChange(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.player.setVolume(parseFloat(el.value));
  }
}
