import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { WorkplaceRoutingModule } from './workplace-routing.module';
import { SharedModule } from '../shared/shared.module';
import { LayoutComponent } from './layout/layout.component';
import { AppsComponent } from './apps/apps.component';
import { WorkManagementComponent } from './work-management/work-management.component';
import { FilesComponent } from './files/files.component';
import { CrmComponent } from './crm/crm.component';
import { CommunitiesComponent } from './communities/communities.component';
import { LibraryComponent } from './library/library.component';
import { LoungeComponent } from './lounge/lounge.component';
import { FileListComponent } from './file-list/file-list.component';
import { GroupDetailComponent } from './work-management/group-detail/group-detail.component';
import { GroupActivityComponent } from './work-management/group-detail/group-activity/group-activity.component';
import { GroupDashboardComponent } from './work-management/group-detail/group-dashboard/group-dashboard.component';
import { GroupTasksComponent } from './work-management/group-detail/group-tasks/group-tasks.component';
import { GroupAdminComponent } from './work-management/group-detail/group-admin/group-admin.component';
import { TaskDetailComponent } from './work-management/group-detail/group-tasks/task-detail/task-detail.component';
import { LoungeStoryDetailComponent } from './lounge/lounge-story-detail/lounge-story-detail.component';
import { CreateStoryModalComponent } from './lounge/create-story-modal/create-story-modal.component';
import { CreateGroupModalComponent } from './work-management/create-group-modal/create-group-modal.component';
import { AdminGeneralComponent } from './work-management/group-detail/group-admin/admin-general/admin-general.component';
import { AdminMembersComponent } from './work-management/group-detail/group-admin/admin-members/admin-members.component';
import { AdminPermissionsComponent } from './work-management/group-detail/group-admin/admin-permissions/admin-permissions.component';
import { AdminDangerZoneComponent } from './work-management/group-detail/group-admin/admin-danger-zone/admin-danger-zone.component';
import { CreateTaskModalComponent } from './work-management/group-detail/group-tasks/create-task-modal/create-task-modal.component';
import { RenameColumnModalComponent } from './work-management/group-detail/group-tasks/rename-column-modal/rename-column-modal.component';
import { CustomFieldsSettingsModalComponent } from './work-management/group-detail/group-tasks/custom-fields-settings-modal/custom-fields-settings-modal.component';
import { DeleteTaskModalComponent } from './work-management/group-detail/group-tasks/delete-task-modal/delete-task-modal.component';
import { DeleteColumnModalComponent } from './work-management/group-detail/group-tasks/delete-column-modal/delete-column-modal.component';
import { CustomFieldService } from './services/custom-field.service';
import { AvatarComponent } from '../../core/components/avatar/avatar.component';
import { AvatarService } from '../../core/services/avatar.service';

@NgModule({
  declarations: [
    LayoutComponent,
    AppsComponent,
    WorkManagementComponent,
    FilesComponent,
    CrmComponent,
    CommunitiesComponent,
    LibraryComponent,
    LoungeComponent,
    FileListComponent,
    GroupDetailComponent,
    GroupActivityComponent,
    GroupDashboardComponent,
    GroupTasksComponent,
    GroupAdminComponent,
    TaskDetailComponent,
    LoungeStoryDetailComponent,
    CreateStoryModalComponent,
    CreateGroupModalComponent,
    AdminGeneralComponent,
    AdminMembersComponent,
    AdminPermissionsComponent,
    AdminDangerZoneComponent
  ],
  imports: [
    CommonModule,
    WorkplaceRoutingModule,
    RouterModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    CreateTaskModalComponent,
    RenameColumnModalComponent,
    DeleteColumnModalComponent,
    CustomFieldsSettingsModalComponent,
    DeleteTaskModalComponent,
    AvatarComponent
  ],
  providers: [
    CustomFieldService,
    AvatarService
  ]
})
export class WorkplaceModule { }
