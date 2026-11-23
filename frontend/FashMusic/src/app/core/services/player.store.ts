import { Injectable, computed, inject, signal } from '@angular/core';
import { SongResult } from '../../features/search/models/search-result.model';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class PlayerStore {
  private readonly toast = inject(ToastService);
  private readonly audio = new Audio();
  private simTimer: ReturnType<typeof setInterval> | null = null;

  private readonly _currentTrack = signal<SongResult | null>(null);
  private readonly _queue = signal<SongResult[]>([]);
  private readonly _isPlaying = signal(false);
  private readonly _currentTime = signal(0);
  private readonly _duration = signal(0);
  private readonly _volume = signal(0.8);
  private readonly _isMuted = signal(false);
  private readonly _isDemoMode = signal(false);

  readonly currentTrack = this._currentTrack.asReadonly();
  readonly queue = this._queue.asReadonly();
  readonly isPlaying = this._isPlaying.asReadonly();
  readonly currentTime = this._currentTime.asReadonly();
  readonly duration = this._duration.asReadonly();
  readonly volume = this._volume.asReadonly();
  readonly isMuted = this._isMuted.asReadonly();
  readonly isDemoMode = this._isDemoMode.asReadonly();

  readonly progressPercent = computed(() => {
    const dur = this._duration();
    return dur > 0 ? Math.min(100, (this._currentTime() / dur) * 100) : 0;
  });

  readonly hasNext = computed(() => {
    const idx = this.currentIndex();
    return idx >= 0 && idx < this._queue().length - 1;
  });

  readonly hasPrevious = computed(() => this.currentIndex() > 0);

  private readonly currentIndex = computed(() => {
    const track = this._currentTrack();
    if (!track) return -1;
    return this._queue().findIndex((s) => s.id === track.id);
  });

  constructor() {
    this.audio.volume = this._volume();

    this.audio.addEventListener('timeupdate', () => {
      if (!this._isDemoMode()) {
        this._currentTime.set(this.audio.currentTime);
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (!this._isDemoMode() && Number.isFinite(this.audio.duration)) {
        this._duration.set(this.audio.duration);
      }
    });

    this.audio.addEventListener('ended', () => {
      this.handleTrackEnded();
    });
  }

  playTrack(song: SongResult, queue?: SongResult[]): void {
    const isSameTrack = this._currentTrack()?.id === song.id;

    if (queue && queue.length > 0) {
      this._queue.set(queue);
    } else if (!this._queue().some((s) => s.id === song.id)) {
      this._queue.update((q) => [song, ...q]);
    }

    if (isSameTrack) {
      this.togglePlay();
      return;
    }

    this.stopSimulation();
    this._currentTrack.set(song);
    this._currentTime.set(0);
    this._duration.set(song.duration || 180);
    this._isDemoMode.set(false);

    const streamUrl = `${environment.apiUrl.replace(/\/+$/, '')}/api/v1/download/stream/${song.id}`;
    this.audio.src = streamUrl;
    this.audio.load();

    this.safeAudioPlay(song, true);
  }

  togglePlay(): void {
    if (!this._currentTrack()) return;

    if (this._isPlaying()) {
      this.pause();
    } else {
      this.resume();
    }
  }

  pause(): void {
    this.audio.pause();
    this.stopSimulation();
    this._isPlaying.set(false);
  }

  resume(): void {
    const track = this._currentTrack();
    if (!track) return;

    if (this._isDemoMode()) {
      this._isPlaying.set(true);
      this.runSimulationTimer();
      return;
    }

    this.safeAudioPlay(track, false);
  }

  private safeAudioPlay(song: SongResult, notifyOnFallback: boolean): void {
    try {
      const result = this.audio.play();
      if (result && typeof result.then === 'function') {
        result
          .then(() => this._isPlaying.set(true))
          .catch(() => this.startSimulatedPlayback(song, notifyOnFallback));
      } else {
        this.startSimulatedPlayback(song, notifyOnFallback);
      }
    } catch {
      this.startSimulatedPlayback(song, notifyOnFallback);
    }
  }

  seek(seconds: number): void {
    const clamped = Math.max(0, Math.min(seconds, this._duration()));
    this._currentTime.set(clamped);
    if (!this._isDemoMode() && Number.isFinite(this.audio.duration)) {
      this.audio.currentTime = clamped;
    }
  }

  setVolume(value: number): void {
    const clamped = Math.max(0, Math.min(1, value));
    this._volume.set(clamped);
    this._isMuted.set(clamped === 0);
    this.audio.volume = clamped;
    this.audio.muted = clamped === 0;
  }

  toggleMute(): void {
    const nextMuted = !this._isMuted();
    this._isMuted.set(nextMuted);
    this.audio.muted = nextMuted;
  }

  next(): void {
    const idx = this.currentIndex();
    const list = this._queue();
    if (idx >= 0 && idx < list.length - 1) {
      this.playTrack(list[idx + 1]);
    }
  }

  previous(): void {
    if (this._currentTime() > 4) {
      this.seek(0);
      return;
    }
    const idx = this.currentIndex();
    const list = this._queue();
    if (idx > 0) {
      this.playTrack(list[idx - 1]);
    }
  }

  close(): void {
    this.pause();
    this.audio.src = '';
    this._currentTrack.set(null);
    this._currentTime.set(0);
    this._duration.set(0);
    this._isDemoMode.set(false);
  }

  private startSimulatedPlayback(song: SongResult, notify = true): void {
    this._isDemoMode.set(true);
    this._duration.set(song.duration || 210);
    this._isPlaying.set(true);
    this.runSimulationTimer();
    if (notify) {
      this.toast.info('Preescucha en modo demo', `Reproduciendo vista previa simulada de "${song.title}"`);
    }
  }

  private runSimulationTimer(): void {
    this.stopSimulation();
    this.simTimer = setInterval(() => {
      const nextTime = this._currentTime() + 1;
      if (nextTime >= this._duration()) {
        this.handleTrackEnded();
      } else {
        this._currentTime.set(nextTime);
      }
    }, 1000);
  }

  private stopSimulation(): void {
    if (this.simTimer !== null) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
  }

  private handleTrackEnded(): void {
    this.stopSimulation();
    if (this.hasNext()) {
      this.next();
    } else {
      this._isPlaying.set(false);
      this._currentTime.set(0);
    }
  }
}
