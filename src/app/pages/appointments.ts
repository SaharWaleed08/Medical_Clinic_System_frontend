import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { I18n, TPipe } from '../core/i18n';
import { Appointment, AppointmentStatus, MAX_SIZE, PageQuery, fmtDT, statusClass, todayStr } from '../core/models';
import { Toast } from '../core/toast';
import { Pager } from '../shared/pager';

type Action = 'confirm' | 'cancel' | 'complete' | 'no-show';

@Component({
  selector: 'app-appointments',
  imports: [FormsModule, TPipe, Pager],
  template: `
    <div class="panel">
      <div class="panel-head">
        <div><h2>{{ (role === 'ADMIN' ? 'nav.appointments' : 'nav.myAppointments') | t }}</h2><div class="sub">{{ source }}</div></div>
        <div class="tools">
          <select class="select" [ngModel]="status()" (ngModelChange)="setStatus($event)">
            <option value="">{{ 'c.allStatuses' | t }}</option>
            @for (s of statuses; track s) { <option [value]="s">{{ 'st.' + s | t }}</option> }
          </select>
        </div>
      </div>
      <table>
        <thead><tr>
          @if (role !== 'PATIENT') { <th>{{ 'a.patient' | t }}</th> }
          @if (role !== 'DOCTOR') { <th>{{ 'a.doctor' | t }}</th> }
          <th>{{ 'a.dateTime' | t }}</th><th>{{ 'a.reason' | t }}</th><th>{{ 'c.status' | t }}</th><th></th>
        </tr></thead>
        <tbody>
          @for (a of visible(); track a.id) {
            <tr>
              @if (role !== 'PATIENT') { <td class="cell-main">{{ a.patientName }}</td> }
              @if (role !== 'DOCTOR') { <td [class.cell-main]="role === 'PATIENT'">{{ a.doctorName }}</td> }
              <td><bdi dir="ltr">{{ fmt(a.appointmentDateTime) }}</bdi></td><td>{{ a.reasonForVisit }}</td>
              <td><span [class]="'pill ' + cls(a.status)">{{ 'st.' + a.status | t }}</span></td>
              <td>
                <div class="mini-actions">
                  @for (x of actions(a); track x.action) {
                    <button class="mini" type="button" (click)="run(a, x.action)">{{ x.label | t }}</button>
                  }
                  @if (role === 'DOCTOR' && (a.status === 'CONFIRMED' || a.status === 'COMPLETED') && !recorded().has(a.id)) {
                    <button class="mini" type="button" (click)="openRecord(a)">{{ 'rec.add' | t }}</button>
                  }
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
      @if (!visible().length) { <div class="empty">{{ (loading() ? 'c.loading' : 'c.empty') | t }}</div> }
      <app-pager [page]="page()" [size]="size" [total]="total()" (changed)="go($event)" />
    </div>

    @if (record(); as f) {
      <div class="modal-bg" (click)="record.set(null)">
        <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="saveRecord()">
          <h3>{{ 'rec.addTitle' | t }}</h3>
          <div class="modal-body">
            <p class="field-hint" style="margin:0 0 12px">{{ 'rec.forAppt' | t }} {{ f.label }}</p>
            <div class="field"><label>{{ 'r.diagnosis' | t }}</label><input name="d" [(ngModel)]="f.diagnosis" required></div>
            <div class="field"><label>{{ 'r.notes' | t }}</label><textarea name="n" [(ngModel)]="f.medicalNotes" required></textarea></div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-ghost" type="button" (click)="record.set(null)">{{ 'c.cancel' | t }}</button>
            <button class="btn btn-primary" type="submit">{{ 'c.save' | t }}</button>
          </div>
        </form>
      </div>
    }`,
})
export class AppointmentsPage implements OnInit {
  private api = inject(Api);
  private auth = inject(Auth);
  private toast = inject(Toast);
  private i18n = inject(I18n);
  role = this.auth.role()!;
  source = this.role === 'ADMIN' ? 'GET /api/appointments' : this.role === 'DOCTOR' ? 'GET /api/doctors/{id}/appointments' : 'GET /api/patients/{id}/appointments';
  statuses: AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  fmt = fmtDT;
  cls = statusClass;

  rows = signal<Appointment[]>([]);
  total = signal(0);
  page = signal(0);
  loading = signal(false);
  status = signal('');
  record = signal<any>(null);
  recorded = signal<Set<string>>(new Set());
  size = MAX_SIZE;

  /** Admin filters on the server; doctor / patient filter the loaded page. */
  visible = computed(() => {
    const s = this.status();
    return this.role !== 'ADMIN' && s ? this.rows().filter((a) => a.status === s) : this.rows();
  });

  ngOnInit() { this.load(); this.loadRecorded(); }
  /** Appointments that already have a medical record (one record per appointment). */
  loadRecorded() {
    if (this.role === 'DOCTOR') this.api.medicalRecords().subscribe((l) => this.recorded.set(new Set(l.map((r) => r.appointmentID))));
  }
  load() {
    this.loading.set(true);
    const id = this.auth.session()!.id;
    const q: PageQuery = { page: this.page(), size: this.size, sortBy: 'appointmentDateTime', direction: 'desc' };
    if (this.role === 'ADMIN') q.status = this.status();
    const req = this.role === 'ADMIN' ? this.api.appointments(q)
      : this.role === 'DOCTOR' ? this.api.doctorAppointments(id, q) : this.api.patientAppointments(id, q);
    req.subscribe({
      next: (p) => { this.rows.set(p.content); this.total.set(p.totalElements); this.loading.set(false); },
      error: () => { this.rows.set([]); this.total.set(0); this.loading.set(false); },
    });
  }
  setStatus(v: string) {
    this.status.set(v);
    if (this.role === 'ADMIN') { this.page.set(0); this.load(); }
  }
  go(p: number) { this.page.set(p); this.load(); }

  actions(a: Appointment): { action: Action; label: string }[] {
    const cancel = { action: 'cancel' as Action, label: 'act.cancel' };
    if (this.role === 'PATIENT') return a.status === 'PENDING' || a.status === 'CONFIRMED' ? [cancel] : [];
    if (a.status === 'PENDING') return [{ action: 'confirm', label: 'act.confirm' }, cancel];
    if (a.status === 'CONFIRMED') return [{ action: 'complete', label: 'act.complete' }, { action: 'no-show', label: 'act.noShow' }, cancel];
    return [];
  }
  openRecord(a: Appointment) {
    this.record.set({ appointmentID: a.id, label: `${a.patientName} · ${fmtDT(a.appointmentDateTime)}`, diagnosis: '', medicalNotes: '' });
  }
  saveRecord() {
    const f = this.record();
    this.api.createMedicalRecord({ appointmentID: f.appointmentID, diagnosis: f.diagnosis, medicalNotes: f.medicalNotes, recordCreationDate: todayStr() })
      .subscribe(() => { this.record.set(null); this.toast.show(this.i18n.t('c.done')); this.loadRecorded(); });
  }
  run(a: Appointment, action: Action) {
    this.api.appointmentAction(a.id, action).subscribe(() => { this.toast.show(this.i18n.t('c.done')); this.load(); });
  }
}
