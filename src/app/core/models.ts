export type Role = 'ADMIN' | 'DOCTOR' | 'PATIENT';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
export type DayOfWeek = 'SATURDAY' | 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';

/** Spring Data Page<T> JSON shape */
export interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number; }

export interface LoginRequest { email: string; password: string; }
/** `role` (and optionally `token`) must be added to LoginResponse in the backend — see backend-changes/ */
export interface LoginResponse { id: string; name: string; role?: Role; token?: string; }

export interface Doctor { id: string; name: string; email: string; specialization?: string; }
export interface Patient { patientID: string; name: string; email: string; registrationDate: string; }
export interface Appointment {
  id: string; patientID: string; patientName: string; doctorID: string; doctorName: string;
  appointmentDateTime: string; reasonForVisit: string; status: AppointmentStatus;
}
export interface Specialization { specializationID: string; name: string; description: string; }
export interface MedicalRecord { medicalRecordID: string; patientID: string; appointmentID?: string; diagnosis: string; medicalNotes: string; }
export interface Prescription {
  prescriptionID: string; recordID: string; medicationName: string; dosage: number;
  frequency: number; treatmentDuration: number; additionalInstruction: string;
}
export interface Availability { availabilityID: string; doctorID: string; name: string; day: DayOfWeek; startTime: string; endTime: string; }
export interface AvailableSlot { startTime: string; }

export interface PageQuery {
  name?: string; specialization?: string; status?: string; start?: string; end?: string;
  page: number; size: number; sortBy?: string; direction?: 'asc' | 'desc';
}
/** The backend rejects size > 10 */
export const MAX_SIZE = 10;

export const DAYS: DayOfWeek[] = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export const statusClass = (s: AppointmentStatus): string =>
  ({ PENDING: 'pending', CONFIRMED: 'confirmed', CANCELLED: 'cancelled', COMPLETED: 'completed', NO_SHOW: 'noshow' }[s] ?? 'completed');

/** "2026-09-27T10:30:00" -> "2026-09-27 10:30" */
export const fmtDT = (v?: string | null): string => (v ? v.slice(0, 16).replace('T', ' ') : '');
export const todayStr = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** The backend expects dateOfBirth as dd-MM-yyyy; <input type="date"> gives yyyy-MM-dd */
export const toDMY = (v?: string | null): string | null => (v ? v.split('-').reverse().join('-') : null);
