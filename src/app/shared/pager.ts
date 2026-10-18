import { Component, computed, input, output } from '@angular/core';
import { TPipe } from '../core/i18n';

@Component({
  selector: 'app-pager',
  imports: [TPipe],
  template: `
    @if (total() > 0) {
      <div class="foot">
        <span>{{ 'c.showing' | t: { from: from(), to: to(), total: total() } }}</span>
        <div class="pager">
          <button type="button" [disabled]="page() === 0" (click)="go(page() - 1)">‹</button>
          @for (p of numbers(); track p) {
            <button type="button" [class.active]="p === page()" (click)="go(p)">{{ p + 1 }}</button>
          }
          <button type="button" [disabled]="page() >= pages() - 1" (click)="go(page() + 1)">›</button>
        </div>
      </div>
    }`,
})
export class Pager {
  page = input.required<number>();
  size = input.required<number>();
  total = input.required<number>();
  changed = output<number>();

  pages = computed(() => Math.max(1, Math.ceil(this.total() / this.size())));
  from = computed(() => this.page() * this.size() + 1);
  to = computed(() => Math.min(this.total(), (this.page() + 1) * this.size()));
  numbers = computed(() => {
    const start = Math.max(0, Math.min(this.page() - 2, this.pages() - 5));
    const end = Math.min(this.pages(), start + 5);
    return Array.from({ length: end - start }, (_, i) => start + i);
  });
  go(p: number) { if (p >= 0 && p < this.pages() && p !== this.page()) this.changed.emit(p); }
}
