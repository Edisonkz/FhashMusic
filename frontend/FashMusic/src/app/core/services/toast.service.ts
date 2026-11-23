import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: number;
  title: string;
  message?: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private nextId = 1;
  private readonly _toasts = signal<ToastItem[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(title: string, type: ToastType = 'info', message?: string, durationMs = 3600): void {
    const id = this.nextId++;
    const toast: ToastItem = { id, title, message, type };
    this._toasts.update((list) => [...list.slice(-3), toast]);

    if (durationMs > 0) {
      setTimeout(() => this.dismiss(id), durationMs);
    }
  }

  success(title: string, message?: string): void {
    this.show(title, 'success', message);
  }

  info(title: string, message?: string): void {
    this.show(title, 'info', message);
  }

  warning(title: string, message?: string): void {
    this.show(title, 'warning', message);
  }

  error(title: string, message?: string): void {
    this.show(title, 'error', message, 4500);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
