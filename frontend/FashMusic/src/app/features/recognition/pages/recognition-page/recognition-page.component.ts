import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { SongResult } from '../../../search/models/search-result.model';
import { DEMO_CATALOG } from '../../../../core/data/demo-catalog.data';
import { PlayerStore } from '../../../../core/services/player.store';
import { LibraryService } from '../../../library/services/library.service';
import { DownloadService } from '../../../download/services/download.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DurationPipe } from '../../../../shared/pipes/duration.pipe';

interface RecognitionMatch {
  song: SongResult;
  confidence: number;
  source: 'mic' | 'file';
  matchedAt: string;
}

@Component({
  selector: 'app-recognition-page',
  standalone: true,
  imports: [DurationPipe],
  templateUrl: './recognition-page.component.html',
  styleUrl: './recognition-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecognitionPageComponent implements OnDestroy {
  private readonly player = inject(PlayerStore);
  protected readonly library = inject(LibraryService);
  private readonly downloads = inject(DownloadService);
  private readonly toast = inject(ToastService);

  protected readonly Math = Math;
  protected readonly isListening = signal(false);
  protected readonly statusHint = signal('Toca el radar acústico o sube un fragmento de audio');
  protected readonly waveLevels = signal<number[]>([24, 38, 56, 44, 72, 48, 82, 62, 42, 66, 46, 30, 52, 34]);
  protected readonly latestMatch = signal<RecognitionMatch | null>({
    song: DEMO_CATALOG[10] ?? DEMO_CATALOG[0],
    confidence: 97,
    source: 'mic',
    matchedAt: 'Reciente'
  });
  protected readonly history = signal<RecognitionMatch[]>([
    { song: DEMO_CATALOG[0], confidence: 96, source: 'mic', matchedAt: 'Hoy' },
    { song: DEMO_CATALOG[1], confidence: 94, source: 'file', matchedAt: 'Hoy' },
    { song: DEMO_CATALOG[5], confidence: 92, source: 'mic', matchedAt: 'Hoy' }
  ]);

  private waveTimer: ReturnType<typeof setInterval> | null = null;
  private matchTimer: ReturnType<typeof setTimeout> | null = null;
  private mediaStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;

  async toggleListening(): Promise<void> {
    if (this.isListening()) {
      this.stopListening('Escucha detenida');
      return;
    }

    this.isListening.set(true);
    this.statusHint.set('Analizando firma acústica...');

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.startLiveAnalyser(this.mediaStream);
      } else {
        this.startSimulatedWaves();
      }
    } catch {
      this.statusHint.set('Analizando firma acústica (modo studio)...');
      this.startSimulatedWaves();
    }

    this.matchTimer = setTimeout(() => {
      this.completeRecognition('mic');
    }, 3000);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.stopListening();
    this.isListening.set(true);
    this.statusHint.set(`Analizando "${file.name}"...`);
    this.startSimulatedWaves();

    this.matchTimer = setTimeout(() => {
      this.completeRecognition('file', file.name);
      input.value = '';
    }, 1800);
  }

  playSong(song: SongResult): void {
    this.player.playTrack(song, DEMO_CATALOG);
  }

  saveSong(song: SongResult): void {
    this.library.toggleLibrary(song);
  }

  downloadSong(song: SongResult): void {
    this.downloads.startDownload(song, 'mp3');
  }

  ngOnDestroy(): void {
    this.stopListening();
  }

  private startLiveAnalyser(stream: MediaStream): void {
    this.audioCtx = new AudioContext();
    const source = this.audioCtx.createMediaStreamSource(stream);
    const analyser = this.audioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    this.waveTimer = setInterval(() => {
      analyser.getByteFrequencyData(data);
      const bars = Array.from({ length: 14 }, (_, idx) => {
        const val = data[idx] ?? 24;
        return Math.max(16, Math.min(100, Math.round((val / 255) * 100)));
      });
      this.waveLevels.set(bars);
    }, 90);
  }

  private startSimulatedWaves(): void {
    this.waveTimer = setInterval(() => {
      const bars = Array.from({ length: 14 }, () => Math.floor(20 + Math.random() * 78));
      this.waveLevels.set(bars);
    }, 110);
  }

  private completeRecognition(source: 'mic' | 'file', fileName?: string): void {
    const pool = DEMO_CATALOG;
    let pick = pool[Math.floor(Math.random() * pool.length)];

    if (fileName) {
      const lower = fileName.toLowerCase();
      const matched = pool.find(
        (s) => lower.includes(s.title.toLowerCase()) || lower.includes(s.uploader.toLowerCase())
      );
      if (matched) pick = matched;
    }

    const match: RecognitionMatch = {
      song: pick,
      confidence: Math.floor(92 + Math.random() * 7),
      source,
      matchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.stopListening('¡Coincidencia encontrada!');
    this.latestMatch.set(match);
    this.history.update((prev) => [match, ...prev.filter((h) => h.song.id !== pick.id)].slice(0, 5));
    this.toast.success('Canción identificada', `${pick.uploader} — ${pick.title}`);
  }

  private stopListening(hint?: string): void {
    if (this.waveTimer) {
      clearInterval(this.waveTimer);
      this.waveTimer = null;
    }
    if (this.matchTimer) {
      clearTimeout(this.matchTimer);
      this.matchTimer = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.isListening.set(false);
    if (hint) {
      this.statusHint.set(hint);
    }
  }
}
