import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { LayoutComponent } from './layout/layout.component'
import { WelcomeComponent } from './welcome/welcome.component'
import { LoginComponent } from './login/login.component'
import { RegisterComponent } from './register/register.component'
import { VerifyOtpComponent } from './verify-otp/verify-otp.component'
import { SelectWorkplaceComponent } from './select-workplace/select-workplace.component'
import { CreateWorkplaceComponent } from './create-workplace/create-workplace.component'
import { WorkplaceLoginComponent } from './workplace-login/workplace-login.component'

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'welcome' },
      { path: 'welcome', component: WelcomeComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'verify-otp', component: VerifyOtpComponent },
      { path: 'select-workplace', component: SelectWorkplaceComponent },
      { path: 'create-workplace', component: CreateWorkplaceComponent },
      { path: 'workplace-login', component: WorkplaceLoginComponent }
    ]
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
