import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { I18n, TPipe } from '../core/i18n';
import { MAX_SIZE, Patient, toDMY, todayStr } from '../core/models';
import { Toast } from '../core/toast';
import { Pager } from '../shared/pager';

interface Row { id: string; name: string; email?: string; registered?: string; }

@Component({
  selector: 'app-patients',
  imports: [FormsModule, TPipe, Pager],
  template: `
    <div class="panel">
      <div class="panel-head">
        <div><h2>{{ (isAdmin ? 'nav.patients' : 'nav.myPatients') | t }}</h2><div class="sub">{{ isAdmin ? 'GET /api/patients' : 'GET /api/doctors/{id}/appointments' }}</div></div>
        <div class="tools">
          <div class="search"><input [placeholder]="'c.search' | t" [(ngModel)]="name" (ngModelChange)="search()"></div>
          @if (isAdmin) { <button class="btn btn-primary" type="button" (click)="open()">{{ 'pat.add' | t }}</button> }
        </div>
      </div>
      <table>
        <thead><tr><th>{{ 'c.name' | t }}</th>@if (isAdmin) { <th>{{ 'c.email' | t }}</th><th>{{ 'pat.registered' | t }}</th><th></th> }</tr></thead>
        <tbody>
          @for (r of shown(); track r.id) {
            <tr>
              <td class="cell-main">{{ r.name }}</td>
              @if (isAdmin) {
                <td>{{ r.email }}</td><td>{{ r.registered }}</td>
                <td class="row-actions"><button class="icon-btn" type="button" (click)="remove(r)">🗑</button></td>
              }
            </tr>
          }
        </tbody>
      </table>
      @if (!shown().length) { <div class="empty">{{ (loading() ? 'c.loading' : 'c.empty') | t }}</div> }
      @if (isAdmin) { <app-pager [page]="page()" [size]="size" [total]="total()" (changed)="go($event)" /> }
    </div>

    @if (form(); as f) {
      <div class="modal-bg" (click)="form.set(null)">
        <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="save()">
          <h3>{{ 'pat.addTitle' | t }}</h3>
          <div class="modal-body">
            <div class="field"><label>{{ 'c.name' | t }}</label><input name="n" [(ngModel)]="f.name" required></div>
            <div class="field"><label>{{ 'c.email' | t }}</label><input type="email" name="e" [(ngModel)]="f.email" required></div>
            <div class="field"><label>{{ 'c.password' | t }}</label><input type="password" name="p" [(ngModel)]="f.password" minlength="8" required></div>
            <div class="field"><label>{{ 'c.phone' | t }}</label><input name="ph" [(ngModel)]="f.phone" required></div>
            <div class="field-row">
              <div class="field"><label>{{ 'reg.dob' | t }}</label><input type="date" name="d" [(ngModel)]="f.dateOfBirth"></div>
              <div class="field"><label>{{ 'reg.gender' | t }}</label>
                <select name="g" [(ngModel)]="f.gender"><option value="MALE">{{ 'reg.male' | t }}</option><option value="FEMALE">{{ 'reg.female' | t }}</option></select></div>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-ghost" type="button" (click)="form.set(null)">{{ 'c.cancel' | t }}</button>
            <button class="btn btn-primary" type="submit">{{ 'c.save' | t }}</button>
          </div>
        </form>
      </div>
    }`,
})
export class PatientsPage implements OnInit {
  private api = inject(Api);
  private auth = inject(Auth);
  private toast = inject(Toast);
  private i18n = inject(I18n);
  isAdmin = this.auth.role() === 'ADMIN';
  all = signal<Row[]>([]);
  shown = signal<Row[]>([]);
  total = signal(0);
  page = signal(0);
  loading = signal(false);
  size = MAX_SIZE;
  name = '';
  form = signal<any>(null);
  private timer?: ReturnType<typeof setTimeout>;

  ngOnInit() { this.load(); }
  load() {
    this.loading.set(true);
    if (this.isAdmin) {
      this.api.patients({ name: this.name, page: this.page(), size: this.size, sortBy: 'name', direction: 'asc' }).subscribe({
        next: (p) => {
          this.shown.set(p.content.map((x: Patient) => ({ id: x.patientID, name: x.name, email: x.email, registered: (x.registrationDate ?? '').slice(0, 10) })));
          this.total.set(p.totalElements); this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      // Doctor: derive "my patients" from the doctor's own appointments
      this.api.allDoctorAppointments(this.auth.session()!.id).subscribe({
        next: (apps) => {
          const m = new Map<string, Row>();
          apps.forEach((a) => m.set(a.patientID, { id: a.patientID, name: a.patientName }));
          this.all.set([...m.values()]);
          this.filter(); this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }
  private filter() {
    const q = this.name.trim().toLowerCase();
    this.shown.set(this.all().filter((r) => !q || r.name.toLowerCase().includes(q)));
  }
  search() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { if (this.isAdmin) { this.page.set(0); this.load(); } else this.filter(); }, 300);
  }
  go(p: number) { this.page.set(p); this.load(); }
  open() { this.form.set({ name: '', email: '', password: '', phone: '', dateOfBirth: '', gender: 'MALE' }); }
  save() {
    this.api.createPatient({ ...this.form()!, dateOfBirth: toDMY(this.form().dateOfBirth), registrationDate: todayStr() + 'T00:00:00' })
      .subscribe(() => { this.form.set(null); this.toast.show(this.i18n.t('c.done')); this.load(); });
  }
  remove(r: Row) {
    if (!confirm(this.i18n.t('c.confirmDelete'))) return;
    this.api.deletePatient(r.id).subscribe(() => { this.toast.show(this.i18n.t('c.done')); this.load(); });
  }
}
