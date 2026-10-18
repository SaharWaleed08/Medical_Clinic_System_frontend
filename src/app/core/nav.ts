import { Role } from './models';

export interface NavItem {
  path: string;
  roles: Role[];
  label: Partial<Record<Role, string>>;
  sub: Partial<Record<Role, string>>;
  title?: string; // overrides label as the page title
}
const ALL: Role[] = ['ADMIN', 'DOCTOR', 'PATIENT'];

/** Which pages each role sees (sidebar + page titles). Route guards use the same roles. */
export const NAV: NavItem[] = [
  { path: 'dashboard', roles: ALL, title: 'page.overview',
    label: { ADMIN: 'nav.dashboard', DOCTOR: 'nav.dashboard', PATIENT: 'nav.dashboard' },
    sub: { ADMIN: 'sub.dash.ADMIN', DOCTOR: 'sub.dash.DOCTOR', PATIENT: 'sub.dash.PATIENT' } },
  { path: 'doctors', roles: ['ADMIN'], label: { ADMIN: 'nav.doctors' }, sub: { ADMIN: 'sub.doctors' } },
  { path: 'patients', roles: ['ADMIN', 'DOCTOR'], label: { ADMIN: 'nav.patients', DOCTOR: 'nav.myPatients' },
    sub: { ADMIN: 'sub.patients', DOCTOR: 'sub.myPatients' } },
  { path: 'book', roles: ['PATIENT'], label: { PATIENT: 'nav.book' }, sub: { PATIENT: 'sub.book' } },
  { path: 'appointments', roles: ALL,
    label: { ADMIN: 'nav.appointments', DOCTOR: 'nav.myAppointments', PATIENT: 'nav.myAppointments' },
    sub: { ADMIN: 'sub.app.ADMIN', DOCTOR: 'sub.app.DOCTOR', PATIENT: 'sub.app.PATIENT' } },
  { path: 'records', roles: ['DOCTOR', 'PATIENT'], label: { DOCTOR: 'nav.records', PATIENT: 'nav.myRecord' },
    sub: { DOCTOR: 'sub.rec.DOCTOR', PATIENT: 'sub.rec.PATIENT' } },
  { path: 'availability', roles: ['DOCTOR'], label: { DOCTOR: 'nav.availability' }, sub: { DOCTOR: 'sub.av' } },
  { path: 'specializations', roles: ['ADMIN'], label: { ADMIN: 'nav.specializations' }, sub: { ADMIN: 'sub.spec' } },
];
