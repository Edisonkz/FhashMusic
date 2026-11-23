import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LibraryService } from './library.service';
import { SongResult } from '../../search/models/search-result.model';

describe('LibraryService', () => {
  let service: LibraryService;
  let httpMock: HttpTestingController;

  const sampleSong: SongResult = {
    id: 'unit_test_song_1',
    title: 'San Lucas',
    uploader: 'Kevin Kaarl',
    duration: 245,
    duration_formatted: '4:05',
    url: 'https://www.youtube.com/watch?v=unit_test_song_1',
    thumbnail: null,
    genre: 'Indie'
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(LibraryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach((r) => r.flush({}));
    localStorage.clear();
  });

  it('adds, checks saved state, and removes a song reactively', () => {
    const initialCount = service.count();

    service.addToLibrary(sampleSong);
    expect(service.isSaved(sampleSong.id)).toBe(true);
    expect(service.count()).toBe(initialCount + 1);

    // Duplicate add does not double-count
    service.addToLibrary(sampleSong);
    expect(service.count()).toBe(initialCount + 1);

    service.removeFromLibrary(sampleSong.id);
    expect(service.isSaved(sampleSong.id)).toBe(false);
    expect(service.count()).toBe(initialCount);
  });
});
