import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type LibrarySort = 'recent' | 'title' | 'duration';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterPanelComponent {
  readonly searchChanged = output<string>();
  readonly sortChanged = output<LibrarySort>();

  protected readonly searchQuery = signal('');
  protected readonly selectedSort = signal<LibrarySort>('recent');

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchChanged.emit(value);
  }

  selectSort(sort: LibrarySort): void {
    this.selectedSort.set(sort);
    this.sortChanged.emit(sort);
  }
}
