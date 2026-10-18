import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./pages/login').then((m) => m.LoginPage) },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./pages/register').then((m) => m.RegisterPage) },
  {
    path: 'app',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard').then((m) => m.DashboardPage) },
      { path: 'doctors', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./pages/doctors').then((m) => m.DoctorsPage) },
      { path: 'patients', canActivate: [roleGuard], data: { roles: ['ADMIN', 'DOCTOR'] }, loadComponent: () => import('./pages/patients').then((m) => m.PatientsPage) },
      { path: 'appointments', loadComponent: () => import('./pages/appointments').then((m) => m.AppointmentsPage) },
      { path: 'records', canActivate: [roleGuard], data: { roles: ['DOCTOR', 'PATIENT'] }, loadComponent: () => import('./pages/records').then((m) => m.RecordsPage) },
      { path: 'specializations', canActivate: [roleGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./pages/specializations').then((m) => m.SpecializationsPage) },
      { path: 'availability', canActivate: [roleGuard], data: { roles: ['DOCTOR'] }, loadComponent: () => import('./pages/availability').then((m) => m.AvailabilityPage) },
      { path: 'book', canActivate: [roleGuard], data: { roles: ['PATIENT'] }, loadComponent: () => import('./pages/book').then((m) => m.BookPage) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'app/dashboard' },
  { path: '**', redirectTo: 'app/dashboard' },
];
