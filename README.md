# WellCare Clinic — Angular frontend

Angular 20 (standalone components, signals) frontend for the Spring Boot `medical_clinic_system` project.
Arabic / English (RTL / LTR), light / dark mode, and a different set of pages for Admin, Doctor and Patient.
Works with the JWT version of the backend (login returns `id, name, role, token`; every request sends `Authorization: Bearer <token>`).

## 1) Backend

The frontend is written for the latest backend zip: JWT login (`id, name, role, token`), one active session per account,
`POST /api/auth/logout`, patient records/prescriptions endpoints, `GET /api/appointments?status=&start=&end=` for the admin,
and doctor-only lists that return only the logged-in doctor's records. Nothing else needs to change in the backend.
(The old files in `backend-changes/` were already applied; they are kept for reference.)

**Sessions:** the token lives 15 minutes (`security.jwt.expiration-ms`). The frontend logs out automatically when it expires,
and the Log out button calls `POST /api/auth/logout`. If someone closes the tab without logging out, the account stays
"already logged in" (409) until the token expires.

## 2) Run

```bash
npm install
npm start          # http://localhost:4200
```
Backend on `http://localhost:8080` (change it in `src/environments/environment.ts`). Node 20.19+ / 22.12+ / 24.

## Project layout

- `src/app/core/` — models (match the Java DTOs), `api.ts` (one method per endpoint), auth, guards, interceptor, i18n, theme, toast, `nav.ts` (pages per role)
- `src/app/layout/shell.ts` — sidebar + top bar
- `src/app/pages/` — login, register, dashboard, doctors, patients, appointments, records, specializations, availability, book
- `src/styles.scss` — palette and shared styles

## What each role sees (matches the backend rules)

- **Admin**: dashboard, doctors (add / edit / delete, filter by specialization, sort by name or experience), patients, appointments (filter by status, confirm / complete / cancel), specializations.
- **Doctor**: dashboard, my patients (from own appointments), my appointments (confirm / complete / no-show / cancel), medical records & prescriptions, my availability.
- **Patient**: dashboard, book appointment (specialization → doctor → date → free slot), my appointments (cancel).

## Records & prescriptions

- **Doctor** (Records page): "+ Add record" (choose one of your confirmed / completed appointments that has no record yet),
  "+ Prescription" on a record or at the top, delete buttons. "My appointments" also has an "Add record" button.
- **Patient**: "My medical record" shows their own records (with doctor and visit date) and prescriptions.

## Notes

- `DoctorResponse` has no `yearsOfExperience`; sorting by experience works, but the number is not shown.
- The API caps page size at 10, so the frontend loads extra pages when it needs everything (booking, dashboards).
