import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { SongResult } from '../../models/search-result.model';
import { SongCardComponent } from '../../../../shared/components/song-card/song-card.component';
import { DurationPipe } from '../../../../shared/pipes/duration.pipe';
import { PlayerStore } from '../../../../core/services/player.store';
import { LibraryService } from '../../../library/services/library.service';

@Component({
  selector: 'app-result-gallery',
  standalone: true,
  imports: [SongCardComponent, DurationPipe],
  templateUrl: './result-gallery.component.html',
  styleUrl: './result-gallery.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultGalleryComponent {
  protected readonly player = inject(PlayerStore);
  protected readonly library = inject(LibraryService);

  readonly songs = input.required<SongResult[]>();
  readonly viewMode = input<'list' | 'grid'>('list');

  readonly downloadRequested = output<{ song: SongResult; format: 'mp3' | 'mp4' }>();
  readonly previewRequested = output<SongResult>();
  readonly libraryToggled = output<SongResult>();

  isCurrent(songId: string): boolean {
    return this.player.currentTrack()?.id === songId;
  }

  isPlaying(songId: string): boolean {
    return this.isCurrent(songId) && this.player.isPlaying();
  }
}
