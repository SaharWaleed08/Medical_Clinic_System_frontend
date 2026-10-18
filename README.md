# WellCare Clinic — Angular frontend

Angular 20 (standalone components, signals) frontend for the Spring Boot `medical_clinic_system` project.
Arabic / English (RTL / LTR), light / dark mode, and a different set of pages for Admin, Doctor and Patient.
Works with the JWT version of the backend (login returns `id, name, role, token`; every request sends `Authorization: Bearer <token>`).

## 1) Backend changes (files in `backend-changes/`)

1. `SecurityConfig.patch.txt` — enable CORS in the security chain + public `GET /api/specializations`.
2. `AppointmentGetController.java` (+ `AppointmentService.addition.txt`, `AppointmentRepository.addition.txt`) —
   the current controller has two handlers on the same URL shape (`/{status}` and `/{id}`), so Spring answers 500,
   and there is no endpoint for the admin to list appointments. The fix is `GET /api/appointments?status=&start=&end=`.

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

- **Doctor**: on "My appointments", a CONFIRMED / COMPLETED appointment has an "Add record" button (POST /api/medical-record).
  On the Records page each record has "+ Prescription" (POST /api/prescription) and delete buttons.
- **Patient**: "My medical record" shows their own records and prescriptions. It needs two endpoints that are in
  `backend-changes/PatientRecordsController.java` (+ `RecordsService.additions.txt` for the repository/service methods):
  `GET /api/patients/{id}/medical-records` and `GET /api/patients/{id}/prescriptions`.

## Known gaps in the backend

- `GET /api/medical-records` and `/api/prescriptions` (doctor) return **everyone's** data, not only the logged-in doctor's.
- `DoctorResponse` has no `yearsOfExperience`; sorting by experience works, but the number is not shown.
- The API caps page size at 10, so the frontend loads extra pages when it needs everything (booking, dashboards).
