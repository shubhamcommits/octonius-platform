import { Routes } from '@angular/router'
import { AuthGuard } from './modules/shared/services/auth.guard'
import { NonAuthGuard } from './modules/shared/services/non-auth.guard'

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'myspace',
    canActivate: [AuthGuard]
  },
  {
    path: 'auths',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule),
    canActivate: [NonAuthGuard]
  },
  {
    path: 'myspace',
    loadChildren: () => import('./modules/my-space/my-space.module').then(m => m.MySpaceModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'workplace',
    loadChildren: () => import('./modules/workplace/workplace.module').then(m => m.WorkplaceModule),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    loadComponent: () => import('./modules/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
]
