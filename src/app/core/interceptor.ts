import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Auth } from './auth';
import { SILENT } from './http-context';
import { I18n } from './i18n';
import { Toast } from './toast';

/** Adds the token (once the backend issues one) and shows backend error messages as a toast. */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const toast = inject(Toast);
  const i18n = inject(I18n);
  const token = auth.session()?.token;
  const r = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(r).pipe(
    catchError((e: HttpErrorResponse) => {
      if (req.context.get(SILENT)) return throwError(() => e);
      const expired = e.status === 401 && !!auth.session();
      if (expired) auth.logout(false);
      const msg = e.status === 0 ? i18n.t('err.network')
        : expired ? i18n.t('err.expired')
        : e.status === 409 && req.url.endsWith('/auth/login') ? i18n.t('err.activeSession')
        : (typeof e.error === 'object' && e.error?.message) || (e.status === 403 ? i18n.t('err.forbidden') : i18n.t('err.generic'));
      toast.error(msg);
      return throwError(() => e);
    }),
  );
};
