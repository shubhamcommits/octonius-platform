import { Routes } from '@angular/router'
import { AuthGuard } from './modules/shared/services/auth.guard'
import { WorkplaceGuard } from './modules/shared/services/workplace.guard'

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'myspace'
  },
  {
    path: 'auths',
    loadChildren: () => import('./modules/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'myspace',
    loadChildren: () => import('./modules/my-space/my-space.module').then(m => m.MySpaceModule),
    canActivate: [AuthGuard, WorkplaceGuard]
  },
  {
    path: 'workplace',
    loadChildren: () => import('./modules/workplace/workplace.module').then(m => m.WorkplaceModule),
    canActivate: [AuthGuard, WorkplaceGuard]
  },
  {
    path: '**',
    loadComponent: () => import('./modules/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
]
