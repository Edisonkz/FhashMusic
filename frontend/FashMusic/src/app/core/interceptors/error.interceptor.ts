import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      // Captura y log de errores HTTP globales. Podría expandirse para lanzar notificaciones toast.
      console.error('Error interceptado HTTP:', error);
      return throwError(() => error);
    })
  );
};
