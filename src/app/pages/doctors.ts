import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { I18n, TPipe } from '../core/i18n';
import { Doctor, MAX_SIZE, Specialization } from '../core/models';
import { Toast } from '../core/toast';
import { Pager } from '../shared/pager';

@Component({
  selector: 'app-doctors',
  imports: [FormsModule, TPipe, Pager],
  template: `
    <div class="panel">
      <div class="panel-head">
        <div><h2>{{ 'nav.doctors' | t }}</h2><div class="sub">GET /api/doctors</div></div>
        <div class="tools">
          <div class="search"><input [placeholder]="'c.search' | t" [(ngModel)]="name" (ngModelChange)="search()"></div>
          <select class="select" [(ngModel)]="spec" (ngModelChange)="reload()">
            <option value="">{{ 'doc.allSpecs' | t }}</option>
            @for (s of specs(); track s.specializationID) { <option [value]="s.name">{{ s.name }}</option> }
          </select>
          <select class="select" [(ngModel)]="sort" (ngModelChange)="reload()">
            <option value="name:asc">{{ 'c.sortAsc' | t }}</option>
            <option value="name:desc">{{ 'c.sortDesc' | t }}</option>
            <option value="yearsOfExperience:desc">{{ 'doc.sortExpDesc' | t }}</option>
            <option value="yearsOfExperience:asc">{{ 'doc.sortExpAsc' | t }}</option>
          </select>
          <button class="btn btn-primary" type="button" (click)="open()">{{ 'doc.add' | t }}</button>
        </div>
      </div>
      <table>
        <thead><tr><th>{{ 'c.name' | t }}</th><th>{{ 'c.email' | t }}</th><th>{{ 'doc.spec' | t }}</th><th></th></tr></thead>
        <tbody>
          @for (d of rows(); track d.id) {
            <tr>
              <td class="cell-main">{{ d.name }}</td><td>{{ d.email }}</td><td>{{ d.specialization }}</td>
              <td class="row-actions"><button class="icon-btn" type="button" (click)="open(d)">✎</button><button class="icon-btn" type="button" (click)="remove(d)">🗑</button></td>
            </tr>
          }
        </tbody>
      </table>
      @if (!rows().length) { <div class="empty">{{ (loading() ? 'c.loading' : 'c.empty') | t }}</div> }
      <app-pager [page]="page()" [size]="size" [total]="total()" (changed)="go($event)" />
    </div>

    @if (form(); as f) {
      <div class="modal-bg" (click)="form.set(null)">
        <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="save()">
          <h3>{{ (editId ? 'doc.editTitle' : 'doc.addTitle') | t }}</h3>
          <div class="modal-body">
            @if (editId) { <p class="field-hint" style="margin:0 0 12px">{{ 'doc.editHint' | t }}</p> }
            <div class="field"><label>{{ 'c.name' | t }}</label><input name="n" [(ngModel)]="f.name" required></div>
            <div class="field"><label>{{ 'c.email' | t }}</label><input type="email" name="e" [(ngModel)]="f.email" required></div>
            @if (!editId) { <div class="field"><label>{{ 'c.password' | t }}</label><input type="password" name="p" [(ngModel)]="f.password" minlength="8" required></div> }
            <div class="field"><label>{{ 'c.phone' | t }}</label><input name="ph" [(ngModel)]="f.phone" required></div>
            <div class="field"><label>{{ 'doc.spec' | t }}</label>
              <select name="sp" [(ngModel)]="f.specializationID" required>
                <option value="" disabled>{{ 'doc.pickSpec' | t }}</option>
                @for (s of specs(); track s.specializationID) { <option [value]="s.specializationID">{{ s.name }}</option> }
              </select></div>
            <div class="field-row">
              <div class="field"><label>{{ 'reg.license' | t }}</label><input name="l" [(ngModel)]="f.licenseNumber" required></div>
              <div class="field"><label>{{ 'reg.years' | t }}</label><input type="number" min="0" name="y" [(ngModel)]="f.yearsOfExperience" required></div>
            </div>
            <div class="field"><label>{{ 'reg.fee' | t }}</label><input type="number" min="1" name="fee" [(ngModel)]="f.consultationFee" required></div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-ghost" type="button" (click)="form.set(null)">{{ 'c.cancel' | t }}</button>
            <button class="btn btn-primary" type="submit">{{ 'c.save' | t }}</button>
          </div>
        </form>
      </div>
    }`,
})
export class DoctorsPage implements OnInit {
  private api = inject(Api);
  private toast = inject(Toast);
  private i18n = inject(I18n);
  rows = signal<Doctor[]>([]);
  specs = signal<Specialization[]>([]);
  total = signal(0);
  page = signal(0);
  loading = signal(false);
  size = MAX_SIZE;
  name = '';
  spec = '';
  sort = 'name:asc';
  form = signal<any>(null);
  editId: string | null = null;
  private timer?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.api.specializations().subscribe((s) => this.specs.set(s));
    this.load();
  }
  load() {
    this.loading.set(true);
    const [sortBy, direction] = this.sort.split(':') as [string, 'asc' | 'desc'];
    this.api.doctors({ name: this.name, specialization: this.spec, page: this.page(), size: this.size, sortBy, direction }).subscribe({
      next: (p) => { this.rows.set(p.content); this.total.set(p.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
  reload() { this.page.set(0); this.load(); }
  search() { clearTimeout(this.timer); this.timer = setTimeout(() => this.reload(), 300); }
  go(p: number) { this.page.set(p); this.load(); }
  open(d?: Doctor) {
    this.editId = d?.id ?? null;
    const match = this.specs().find((s) => s.name === d?.specialization);
    this.form.set({ name: d?.name ?? '', email: d?.email ?? '', password: '', phone: '', specializationID: match?.specializationID ?? '', licenseNumber: '', yearsOfExperience: 0, consultationFee: null });
  }
  save() {
    const f = this.form();
    const req = this.editId ? this.api.updateDoctor(this.editId, f) : this.api.createDoctor(f);
    req.subscribe(() => { this.form.set(null); this.toast.show(this.i18n.t('c.done')); this.load(); });
  }
  remove(d: Doctor) {
    if (!confirm(this.i18n.t('c.confirmDelete'))) return;
    this.api.deleteDoctor(d.id).subscribe(() => { this.toast.show(this.i18n.t('c.done')); this.load(); });
  }
}
