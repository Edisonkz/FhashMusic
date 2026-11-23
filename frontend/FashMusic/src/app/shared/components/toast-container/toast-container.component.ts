import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [class]="'toast-item toast-' + toast.type" role="status">
          <div class="toast-dot"></div>
          <div class="toast-copy">
            <strong class="toast-title">{{ toast.title }}</strong>
            @if (toast.message) {
              <span class="toast-msg">{{ toast.message }}</span>
            }
          </div>
          <button
            type="button"
            class="toast-close"
            (click)="toastService.dismiss(toast.id)"
            aria-label="Cerrar notificación">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 1200;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      width: min(360px, calc(100vw - 2rem));
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.7rem;
      padding: 0.8rem 0.95rem;
      border-radius: var(--radius-md);
      background: rgba(20, 20, 34, 0.94);
      backdrop-filter: blur(14px);
      border: 1px solid var(--border-default);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
      animation: fadeSlideUp 0.22s var(--ease-out);
    }
    .toast-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 0.4rem;
      flex-shrink: 0;
    }
    .toast-success .toast-dot { background: var(--color-success); box-shadow: 0 0 10px var(--color-success); }
    .toast-info .toast-dot { background: var(--color-primary-light); box-shadow: 0 0 10px var(--color-primary); }
    .toast-warning .toast-dot { background: var(--color-warning); }
    .toast-error .toast-dot { background: var(--color-danger); }
    .toast-copy {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      min-width: 0;
      flex: 1;
    }
    .toast-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text);
    }
    .toast-msg {
      font-size: 0.78rem;
      color: var(--color-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .toast-close {
      background: transparent;
      border: none;
      color: var(--color-text-muted);
      font-size: 1.1rem;
      line-height: 1;
      padding: 0 0.2rem;
    }
    .toast-close:hover { color: var(--color-text); }
  `]
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
}
