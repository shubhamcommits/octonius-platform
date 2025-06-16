import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LucideAngularModule, Home, User, LogIn, LogOut, SunMoon } from 'lucide-angular'
import { AuthGuard } from './services/auth.guard'

@NgModule({
  imports: [
    CommonModule,
    LucideAngularModule.pick({ Home, User, LogIn, LogOut, SunMoon })
  ],
  exports: [
    CommonModule,
    LucideAngularModule
  ],
  providers: [AuthGuard]
})
export class SharedModule { }
