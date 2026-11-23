import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpParams } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl.replace(/\/+$/, '');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('normalizes paths and performs GET with params', () => {
    const params = new HttpParams().set('q', 'rock').set('limit', 5);
    service.get<{ ok: boolean }>('api/v1/search/', params).subscribe((res) => {
      expect(res.ok).toBe(true);
    });

    const req = httpMock.expectOne(`${baseUrl}/api/v1/search/?q=rock&limit=5`);
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true });
  });

  it('performs POST and DELETE requests cleanly', () => {
    service.post<{ id: string }>('/api/v1/library/', { id: 'abc' }).subscribe((res) => {
      expect(res.id).toBe('abc');
    });
    const postReq = httpMock.expectOne(`${baseUrl}/api/v1/library/`);
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body).toEqual({ id: 'abc' });
    postReq.flush({ id: 'abc' });

    service.delete<{ status: string }>('/api/v1/library/abc').subscribe((res) => {
      expect(res.status).toBe('deleted');
    });
    const delReq = httpMock.expectOne(`${baseUrl}/api/v1/library/abc`);
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush({ status: 'deleted' });
  });
});
