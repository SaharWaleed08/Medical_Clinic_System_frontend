import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { Auth } from '../core/auth';
import { TPipe } from '../core/i18n';
import { I18n } from '../core/i18n';
import { NAV } from '../core/nav';
import { Role } from '../core/models';
import { Prefs } from '../shared/prefs';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TPipe, Prefs],
  template: `
    <div class="app">
      <aside class="sidebar" [class.open]="open()">
        <div class="brand">
          <div class="brand-mark" role="img" aria-label="WellCare Clinic"></div>
          <div class="brand-text"><b>WellCare Clinic</b><span>{{ 'app.panel' | t }}</span></div>
        </div>
        <nav class="nav">
          @for (item of items(); track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" (click)="open.set(false)">
              <span class="dot"></span><span>{{ item.label | t }}</span>
            </a>
          }
        </nav>
        <button class="logout-btn" type="button" (click)="auth.logout()"><span aria-hidden="true">⎋</span><span>{{ 'nav.logout' | t }}</span></button>
      </aside>

      <div class="main">
        <div class="topbar">
          <div class="top-left">
            <button class="ctrl-btn menu-btn" type="button" (click)="open.set(!open())">☰</button>
            <div>
              <h1>{{ meta().title | t }}</h1>
              <p>{{ meta().sub | t }}</p>
            </div>
          </div>
          <div class="who">
            <app-prefs />
            <span class="role-chip">{{ 'role.' + role() | t }}</span>
            <div class="avatar" [title]="auth.session()?.name">{{ initials() }}</div>
          </div>
        </div>
        <div class="content"><router-outlet /></div>
      </div>
    </div>`,
})
export class Shell {
  auth = inject(Auth);
  private router = inject(Router);
  private i18n = inject(I18n);
  open = signal(false);

  role = computed<Role>(() => this.auth.role() ?? 'PATIENT');
  items = computed(() =>
    NAV.filter((n) => n.roles.includes(this.role())).map((n) => ({ path: n.path, label: n.label[this.role()]! })),
  );

  private url = toSignal(
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd), startWith(null), map(() => this.router.url)),
    { initialValue: this.router.url },
  );
  meta = computed(() => {
    const n = NAV.find((x) => this.url().startsWith('/app/' + x.path)) ?? NAV[0];
    return { title: n.title ?? n.label[this.role()] ?? 'page.overview', sub: n.sub[this.role()] ?? 'page.overview' };
  });
  initials = computed(() => {
    const name = (this.auth.session()?.name ?? '?').trim();
    const parts = name.split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  });
}
