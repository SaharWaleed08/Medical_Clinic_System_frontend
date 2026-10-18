import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, Role } from './models';

export interface Session { id: string; name: string; role: Role; token?: string; }
const KEY = 'wc-session';

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);

  session = signal<Session | null>(read());
  role = computed(() => this.session()?.role ?? null);

  login(body: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, body).pipe(
      map((r) => {
        if (!r.role) throw new Error('MISSING_ROLE');
        const s: Session = { id: r.id, name: r.name, role: String(r.role).toUpperCase() as Role, token: r.token };
        try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
        this.session.set(s);
        return s;
      }),
    );
  }

  register(body: unknown) {
    return this.http.post(`${environment.apiUrl}/auth/register`, body);
  }

  logout() {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    this.session.set(null);
    this.router.navigate(['/login']);
  }
}

function read(): Session | null {
  try { return JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { return null; }
}
