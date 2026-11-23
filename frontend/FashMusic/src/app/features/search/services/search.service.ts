import { Injectable, inject, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, catchError, delay, of, tap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { DEMO_CATALOG } from '../../../core/data/demo-catalog.data';
import { SearchResponse } from '../models/search-result.model';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly api = inject(ApiService);
  readonly isBackendOnline = signal<boolean | null>(null);

  search(query: string, limit = 12): Observable<SearchResponse> {
    const cleanQuery = query.trim();
    const params = new HttpParams()
      .set('q', cleanQuery)
      .set('limit', limit);

    return this.api.get<SearchResponse>('/api/v1/search/', params).pipe(
      tap(() => this.isBackendOnline.set(true)),
      catchError(() => {
        this.isBackendOnline.set(false);
        const normalized = cleanQuery.toLowerCase();
        const filtered = DEMO_CATALOG.filter(
          (song) =>
            song.title.toLowerCase().includes(normalized) ||
            song.uploader.toLowerCase().includes(normalized) ||
            (song.genre ?? '').toLowerCase().includes(normalized)
        );
        const results = (filtered.length > 0 ? filtered : DEMO_CATALOG).slice(0, limit);

        return of<SearchResponse>({
          results,
          total: results.length,
          query: cleanQuery,
          cached: false,
          isDemo: true
        }).pipe(delay(260));
      })
    );
  }
}
