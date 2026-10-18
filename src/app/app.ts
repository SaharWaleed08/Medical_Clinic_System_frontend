import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastView } from './shared/toast-view';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastView],
  template: `<router-outlet /><app-toast />`,
})
export class App {}
