import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
import { ReactiveFormsModule } from '@angular/forms';

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
    CreateStoryModalComponent
  ],
  imports: [
    CommonModule,
    WorkplaceRoutingModule,
    RouterModule,
    SharedModule,
    ReactiveFormsModule
  ]
})
export class WorkplaceModule { }
