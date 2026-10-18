import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../core/auth';
import { I18n, TPipe } from '../core/i18n';
import { Prefs } from '../shared/prefs';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, TPipe, Prefs],
  template: `
    <div class="login-wrap">
      <app-prefs />
      <form class="login-card" (ngSubmit)="submit()">
        <div class="brand-mark" role="img" aria-label="WellCare Clinic"></div>
        <h1>WellCare Clinic</h1>
        <p class="sub">{{ 'login.title' | t }}</p>
        <div class="field"><label>{{ 'c.email' | t }}</label>
          <input type="email" name="email" [(ngModel)]="email" required autocomplete="username" placeholder="name@mail.com"></div>
        <div class="field"><label>{{ 'c.password' | t }}</label>
          <input type="password" name="password" [(ngModel)]="password" required autocomplete="current-password"></div>
        @if (error()) { <p class="err-text">{{ error() }}</p> }
        <button class="login-btn" type="submit" [disabled]="busy() || !email || !password">{{ 'login.btn' | t }}</button>
        <div class="switch-line">{{ 'login.new' | t }} <a class="login-link" routerLink="/register">{{ 'login.signup' | t }}</a></div>
      </form>
    </div>`,
})
export class LoginPage {
  private auth = inject(Auth);
  private router = inject(Router);
  private i18n = inject(I18n);
  email = '';
  password = '';
  busy = signal(false);
  error = signal('');

  submit() {
    this.busy.set(true);
    this.error.set('');
    this.auth.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: () => this.router.navigate(['/app/dashboard']),
      error: (e) => {
        this.busy.set(false);
        if (e?.message === 'MISSING_ROLE') this.error.set(this.i18n.t('err.roleMissing'));
      },
    });
  }
}
