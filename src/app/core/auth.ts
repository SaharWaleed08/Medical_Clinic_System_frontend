import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { SILENT } from './http-context';
import { I18n } from './i18n';
import { LoginRequest, LoginResponse, Role } from './models';
import { Toast } from './toast';

export interface Session { id: string; name: string; role: Role; token?: string; /** token expiry, ms since epoch */ exp?: number; }
const KEY = 'wc-session';

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(Toast);
  private i18n = inject(I18n);
  private timer?: ReturnType<typeof setTimeout>;

  session = signal<Session | null>(read());
  role = computed(() => this.session()?.role ?? null);

  constructor() { this.schedule(this.session()?.exp); }

  login(body: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, body).pipe(
      map((r) => {
        if (!r.role) throw new Error('MISSING_ROLE');
        const s: Session = { id: r.id, name: r.name, role: String(r.role).toUpperCase() as Role, token: r.token, exp: tokenExpiry(r.token) };
        try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
        this.session.set(s);
        this.schedule(s.exp);
        return s;
      }),
    );
  }

  register(body: unknown) {
    return this.http.post(`${environment.apiUrl}/auth/register`, body);
  }

  /**
   * The backend allows one active session per account, so a real logout calls POST /api/auth/logout
   * (otherwise the account stays "already logged in" until the token expires).
   * `remote = false` is used when the token is already expired/invalid.
   */
  logout(remote = true) {
    const token = this.session()?.token;
    if (remote && token) {
      this.http
        .post(`${environment.apiUrl}/auth/logout`, {}, { headers: { Authorization: `Bearer ${token}` }, context: new HttpContext().set(SILENT, true) })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
    clearTimeout(this.timer);
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    this.session.set(null);
    this.router.navigate(['/login']);
  }

  /** Logs out locally when the token expires (the backend token lives 15 minutes by default). */
  private schedule(exp?: number) {
    clearTimeout(this.timer);
    if (!exp) return;
    const ms = Math.min(exp - Date.now(), 2_000_000_000);
    this.timer = setTimeout(() => this.expired(), Math.max(ms, 0));
  }
  expired() {
    if (!this.session()) return;
    this.toast.error(this.i18n.t('err.expired'));
    this.logout(false);
  }
}

function read(): Session | null {
  try {
    const s: Session | null = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (s?.exp && s.exp <= Date.now()) { localStorage.removeItem(KEY); return null; }
    return s;
  } catch { return null; }
}

/** Reads `exp` (seconds) from the JWT payload. */
function tokenExpiry(token?: string): number | undefined {
  try {
    const payload = JSON.parse(atob(token!.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : undefined;
  } catch { return undefined; }
}
