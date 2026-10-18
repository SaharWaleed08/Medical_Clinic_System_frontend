import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap, of } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Appointment, Availability, AvailableSlot, Doctor, MAX_SIZE, MedicalRecord, Page, PageQuery, Patient, Prescription, Specialization,
} from './models';

type Action = 'confirm' | 'cancel' | 'complete' | 'no-show';

/**
 * One method per backend endpoint.
 * Reads use plural paths (/api/doctors, /api/patients ...), writes use singular paths (/api/doctor, /api/patient ...),
 * exactly like the Spring controllers.
 */
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private paged<T>(path: string, q: PageQuery) {
    let params = new HttpParams().set('page', q.page).set('size', q.size);
    for (const k of ['name', 'specialization', 'status', 'start', 'end', 'sortBy', 'direction'] as const) {
      const v = q[k];
      if (v) params = params.set(k, v);
    }
    return this.http.get<Page<T>>(`${this.base}${path}`, { params });
  }
  private del(path: string) { return this.http.delete(`${this.base}${path}`, { responseType: 'text' }); }

  /** Loads every page (the API caps page size at 10) and returns all items. */
  all<T>(load: (page: number) => Observable<Page<T>>): Observable<T[]> {
    return load(0).pipe(
      switchMap((first) => {
        if (first.totalPages <= 1) return of(first.content);
        const rest = Array.from({ length: first.totalPages - 1 }, (_, i) => load(i + 1));
        return forkJoin(rest).pipe(map((pages) => [...first.content, ...pages.flatMap((p) => p.content)]));
      }),
    );
  }

  // doctors
  doctors(q: PageQuery) { return this.paged<Doctor>('/doctors', q); }
  allDoctors(specialization?: string) {
    return this.all((page) => this.doctors({ page, size: MAX_SIZE, sortBy: 'name', direction: 'asc', specialization }));
  }
  createDoctor(b: unknown) { return this.http.post<Doctor>(`${this.base}/doctor`, b); }
  updateDoctor(id: string, b: unknown) { return this.http.put<Doctor>(`${this.base}/doctor/${id}`, b); }
  deleteDoctor(id: string) { return this.del(`/doctor/${id}`); }
  doctorAppointments(id: string, q: PageQuery) { return this.paged<Appointment>(`/doctors/${id}/appointments`, q); }
  allDoctorAppointments(id: string) {
    return this.all((page) => this.doctorAppointments(id, { page, size: MAX_SIZE, sortBy: 'appointmentDateTime', direction: 'desc' }));
  }
  availableSlots(id: string, date: string) {
    return this.http.get<AvailableSlot[]>(`${this.base}/doctors/${id}/available-slots`, { params: { date } });
  }

  // patients
  patients(q: PageQuery) { return this.paged<Patient>('/patients', q); }
  allPatients() { return this.all((page) => this.patients({ page, size: MAX_SIZE, sortBy: 'name', direction: 'asc' })); }
  createPatient(b: unknown) { return this.http.post<Patient>(`${this.base}/patient`, b); }
  deletePatient(id: string) { return this.del(`/patient/${id}`); }
  patientAppointments(id: string, q: PageQuery) { return this.paged<Appointment>(`/patients/${id}/appointments`, q); }
  allPatientAppointments(id: string) {
    return this.all((page) => this.patientAppointments(id, { page, size: MAX_SIZE, sortBy: 'appointmentDateTime', direction: 'desc' }));
  }

  // appointments
  /** Admin list. Needs the fixed GET /api/appointments endpoint (see backend-changes/). */
  appointments(q: PageQuery) { return this.paged<Appointment>('/appointments', q); }
  createAppointment(b: unknown) { return this.http.post<Appointment>(`${this.base}/appointment`, b); }
  appointmentAction(id: string, a: Action) { return this.http.patch<Appointment>(`${this.base}/appointment/${id}/${a}`, {}); }

  // specializations
  specializations() { return this.http.get<Specialization[]>(`${this.base}/specializations`); }
  createSpecialization(b: unknown) { return this.http.post<Specialization>(`${this.base}/specialization`, b); }
  updateSpecialization(id: string, b: unknown) { return this.http.put<Specialization>(`${this.base}/specialization/${id}`, b); }
  deleteSpecialization(id: string) { return this.del(`/specialization/${id}`); }

  // records & prescriptions
  /** Doctor: all records / prescriptions */
  medicalRecords() { return this.http.get<MedicalRecord[]>(`${this.base}/medical-records`); }
  prescriptions() { return this.http.get<Prescription[]>(`${this.base}/prescriptions`); }
  /** Patient (or admin/doctor): needs the two endpoints in backend-changes/PatientRecordsController.java */
  patientMedicalRecords(id: string) { return this.http.get<MedicalRecord[]>(`${this.base}/patients/${id}/medical-records`); }
  patientPrescriptions(id: string) { return this.http.get<Prescription[]>(`${this.base}/patients/${id}/prescriptions`); }
  createMedicalRecord(b: unknown) { return this.http.post<MedicalRecord>(`${this.base}/medical-record`, b); }
  deleteMedicalRecord(id: string) { return this.del(`/medical-record/${id}`); }
  createPrescription(b: unknown) { return this.http.post<Prescription>(`${this.base}/prescription`, b); }
  deletePrescription(id: string) { return this.del(`/prescription/${id}`); }

  // availability
  availabilities() { return this.http.get<Availability[]>(`${this.base}/availabilities`); }
  createAvailability(b: unknown) { return this.http.post<Availability>(`${this.base}/availability`, b); }
  deleteAvailability(id: string) { return this.del(`/availability/${id}`); }
}
