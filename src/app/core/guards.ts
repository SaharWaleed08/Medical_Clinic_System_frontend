import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './auth';
import { Role } from './models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  return auth.session() ? true : inject(Router).createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  return auth.session() ? inject(Router).createUrlTree(['/app/dashboard']) : true;
};

/** Route data: { roles: ['ADMIN', ...] } — blocks pages not allowed for the logged-in role. */
export const roleGuard: CanActivateFn = (route) => {
  const role = inject(Auth).role();
  const allowed = (route.data['roles'] as Role[] | undefined) ?? [];
  return role && allowed.includes(role) ? true : inject(Router).createUrlTree(['/app/dashboard']);
};
