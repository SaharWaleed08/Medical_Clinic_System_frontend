import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { I18n, TPipe } from '../core/i18n';
import { Appointment, MedicalRecord, Prescription, fmtDT, todayStr } from '../core/models';
import { Toast } from '../core/toast';

/**
 * Doctor: sees all records, adds prescriptions to a record, can delete.
 * Patient: sees only their own records and prescriptions (GET /api/patients/{id}/medical-records, /prescriptions).
 */
@Component({
  selector: 'app-records',
  imports: [FormsModule, TPipe],
  template: `
    <div class="panel">
      <div class="panel-head"><div><h2>{{ 'r.records' | t }}</h2><div class="sub">{{ isDoctor ? 'GET /api/medical-records' : 'GET /api/patients/{id}/medical-records' }}</div></div>
        @if (isDoctor) { <div class="tools"><button class="btn btn-primary" type="button" (click)="openRecord()">+ {{ 'rec.add' | t }}</button></div> }
      </div>
      <table>
        <thead><tr>@if (isDoctor) { <th>{{ 'a.patient' | t }}</th> }<th>{{ 'r.diagnosis' | t }}</th><th>{{ 'r.notes' | t }}</th>@if (isDoctor) { <th></th> }</tr></thead>
        <tbody>
          @for (r of records(); track r.medicalRecordID) {
            <tr>
              @if (isDoctor) { <td class="cell-main">{{ nameOf(r.patientID) }}</td> }
              <td [class.cell-main]="!isDoctor">{{ r.diagnosis }}</td><td>{{ r.medicalNotes }}</td>
              @if (isDoctor) {
                <td><div class="mini-actions">
                  <button class="mini" type="button" (click)="openRx(r)">{{ 'rx.add' | t }}</button>
                  <button class="icon-btn" type="button" (click)="removeRecord(r)">🗑</button>
                </div></td>
              }
            </tr>
          }
        </tbody>
      </table>
      @if (!records().length) { <div class="empty">{{ (loading() ? 'c.loading' : 'c.empty') | t }}</div> }
    </div>

    <div class="panel">
      <div class="panel-head"><div><h2>{{ 'r.rx' | t }}</h2><div class="sub">{{ isDoctor ? 'GET /api/prescriptions' : 'GET /api/patients/{id}/prescriptions' }}</div></div>
        @if (isDoctor) { <div class="tools"><button class="btn btn-primary" type="button" (click)="openRx()">+ {{ 'rx.addTitle' | t }}</button></div> }
      </div>
      <table>
        <thead><tr><th>{{ 'r.diagnosis' | t }}</th><th>{{ 'r.med' | t }}</th><th>{{ 'r.dosage' | t }}</th><th>{{ 'r.freq' | t }}</th><th>{{ 'r.dur' | t }}</th><th>{{ 'r.instr' | t }}</th>@if (isDoctor) { <th></th> }</tr></thead>
        <tbody>
          @for (p of prescriptions(); track p.prescriptionID) {
            <tr>
              <td>{{ diagnosisOf(p.recordID) }}</td><td class="cell-main">{{ p.medicationName }}</td><td>{{ p.dosage }}</td><td>{{ p.frequency }}</td><td>{{ p.treatmentDuration }}</td><td>{{ p.additionalInstruction }}</td>
              @if (isDoctor) { <td class="row-actions"><button class="icon-btn" type="button" (click)="removeRx(p)">🗑</button></td> }
            </tr>
          }
        </tbody>
      </table>
      @if (!prescriptions().length) { <div class="empty">{{ (loading() ? 'c.loading' : 'c.empty') | t }}</div> }
    </div>

    @if (rec(); as f) {
      <div class="modal-bg" (click)="rec.set(null)">
        <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="saveRecord()">
          <h3>{{ 'rec.addTitle' | t }}</h3>
          <div class="modal-body">
            <div class="field">
              <label>{{ 'rec.pickAppt' | t }}</label>
              <select name="ap" [(ngModel)]="f.appointmentID" required>
                <option value="" disabled>{{ (apptsLoading() ? 'c.loading' : 'rec.pickAppt') | t }}</option>
                @for (a of appts(); track a.id) { <option [value]="a.id">{{ a.patientName }} · {{ fmt(a.appointmentDateTime) }}</option> }
              </select>
              @if (!apptsLoading() && !appts().length) { <div class="field-hint">{{ 'rec.noAppts' | t }}</div> }
            </div>
            <div class="field"><label>{{ 'r.diagnosis' | t }}</label><input name="d" [(ngModel)]="f.diagnosis" required></div>
            <div class="field"><label>{{ 'r.notes' | t }}</label><textarea name="n" [(ngModel)]="f.medicalNotes" required></textarea></div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-ghost" type="button" (click)="rec.set(null)">{{ 'c.cancel' | t }}</button>
            <button class="btn btn-primary" type="submit" [disabled]="!f.appointmentID">{{ 'c.save' | t }}</button>
          </div>
        </form>
      </div>
    }

    @if (rx(); as f) {
      <div class="modal-bg" (click)="rx.set(null)">
        <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="saveRx()">
          <h3>{{ 'rx.addTitle' | t }}</h3>
          <div class="modal-body">
            <div class="field">
              <label>{{ 'rx.pickRecord' | t }}</label>
              <select name="rid" [(ngModel)]="f.recordID" required>
                <option value="" disabled>{{ 'rx.pickRecord' | t }}</option>
                @for (r of records(); track r.medicalRecordID) { <option [value]="r.medicalRecordID">{{ nameOf(r.patientID) }} · {{ r.diagnosis }}</option> }
              </select>
              @if (!records().length) { <div class="field-hint">{{ 'rx.needRecord' | t }}</div> }
            </div>
            <div class="field"><label>{{ 'r.med' | t }}</label><input name="m" [(ngModel)]="f.medicationName" required></div>
            <div class="field-row">
              <div class="field"><label>{{ 'r.dosage' | t }}</label><input type="number" min="1" name="d" [(ngModel)]="f.dosage" required></div>
              <div class="field"><label>{{ 'r.freq' | t }}</label><input type="number" min="1" name="f" [(ngModel)]="f.frequency" required></div>
            </div>
            <div class="field"><label>{{ 'r.dur' | t }}</label><input type="number" min="1" name="t" [(ngModel)]="f.treatmentDuration" required></div>
            <div class="field"><label>{{ 'r.instr' | t }}</label><textarea name="i" [(ngModel)]="f.additionalInstruction" required></textarea></div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-ghost" type="button" (click)="rx.set(null)">{{ 'c.cancel' | t }}</button>
            <button class="btn btn-primary" type="submit" [disabled]="!f.recordID">{{ 'c.save' | t }}</button>
          </div>
        </form>
      </div>
    }`,
})
export class RecordsPage implements OnInit {
  private api = inject(Api);
  private auth = inject(Auth);
  private toast = inject(Toast);
  private i18n = inject(I18n);
  isDoctor = this.auth.role() === 'DOCTOR';
  records = signal<MedicalRecord[]>([]);
  prescriptions = signal<Prescription[]>([]);
  loading = signal(true);
  rx = signal<any>(null);
  rec = signal<any>(null);
  appts = signal<Appointment[]>([]);
  apptsLoading = signal(false);
  fmt = fmtDT;
  private names = new Map<string, string>();

