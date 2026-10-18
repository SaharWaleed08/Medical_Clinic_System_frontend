import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { I18n, TPipe } from '../core/i18n';
import { Availability, DAYS } from '../core/models';
import { Toast } from '../core/toast';

@Component({
  selector: 'app-availability',
  imports: [FormsModule, TPipe],
  template: `
    <div class="panel">
      <div class="panel-head">
        <div><h2>{{ 'nav.availability' | t }}</h2><div class="sub">GET /api/availability</div></div>
        <button class="btn btn-primary" type="button" (click)="open()">{{ 'av.add' | t }}</button>
      </div>
      <table>
        <thead><tr><th>{{ 'av.day' | t }}</th><th>{{ 'av.from' | t }}</th><th>{{ 'av.to' | t }}</th><th></th></tr></thead>
        <tbody>
          @for (a of rows(); track a.availabilityID) {
            <tr>
              <td class="cell-main">{{ 'day.' + a.day | t }}</td><td>{{ a.startTime.slice(0, 5) }}</td><td>{{ a.endTime.slice(0, 5) }}</td>
              <td class="row-actions"><button class="icon-btn" type="button" (click)="remove(a)">🗑</button></td>
            </tr>
          }
        </tbody>
      </table>
      @if (!rows().length) { <div class="empty">{{ (loading() ? 'c.loading' : 'c.empty') | t }}</div> }
    </div>

    @if (form(); as f) {
      <div class="modal-bg" (click)="form.set(null)">
        <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="save()">
          <h3>{{ 'av.addTitle' | t }}</h3>
          <div class="modal-body">
            <div class="field"><label>{{ 'av.day' | t }}</label>
              <select name="d" [(ngModel)]="f.day">@for (d of days; track d) { <option [value]="d">{{ 'day.' + d | t }}</option> }</select></div>
            <div class="field-row">
              <div class="field"><label>{{ 'av.from' | t }}</label><input type="time" name="s" [(ngModel)]="f.startTime" required></div>
              <div class="field"><label>{{ 'av.to' | t }}</label><input type="time" name="e" [(ngModel)]="f.endTime" required></div>
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
export class AvailabilityPage implements OnInit {
  private api = inject(Api);
  private auth = inject(Auth);
  private toast = inject(Toast);
  private i18n = inject(I18n);
  days = DAYS;
  rows = signal<Availability[]>([]);
  loading = signal(true);
  form = signal<{ day: string; startTime: string; endTime: string } | null>(null);

  ngOnInit() { this.load(); }
  load() {
    const id = this.auth.session()!.id;
    this.api.availabilities().subscribe({
      next: (r) => {
        const order = (d: string) => DAYS.indexOf(d as never);
        this.rows.set(r.filter((a) => a.doctorID === id).sort((a, b) => order(a.day) - order(b.day) || a.startTime.localeCompare(b.startTime)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
  open() { this.form.set({ day: 'SATURDAY', startTime: '09:00', endTime: '14:00' }); }
  save() {
    const f = this.form()!;
    const t = (v: string) => (v.length === 5 ? v + ':00' : v);
    this.api.createAvailability({ doctorID: this.auth.session()!.id, day: f.day, startTime: t(f.startTime), endTime: t(f.endTime) })
      .subscribe(() => { this.form.set(null); this.toast.show(this.i18n.t('c.done')); this.load(); });
  }
  remove(a: Availability) {
    if (!confirm(this.i18n.t('c.confirmDelete'))) return;
    this.api.deleteAvailability(a.availabilityID).subscribe(() => { this.toast.show(this.i18n.t('c.done')); this.load(); });
  }
}
