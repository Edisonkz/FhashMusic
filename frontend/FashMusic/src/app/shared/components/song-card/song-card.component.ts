import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { SongResult } from '../../../features/search/models/search-result.model';
import { DurationPipe } from '../../pipes/duration.pipe';
import { HighlightOnHoverDirective } from '../../directives/highlight-on-hover.directive';
import { PlayerStore } from '../../../core/services/player.store';
import { LibraryService } from '../../../features/library/services/library.service';

@Component({
  selector: 'app-song-card',
  standalone: true,
  imports: [DurationPipe, HighlightOnHoverDirective],
  templateUrl: './song-card.component.html',
  styleUrl: './song-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SongCardComponent {
  private readonly player = inject(PlayerStore);
  private readonly library = inject(LibraryService);

  readonly song = input.required<SongResult>();
  readonly downloadRequested = output<{ song: SongResult; format: 'mp3' | 'mp4' }>();
  readonly previewRequested = output<SongResult>();
  readonly libraryToggled = output<SongResult>();

  protected readonly isCurrent = computed(() => this.player.currentTrack()?.id === this.song().id);
  protected readonly isPlaying = computed(() => this.isCurrent() && this.player.isPlaying());
  protected readonly isSaved = computed(() => this.library.savedIds().has(this.song().id));

  download(format: 'mp3' | 'mp4'): void {
    this.downloadRequested.emit({ song: this.song(), format });
  }

  preview(): void {
    this.previewRequested.emit(this.song());
  }

  toggleLibrary(): void {
    this.libraryToggled.emit(this.song());
  }
}
