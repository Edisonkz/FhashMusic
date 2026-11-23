import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('adds and dismisses toasts', () => {
    service.show('Guardado', 'success', 'Pista añadida', 0);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].title).toBe('Guardado');

    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(0);
  });

  it('caps the stack at 4 visible toasts', () => {
    for (let i = 1; i <= 6; i++) {
      service.show(`Toast ${i}`, 'info', undefined, 0);
    }
    expect(service.toasts().length).toBe(4);
    expect(service.toasts()[3].title).toBe('Toast 6');
  });
});
