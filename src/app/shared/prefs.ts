import { Component, inject } from '@angular/core';
import { I18n } from '../core/i18n';
import { Theme } from '../core/theme';

/** Language (AR/EN) and light/dark toggles. */
@Component({
  selector: 'app-prefs',
  template: `
    <div class="ctrl">
      <button class="ctrl-btn" type="button" (click)="i18n.toggle()">{{ i18n.lang() === 'ar' ? 'English' : 'العربية' }}</button>
      <button class="ctrl-btn" type="button" (click)="theme.toggle()">{{ theme.mode() === 'dark' ? '☀' : '☾' }}</button>
    </div>`,
})
export class Prefs {
  i18n = inject(I18n);
  theme = inject(Theme);
}
