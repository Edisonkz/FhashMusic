import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SearchService } from '../../services/search.service';
import { SongResult } from '../../models/search-result.model';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { ResultGalleryComponent } from '../../components/result-gallery/result-gallery.component';
import { DownloadService } from '../../../download/services/download.service';
import { LibraryService } from '../../../library/services/library.service';
import { PlayerStore } from '../../../../core/services/player.store';
import { ToastService } from '../../../../core/services/toast.service';
import { DEMO_CATALOG } from '../../../../core/data/demo-catalog.data';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [SearchBarComponent, ResultGalleryComponent],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly searchService = inject(SearchService);
  private readonly downloadService = inject(DownloadService);
  private readonly libraryService = inject(LibraryService);
  private readonly playerStore = inject(PlayerStore);
  private readonly toast = inject(ToastService);

  protected readonly quickGenres = ['Todos', 'Rock', 'Indie', 'Latino', 'Salsa', 'Clásicos'];
  protected readonly qualityOptions = ['FLAC', '320', '128'] as const;
  protected readonly skeletonItems = [1, 2, 3, 4, 5, 6];

  protected readonly activeQuery = signal('');
  protected readonly selectedGenre = signal('Todos');
  protected readonly selectedQuality = signal<'FLAC' | '320' | '128'>('320');
  protected readonly viewMode = signal<'list' | 'grid'>('list');
  protected readonly results = signal<SongResult[]>(DEMO_CATALOG);
  protected readonly isLoading = signal(false);
  protected readonly isDemoResponse = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly visibleSongs = computed(() => {
    const genre = this.selectedGenre();
    const list = this.results();
    if (genre === 'Todos') return list;
    return list.filter((s) => (s.genre ?? '').toLowerCase() === genre.toLowerCase());
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const q = params.get('q')?.trim() ?? '';
      if (q && q !== this.activeQuery()) {
        this.onSearch(q);
      }
    });
  }

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
    this.searchService.search(clean).subscribe({
      next: (response) => {
        this.results.set(response.results);
        this.isDemoResponse.set(Boolean(response.isDemo));
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los resultados. Intenta de nuevo.');
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

  selectQuality(q: 'FLAC' | '320' | '128'): void {
    this.selectedQuality.set(q);
    this.toast.info(`Calidad seleccionada: ${q === 'FLAC' ? 'FLAC Lossless' : q + ' kbps'}`);
  }

  saveAllVisible(): void {
    const list = this.visibleSongs();
    let added = 0;
    for (const song of list) {
      if (!this.libraryService.isSaved(song.id)) {
        this.libraryService.addToLibrary(song);
        added++;
      }
    }
    if (added === 0) {
      this.toast.info('Todo guardado', 'Estas pistas ya están en tu biblioteca');
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
