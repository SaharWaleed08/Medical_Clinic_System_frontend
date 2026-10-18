import { Component, inject } from '@angular/core';
import { Toast } from '../core/toast';

@Component({
  selector: 'app-toast',
  template: `@if (toast.msg(); as m) { <div class="toast" [class.ok]="m.kind === 'ok'" [class.err]="m.kind === 'err'">{{ m.text }}</div> }`,
})
export class ToastView {
  toast = inject(Toast);
}
