import { Injectable, effect, signal } from '@angular/core';

type Mode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class Theme {
  mode = signal<Mode>(initial());
  constructor() {
    effect(() => {
      const m = this.mode();
      document.documentElement.setAttribute('data-theme', m);
      try { localStorage.setItem('wc-theme', m); } catch { /* ignore */ }
    });
  }
  toggle() { this.mode.update((m) => (m === 'dark' ? 'light' : 'dark')); }
}

function initial(): Mode {
  try {
    const s = localStorage.getItem('wc-theme');
    if (s === 'dark' || s === 'light') return s;
  } catch { /* ignore */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
