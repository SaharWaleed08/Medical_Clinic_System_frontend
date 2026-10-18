import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { I18n, TPipe } from '../core/i18n';
import { AvailableSlot, Doctor, Specialization, todayStr } from '../core/models';
import { Toast } from '../core/toast';

@Component({
  selector: 'app-book',
  imports: [FormsModule, TPipe],
  template: `
    <div class="panel">
      <div class="form-grid">
        <div class="field"><label>{{ 'doc.spec' | t }}</label>
          <select [(ngModel)]="spec" (ngModelChange)="loadDoctors()">
            <option value="">{{ 'doc.allSpecs' | t }}</option>
            @for (s of specs(); track s.specializationID) { <option [value]="s.name">{{ s.name }}</option> }
          </select></div>
        <div class="field"><label>{{ 'a.doctor' | t }}</label>
          <select [(ngModel)]="doctorId" (ngModelChange)="loadSlots()">
            @for (d of doctors(); track d.id) { <option [value]="d.id">{{ d.name }}</option> }
          </select></div>
        <div class="field full"><label>{{ 'b.date' | t }}</label>
          <input type="date" [min]="today" [(ngModel)]="date" (ngModelChange)="loadSlots()"></div>
        <div class="field full"><label>{{ 'b.slots' | t }}</label>
          @if (!doctorId || !date) { <div class="field-hint">{{ 'b.pick' | t }}</div> }
          @else if (!slots().length) { <div class="field-hint">{{ (loadingSlots() ? 'c.loading' : 'b.noSlots') | t }}</div> }
          <div class="slots">
            @for (s of slots(); track s.startTime) {
              <button class="slot" type="button" [class.sel]="selected() === s.startTime" (click)="selected.set(s.startTime)">{{ s.startTime.slice(11, 16) }}</button>
            }
          </div>
        </div>
        <div class="field full"><label>{{ 'a.reason' | t }}</label><textarea [(ngModel)]="reason" [placeholder]="'b.reasonPh' | t"></textarea></div>
      </div>
      <div class="form-actions"><button class="btn btn-primary" type="button" [disabled]="!selected() || busy()" (click)="confirm()">{{ 'b.confirm' | t }}</button></div>
    </div>`,
})
export class BookPage implements OnInit {
  private api = inject(Api);
  private auth = inject(Auth);
  private router = inject(Router);
  private toast = inject(Toast);
  private i18n = inject(I18n);
  today = todayStr();
  specs = signal<Specialization[]>([]);
  doctors = signal<Doctor[]>([]);
  slots = signal<AvailableSlot[]>([]);
  selected = signal('');
  loadingSlots = signal(false);
  busy = signal(false);
  spec = '';
  doctorId = '';
  date = todayStr();
  reason = '';

  ngOnInit() {
    this.api.specializations().subscribe((s) => this.specs.set(s));
    this.loadDoctors();
  }
  loadDoctors() {
    this.api.allDoctors(this.spec || undefined).subscribe((list) => {
      this.doctors.set(list);
      this.doctorId = list[0]?.id ?? '';
      this.loadSlots();
    });
  }
  loadSlots() {
    this.selected.set('');
    this.slots.set([]);
    if (!this.doctorId || !this.date) return;
    this.loadingSlots.set(true);
    this.api.availableSlots(this.doctorId, this.date).subscribe({
      next: (s) => { this.slots.set(s); this.loadingSlots.set(false); },
      error: () => this.loadingSlots.set(false),
    });
  }
  confirm() {
    this.busy.set(true);
    this.api.createAppointment({
      patientID: this.auth.session()!.id, doctorID: this.doctorId,
      appointmentDateTime: this.selected(), reasonForVisit: this.reason,
    }).subscribe({
      next: () => { this.toast.show(this.i18n.t('b.done')); this.router.navigate(['/app/appointments']); },
      error: () => { this.busy.set(false); this.loadSlots(); },
    });
  }
}
