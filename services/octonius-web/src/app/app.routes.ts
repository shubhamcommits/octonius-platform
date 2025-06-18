import { Routes } from '@angular/router'
import { AuthGuard } from './modules/shared/services/auth.guard'

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auths/login'
  },
  {
    path: 'auths',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'myspace',
    loadChildren: () => import('./modules/my-space/my-space.module').then(m => m.MySpaceModule),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    loadComponent: () => import('./modules/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
]
