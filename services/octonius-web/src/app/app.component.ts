import { HttpClient } from '@angular/common/http'
import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { environment } from '../environments/environment'
import { ToastComponent } from './core/components/toast/toast.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <app-toast></app-toast>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'octonius-web'

  constructor(private http: HttpClient) {
    console.log('Version: ', environment.version)
  }

}
