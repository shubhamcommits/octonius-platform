import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AccountRoutingModule } from './account-routing.module';
import { SharedModule } from '../shared/shared.module';
import { LayoutComponent } from './layout/layout.component';
import { ProfileComponent } from './profile/profile.component';
import { SettingsComponent } from './settings/settings.component';
import { BillingComponent } from './billing/billing.component';

@NgModule({
  declarations: [
    LayoutComponent,
    ProfileComponent,
    SettingsComponent,
    BillingComponent
  ],
  imports: [
    CommonModule,
    AccountRoutingModule,
    RouterModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class AccountModule { } 