import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DEMO_CATALOG } from '../../../core/data/demo-catalog.data';
import { ToastService } from '../../../core/services/toast.service';
import { SongResult } from '../../search/models/search-result.model';

const STORAGE_KEY = 'fhashmusic_library_v2';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  private readonly _songs = signal<SongResult[]>(this.loadInitialSongs());
  private readonly _isLoading = signal(false);

  readonly songs = this._songs.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly count = computed(() => this._songs().length);
  readonly totalDuration = computed(() =>
    this._songs().reduce((acc, s) => acc + (s.duration || 0), 0)
  );
  readonly savedIds = computed(() => new Set(this._songs().map((s) => s.id)));

  refresh(): void {
    this._isLoading.set(true);
    this.api.get<SongResult[]>('/api/v1/library/').pipe(
      tap((remoteSongs) => {
        if (Array.isArray(remoteSongs) && remoteSongs.length > 0) {
          this._songs.set(remoteSongs);
          this.persist(remoteSongs);
        }
      }),
      catchError(() => of(this._songs()))
    ).subscribe(() => {
      this._isLoading.set(false);
    });
  }

  isSaved(songId: string): boolean {
    return this.savedIds().has(songId);
  }

  addToLibrary(song: SongResult): void {
    if (this.isSaved(song.id)) {
      this.toast.info('Ya está en tu biblioteca', song.title);
      return;
    }

    const updated = [song, ...this._songs()];
    this._songs.set(updated);
    this.persist(updated);
    this.toast.success('Añadida a Mi Biblioteca', `${song.uploader} — ${song.title}`);

    this.api.post<unknown>('/api/v1/library/', song).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  removeFromLibrary(songId: string): void {
    const target = this._songs().find((s) => s.id === songId);
    const updated = this._songs().filter((s) => s.id !== songId);
    this._songs.set(updated);
    this.persist(updated);

    if (target) {
      this.toast.info('Eliminada de la biblioteca', target.title);
    }

    this.api.delete<unknown>(`/api/v1/library/${songId}`).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  toggleLibrary(song: SongResult): void {
    if (this.isSaved(song.id)) {
      this.removeFromLibrary(song.id);
    } else {
      this.addToLibrary(song);
    }
  }

  private loadInitialSongs(): SongResult[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SongResult[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage read errors
    }
    return DEMO_CATALOG.slice(0, 4);
  }

  private persist(songs: SongResult[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
    } catch {
      // Ignore storage write errors
    }
  }
}
