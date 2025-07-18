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
import { NonAuthGuard } from '../shared/services/non-auth.guard'

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'welcome' },
      { path: 'welcome', component: WelcomeComponent, canActivate: [NonAuthGuard] },
      { path: 'login', component: LoginComponent, canActivate: [NonAuthGuard] },
      { path: 'register', component: RegisterComponent, canActivate: [NonAuthGuard] },
      { path: 'verify-otp', component: VerifyOtpComponent, canActivate: [NonAuthGuard] },
      { path: 'select-workplace', component: SelectWorkplaceComponent },
      { path: 'create-workplace', component: CreateWorkplaceComponent },
      { path: 'workplace-login', component: WorkplaceLoginComponent },
      { 
        path: 'accept-invitation', 
        loadComponent: () => import('./accept-invitation/accept-invitation.component').then(m => m.AcceptInvitationComponent)
      }
    ]
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
