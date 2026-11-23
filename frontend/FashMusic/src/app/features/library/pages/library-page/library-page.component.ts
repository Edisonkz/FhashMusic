import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LibraryService } from '../../services/library.service';
import { DownloadService } from '../../../download/services/download.service';
import { PlayerStore } from '../../../../core/services/player.store';
import { SongResult } from '../../../search/models/search-result.model';
import { FilterPanelComponent, LibrarySort } from '../../components/filter-panel/filter-panel.component';
import { SongListComponent } from '../../components/song-list/song-list.component';
import { DurationPipe } from '../../../../shared/pipes/duration.pipe';

@Component({
  selector: 'app-library-page',
  standalone: true,
  imports: [RouterLink, FilterPanelComponent, SongListComponent, DurationPipe],
  templateUrl: './library-page.component.html',
  styleUrl: './library-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibraryPageComponent implements OnInit {
  protected readonly library = inject(LibraryService);
  private readonly downloads = inject(DownloadService);
  private readonly player = inject(PlayerStore);

  protected readonly query = signal('');
  protected readonly sortBy = signal<LibrarySort>('recent');
  protected readonly selectedQuality = signal<'FLAC' | '320' | '128'>('320');
  protected readonly qualityOptions = ['FLAC', '320', '128'] as const;

  protected readonly filteredSongs = computed(() => {
    const q = this.query().trim().toLowerCase();
    const sort = this.sortBy();
    let list = [...this.library.songs()];

    if (q) {
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.uploader.toLowerCase().includes(q) ||
          (s.genre ?? '').toLowerCase().includes(q)
      );
    }

    if (sort === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'duration') {
      list.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    }

    return list;
  });

  ngOnInit(): void {
    this.library.refresh();
  }

  playAll(): void {
    const list = this.filteredSongs();
    if (list.length > 0) {
      this.player.playTrack(list[0], list);
    }
  }

  handlePlay(song: SongResult): void {
    this.player.playTrack(song, this.filteredSongs());
  }

  handleDownload(song: SongResult): void {
    this.downloads.startDownload(song, 'mp3');
  }

  handleRemove(songId: string): void {
    this.library.removeFromLibrary(songId);
  }
}
