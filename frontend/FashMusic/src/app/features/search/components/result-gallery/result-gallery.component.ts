import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SongResult } from '../../models/search-result.model';
import { SongCardComponent } from '../../../../shared/components/song-card/song-card.component';

@Component({
  selector: 'app-result-gallery',
  standalone: true,
  imports: [SongCardComponent],
  templateUrl: './result-gallery.component.html',
  styleUrl: './result-gallery.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultGalleryComponent {
  readonly songs = input.required<SongResult[]>();
  readonly downloadRequested = output<{ song: SongResult; format: 'mp3' | 'mp4' }>();
  readonly previewRequested = output<SongResult>();
  readonly libraryToggled = output<SongResult>();
}
