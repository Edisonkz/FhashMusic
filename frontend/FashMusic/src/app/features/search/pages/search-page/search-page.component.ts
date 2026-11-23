import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SearchService } from '../../services/search.service';
import { SongResult } from '../../models/search-result.model';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { ResultGalleryComponent } from '../../components/result-gallery/result-gallery.component';
import { DownloadService } from '../../../download/services/download.service';
import { LibraryService } from '../../../library/services/library.service';
import { PlayerStore } from '../../../../core/services/player.store';
import { DEMO_CATALOG } from '../../../../core/data/demo-catalog.data';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [SearchBarComponent, ResultGalleryComponent],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPageComponent {
  private readonly searchService = inject(SearchService);
  private readonly downloadService = inject(DownloadService);
  private readonly libraryService = inject(LibraryService);
  private readonly playerStore = inject(PlayerStore);

  protected readonly quickGenres = ['Todos', 'Rock', 'Indie', 'Latino', 'Pop', 'Salsa', 'Clásicos'];
  protected readonly skeletonItems = [1, 2, 3, 4, 5, 6, 7, 8];

  protected readonly activeQuery = signal('');
  protected readonly selectedGenre = signal('Todos');
  protected readonly results = signal<SongResult[]>(DEMO_CATALOG);
  protected readonly isLoading = signal(false);
  protected readonly isDemoResponse = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly recentSearches = signal<string[]>(['Tame Impala', 'Radiohead', 'Frankie Ruiz']);

  protected readonly visibleSongs = computed(() => {
    const genre = this.selectedGenre();
    const list = this.results();
    if (genre === 'Todos') return list;
    return list.filter((s) => (s.genre ?? '').toLowerCase() === genre.toLowerCase());
  });

  protected readonly sectionHeading = computed(() => {
    const q = this.activeQuery().trim();
    if (q) return `Resultados para "${q}"`;
    const g = this.selectedGenre();
    return g === 'Todos' ? 'Tendencias y recomendados' : `Explorar · ${g}`;
  });

  onSearch(query: string): void {
    const clean = query.trim();
    this.activeQuery.set(clean);
    this.selectedGenre.set('Todos');
    this.error.set(null);

    if (!clean) {
      this.results.set(DEMO_CATALOG);
      this.isDemoResponse.set(true);
      return;
    }

    this.isLoading.set(true);
    this.recentSearches.update((prev) => [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 5));

    this.searchService.search(clean).subscribe({
      next: (response) => {
        this.results.set(response.results);
        this.isDemoResponse.set(Boolean(response.isDemo));
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los resultados. Verifica tu conexión e intenta de nuevo.');
        this.isLoading.set(false);
      }
    });
  }

  selectGenre(genre: string): void {
    this.selectedGenre.set(genre);
    if (this.activeQuery()) {
      this.activeQuery.set('');
      this.results.set(DEMO_CATALOG);
      this.isDemoResponse.set(true);
    }
  }

  handleDownload(event: { song: SongResult; format: 'mp3' | 'mp4' }): void {
    this.downloadService.startDownload(event.song, event.format);
  }

  handlePreview(song: SongResult): void {
    this.playerStore.playTrack(song, this.visibleSongs());
  }

  handleLibraryToggle(song: SongResult): void {
    this.libraryService.toggleLibrary(song);
  }
}
