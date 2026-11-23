import { TestBed } from '@angular/core/testing';
import { PlayerStore } from './player.store';
import { SongResult } from '../../features/search/models/search-result.model';

describe('PlayerStore', () => {
  let store: PlayerStore;

  const tracks: SongResult[] = [
    {
      id: 't1',
      title: 'Track One',
      uploader: 'Artist A',
      duration: 200,
      duration_formatted: '3:20',
      url: 'https://youtu.be/t1',
      thumbnail: null
    },
    {
      id: 't2',
      title: 'Track Two',
      uploader: 'Artist B',
      duration: 180,
      duration_formatted: '3:00',
      url: 'https://youtu.be/t2',
      thumbnail: null
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(PlayerStore);
  });

  afterEach(() => {
    store.close();
  });

  it('manages volume, mute, seek, and queue navigation', () => {
    store.playTrack(tracks[0], tracks);
    expect(store.currentTrack()?.id).toBe('t1');
    expect(store.hasNext()).toBe(true);
    expect(store.hasPrevious()).toBe(false);

    store.seek(50);
    expect(store.currentTime()).toBe(50);
    expect(store.progressPercent()).toBe(25);

    store.setVolume(0.4);
    expect(store.volume()).toBe(0.4);
    expect(store.isMuted()).toBe(false);

    store.toggleMute();
    expect(store.isMuted()).toBe(true);

    store.next();
    expect(store.currentTrack()?.id).toBe('t2');
    expect(store.hasPrevious()).toBe(true);

    store.close();
    expect(store.currentTrack()).toBeNull();
  });
});
