import { HttpClient } from '@angular/common/http'
import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { environment } from '../environments/environment'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'octonius-web'

  constructor(private http: HttpClient) {
    console.log('Version: ', environment.version)
  }

}
