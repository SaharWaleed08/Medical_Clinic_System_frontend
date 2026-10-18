import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Toast {
  msg = signal<{ text: string; kind: 'ok' | 'err' } | null>(null);
  private timer?: ReturnType<typeof setTimeout>;
  show(text: string, kind: 'ok' | 'err' = 'ok') {
    this.msg.set({ text, kind });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.msg.set(null), 4000);
  }
  error(text: string) { this.show(text, 'err'); }
}
