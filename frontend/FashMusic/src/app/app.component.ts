import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LibraryService } from './features/library/services/library.service';
import { DownloadService } from './features/download/services/download.service';
import { SearchService } from './features/search/services/search.service';
import { PlayerStore } from './core/services/player.store';
import { AudioPlayerComponent } from './shared/components/audio-player/audio-player.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AudioPlayerComponent, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  protected readonly title = signal('FhashMusic');
  protected readonly library = inject(LibraryService);
  protected readonly downloads = inject(DownloadService);
  protected readonly search = inject(SearchService);
  protected readonly player = inject(PlayerStore);
}
