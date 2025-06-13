import { Routes } from '@angular/router'

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
    path: 'dashboard',
    loadChildren: () => import('./modules/my-space/my-space.module').then(m => m.MySpaceModule)
  },
  {
    path: '**',
    loadComponent: () => import('./modules/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
]
