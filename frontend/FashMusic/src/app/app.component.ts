import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LibraryService } from './features/library/services/library.service';
import { DownloadService } from './features/download/services/download.service';
import { SearchService } from './features/search/services/search.service';
import { PlayerStore } from './core/services/player.store';
import { ToastService } from './core/services/toast.service';
import { SongResult } from './features/search/models/search-result.model';
import { AudioPlayerComponent } from './shared/components/audio-player/audio-player.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, RouterOutlet, RouterLink, RouterLinkActive, AudioPlayerComponent, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly library = inject(LibraryService);
  protected readonly downloads = inject(DownloadService);
  protected readonly search = inject(SearchService);
  protected readonly player = inject(PlayerStore);

  protected readonly quickQuery = signal('');
  protected readonly warmAmbient = signal(false);

  submitQuickSearch(): void {
    const q = this.quickQuery().trim();
    this.router.navigate(['/search'], { queryParams: q ? { q } : {} });
  }

  playRecent(song: SongResult): void {
    this.player.playTrack(song, this.player.recentTracks());
  }

  showNotifications(): void {
    const active = this.downloads.activeCount();
    const saved = this.library.count();
    this.toast.info(
      'Estado de FhashMusic',
      `${saved} pistas en biblioteca · ${active} descargas activas`
    );
  }

  showAudioSettings(): void {
    this.toast.info('Calidad de audio', 'Salida configurada en MP3 320 kbps · Metadatos ID3 + portada');
  }

  toggleAmbient(): void {
    this.warmAmbient.update((v) => !v);
    this.toast.info(
      this.warmAmbient() ? 'Ambiente cálido activado' : 'Ambiente pizarra activado'
    );
  }
}