  ngOnInit() { this.load(); }
  load() {
    const id = this.auth.session()!.id;
    const req = this.isDoctor
      ? forkJoin({ rec: this.api.medicalRecords(), rx: this.api.prescriptions(), pat: this.api.allPatients() })
      : forkJoin({ rec: this.api.patientMedicalRecords(id), rx: this.api.patientPrescriptions(id), pat: [[]] as any });
    req.subscribe({
      next: ({ rec, rx, pat }: any) => {
        (pat as any[]).forEach((p) => this.names.set(p.patientID, p.name));
        this.records.set(rec);
        this.prescriptions.set(rx);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
  nameOf(id: string) { return this.names.get(id) ?? id.slice(0, 8); }
  diagnosisOf(recordID: string) { return this.records().find((r) => r.medicalRecordID === recordID)?.diagnosis ?? ''; }

  /** Add a medical record: the doctor picks one of their confirmed / completed appointments. */
  openRecord() {
    this.rec.set({ appointmentID: '', diagnosis: '', medicalNotes: '' });
    this.apptsLoading.set(true);
    this.api.allDoctorAppointments(this.auth.session()!.id).subscribe({
      next: (list) => {
        const used = new Set(this.records().map((r) => r.appointmentID).filter(Boolean));
        this.appts.set(list.filter((a) => (a.status === 'CONFIRMED' || a.status === 'COMPLETED') && !used.has(a.id)));
        this.apptsLoading.set(false);
      },
      error: () => { this.appts.set([]); this.apptsLoading.set(false); },
    });
  }
  saveRecord() {
    const f = this.rec();
    this.api.createMedicalRecord({ appointmentID: f.appointmentID, diagnosis: f.diagnosis, medicalNotes: f.medicalNotes, recordCreationDate: todayStr() })
      .subscribe(() => { this.rec.set(null); this.toast.show(this.i18n.t('c.done')); this.load(); });
  }

  /** Add a prescription: from the header button (pick a record) or from a record row (record preselected). */
  openRx(r?: MedicalRecord) {
    this.rx.set({ recordID: r?.medicalRecordID ?? '', medicationName: '', dosage: null, frequency: null, treatmentDuration: null, additionalInstruction: '' });
  }
  saveRx() {
    this.api.createPrescription(this.rx()).subscribe(() => { this.rx.set(null); this.toast.show(this.i18n.t('c.done')); this.load(); });
  }
  removeRecord(r: MedicalRecord) {
    if (!confirm(this.i18n.t('c.confirmDelete'))) return;
    this.api.deleteMedicalRecord(r.medicalRecordID).subscribe(() => { this.toast.show(this.i18n.t('c.done')); this.load(); });
  }
  removeRx(p: Prescription) {
    if (!confirm(this.i18n.t('c.confirmDelete'))) return;
    this.api.deletePrescription(p.prescriptionID).subscribe(() => { this.toast.show(this.i18n.t('c.done')); this.load(); });
  }
}
