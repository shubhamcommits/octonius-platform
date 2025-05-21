import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { LucideAngularModule, Home, User, LogIn, LogOut, SunMoon } from 'lucide-angular'

@NgModule({
  imports: [
    CommonModule,
    LucideAngularModule.pick({ Home, User, LogIn, LogOut, SunMoon })
  ],
  exports: [
    CommonModule,
    LucideAngularModule
  ]
})
export class SharedModule { }
