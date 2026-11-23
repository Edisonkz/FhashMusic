import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchBarComponent {
  readonly initialQuery = input<string>('');
  readonly isLoading = input<boolean>(false);
  readonly searchSubmitted = output<string>();

  protected readonly query = signal('');

  constructor() {
    effect(() => {
      const incoming = this.initialQuery();
      if (incoming !== this.query()) {
        this.query.set(incoming);
      }
    });
  }

  submit(): void {
    const clean = this.query().trim();
    if (clean) {
      this.searchSubmitted.emit(clean);
    }
  }

  clear(): void {
    this.query.set('');
    this.searchSubmitted.emit('');
  }
}
