import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RequestOptions {
  params?: HttpParams;
  headers?: HttpHeaders;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/+$/, '');

  private buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  get<T>(path: string, params: HttpParams = new HttpParams(), headers?: HttpHeaders): Observable<T> {
    return this.http.get<T>(this.buildUrl(path), { params, headers });
  }

  post<T>(path: string, body: unknown = {}, headers?: HttpHeaders): Observable<T> {
    return this.http.post<T>(this.buildUrl(path), body, { headers });
  }

  put<T>(path: string, body: unknown = {}, headers?: HttpHeaders): Observable<T> {
    return this.http.put<T>(this.buildUrl(path), body, { headers });
  }

  patch<T>(path: string, body: unknown = {}, headers?: HttpHeaders): Observable<T> {
    return this.http.patch<T>(this.buildUrl(path), body, { headers });
  }

  delete<T>(path: string, options?: RequestOptions): Observable<T> {
    return this.http.delete<T>(this.buildUrl(path), options);
  }
}
