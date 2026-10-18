import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { I18n, TPipe } from '../core/i18n';
import { Specialization } from '../core/models';
import { Toast } from '../core/toast';

@Component({
  selector: 'app-specializations',
  imports: [FormsModule, TPipe],
  template: `
    <div class="panel-head" style="padding:0 0 14px;border:none">
      <div><h2 style="font-size:16px">{{ 'nav.specializations' | t }}</h2><div class="sub">GET /api/specialization</div></div>
      <button class="btn btn-primary" type="button" (click)="open()">{{ 'sp.add' | t }}</button>
    </div>
    <div class="cards">
      @for (s of rows(); track s.specializationID) {
        <div class="card">
          <h3>{{ s.name }}</h3><p>{{ s.description }}</p>
          <div class="mini-actions" style="margin-top:12px">
            <button class="mini" type="button" (click)="open(s)">{{ 'c.edit' | t }}</button>
            <button class="mini" type="button" (click)="remove(s)">{{ 'c.delete' | t }}</button>
          </div>
        </div>
      }
    </div>
    @if (!rows().length) { <div class="empty">{{ (loading() ? 'c.loading' : 'c.empty') | t }}</div> }

    @if (form(); as f) {
      <div class="modal-bg" (click)="form.set(null)">
        <form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="save()">
          <h3>{{ (editId ? 'sp.editTitle' : 'sp.addTitle') | t }}</h3>
          <div class="modal-body">
            <div class="field"><label>{{ 'c.name' | t }}</label><input name="n" [(ngModel)]="f.name" required></div>
            <div class="field"><label>{{ 'sp.desc' | t }}</label><textarea name="d" [(ngModel)]="f.description"></textarea></div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-ghost" type="button" (click)="form.set(null)">{{ 'c.cancel' | t }}</button>
            <button class="btn btn-primary" type="submit">{{ 'c.save' | t }}</button>
          </div>
        </form>
      </div>
    }`,
})
export class SpecializationsPage implements OnInit {
  private api = inject(Api);
  private toast = inject(Toast);
  private i18n = inject(I18n);
  rows = signal<Specialization[]>([]);
  loading = signal(true);
  form = signal<{ name: string; description: string } | null>(null);
  editId: string | null = null;

  ngOnInit() { this.load(); }
  load() {
    this.api.specializations().subscribe({
      next: (r) => { this.rows.set(r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
  open(s?: Specialization) { this.editId = s?.specializationID ?? null; this.form.set({ name: s?.name ?? '', description: s?.description ?? '' }); }
  save() {
    const f = this.form()!;
    const req = this.editId ? this.api.updateSpecialization(this.editId, f) : this.api.createSpecialization(f);
    req.subscribe(() => { this.form.set(null); this.toast.show(this.i18n.t('c.done')); this.load(); });
  }
  remove(s: Specialization) {
    if (!confirm(this.i18n.t('c.confirmDelete'))) return;
    this.api.deleteSpecialization(s.specializationID).subscribe(() => { this.toast.show(this.i18n.t('c.done')); this.load(); });
  }
}
