import { HttpClient } from '@angular/common/http'
import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { environment } from '../environments/environment'
import { ToastComponent } from './core/components/toast/toast.component'
import { DialogComponent } from './core/components/dialog/dialog.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, DialogComponent],
  template: `
    <app-toast></app-toast>
    <app-dialog></app-dialog>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  title = 'octonius-web'

  constructor(private http: HttpClient) {
    console.log('Version: ', environment.version)
  }

}
