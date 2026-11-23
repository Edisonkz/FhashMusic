import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { SongResult } from '../../../search/models/search-result.model';
import { DurationPipe } from '../../../../shared/pipes/duration.pipe';
import { PlayerStore } from '../../../../core/services/player.store';

@Component({
  selector: 'app-song-list',
  standalone: true,
  imports: [DurationPipe],
  templateUrl: './song-list.component.html',
  styleUrl: './song-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SongListComponent {
  protected readonly player = inject(PlayerStore);

  readonly songs = input.required<SongResult[]>();
  readonly playRequested = output<SongResult>();
  readonly downloadRequested = output<SongResult>();
  readonly removeRequested = output<string>();

  isCurrent(songId: string): boolean {
    return this.player.currentTrack()?.id === songId;
  }

  isPlaying(songId: string): boolean {
    return this.isCurrent(songId) && this.player.isPlaying();
  }
}
