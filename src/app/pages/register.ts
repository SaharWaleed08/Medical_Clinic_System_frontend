import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Auth } from '../core/auth';
import { I18n, TPipe } from '../core/i18n';
import { Role, Specialization, toDMY, todayStr } from '../core/models';
import { Toast } from '../core/toast';
import { Prefs } from '../shared/prefs';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, TPipe, Prefs],
  template: `
    <div class="login-wrap">
      <app-prefs />
      <form class="login-card wide" (ngSubmit)="submit()">
        <div class="brand-mark" role="img" aria-label="WellCare Clinic"></div>
        <h1>{{ 'reg.title' | t }}</h1>
        <p class="sub">POST /api/auth/register</p>

        <div class="role-toggle">
          <button type="button" [class.active]="role() === 'ADMIN'" (click)="role.set('ADMIN')">{{ 'role.staff' | t }}</button>
          <button type="button" [class.active]="role() === 'DOCTOR'" (click)="role.set('DOCTOR'); loadSpecs()">{{ 'role.DOCTOR' | t }}</button>
          <button type="button" [class.active]="role() === 'PATIENT'" (click)="role.set('PATIENT')">{{ 'role.PATIENT' | t }}</button>
        </div>

        <div class="field"><label>{{ 'reg.fullName' | t }}</label><input name="name" [(ngModel)]="f.name" required></div>
        <div class="field-row">
          <div class="field"><label>{{ 'c.email' | t }}</label><input type="email" name="email" [(ngModel)]="f.email" required></div>
          <div class="field"><label>{{ 'c.phone' | t }}</label><input name="phone" [(ngModel)]="f.phone" required></div>
        </div>
        <div class="field"><label>{{ 'c.password' | t }}</label>
          <input type="password" name="password" [(ngModel)]="f.password" minlength="8" required [placeholder]="'reg.passHint' | t"></div>

        @switch (role()) {
          @case ('PATIENT') {
            <div class="field-row">
              <div class="field"><label>{{ 'reg.dob' | t }}</label><input type="date" name="dob" [(ngModel)]="f.dateOfBirth"></div>
              <div class="field"><label>{{ 'reg.gender' | t }}</label>
                <select name="gender" [(ngModel)]="f.gender"><option value="MALE">{{ 'reg.male' | t }}</option><option value="FEMALE">{{ 'reg.female' | t }}</option></select></div>
            </div>
          }
          @case ('DOCTOR') {
            <div class="field-row">
              <div class="field"><label>{{ 'reg.license' | t }}</label><input name="license" [(ngModel)]="f.licenseNumber"></div>
              <div class="field"><label>{{ 'reg.years' | t }}</label><input type="number" min="0" name="years" [(ngModel)]="f.yearsOfExperience"></div>
            </div>
            <div class="field"><label>{{ 'doc.spec' | t }}</label>
              <select name="spec" [(ngModel)]="f.specializationID" required>
                <option value="" disabled>{{ 'doc.pickSpec' | t }}</option>
                @for (s of specs(); track s.specializationID) { <option [value]="s.specializationID">{{ s.name }}</option> }
              </select></div>
            <div class="field"><label>{{ 'reg.fee' | t }}</label><input type="number" min="1" name="fee" [(ngModel)]="f.consultationFee"></div>
          }
          @case ('ADMIN') {
            <div class="field"><label>{{ 'reg.adminPass' | t }}</label>
              <input type="password" name="adminPassword" [(ngModel)]="f.adminPassword"><div class="field-hint">{{ 'reg.adminHint' | t }}</div></div>
          }
        }

        <button class="login-btn" type="submit" [disabled]="busy()">{{ 'reg.btn' | t }}</button>
        <div class="switch-line">{{ 'reg.have' | t }} <a class="login-link" routerLink="/login">{{ 'login.btn' | t }}</a></div>
      </form>
    </div>`,
})
export class RegisterPage {
  private api = inject(Api);
  private auth = inject(Auth);
  private router = inject(Router);
  private toast = inject(Toast);
  private i18n = inject(I18n);
  role = signal<Role>('PATIENT');
  specs = signal<Specialization[]>([]);
  busy = signal(false);
  f: any = { name: '', email: '', phone: '', password: '', gender: 'MALE', dateOfBirth: '', licenseNumber: '', yearsOfExperience: 0, consultationFee: null, adminPassword: '', specializationID: '' };

  /** Needs GET /api/specializations to be public (see backend-changes/SecurityConfig.patch.txt). */
  loadSpecs() {
    if (this.specs().length) return;
    this.api.specializations().subscribe({ next: (s) => this.specs.set(s), error: () => this.specs.set([]) });
  }

  submit() {
    const r = this.role();
    const body: Record<string, unknown> = { name: this.f.name, email: this.f.email, password: this.f.password, phone: this.f.phone, role: r };
    if (r === 'PATIENT') Object.assign(body, { dateOfBirth: toDMY(this.f.dateOfBirth), gender: this.f.gender, registrationDate: todayStr() });
    if (r === 'DOCTOR') Object.assign(body, { licenseNumber: this.f.licenseNumber, yearsOfExperience: this.f.yearsOfExperience, consultationFee: this.f.consultationFee, specializationID: this.f.specializationID });
    if (r === 'ADMIN') Object.assign(body, { adminPassword: this.f.adminPassword });
    this.busy.set(true);
    this.auth.register(body).subscribe({
      next: () => { this.toast.show(this.i18n.t('reg.ok')); this.router.navigate(['/login']); },
      error: () => this.busy.set(false),
    });
  }
}
