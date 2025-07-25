import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AppsComponent } from './apps/apps.component';
import { WorkManagementComponent } from './work-management/work-management.component';
import { FilesComponent } from './files/files.component';
import { CrmComponent } from './crm/crm.component';
import { CommunitiesComponent } from './communities/communities.component';
import { LibraryComponent } from './library/library.component';
import { LoungeComponent } from './lounge/lounge.component';
import { LoungeStoryDetailComponent } from './lounge/lounge-story-detail/lounge-story-detail.component';
import { FileListComponent } from './file-list/file-list.component';
import { GroupDetailComponent } from './work-management/group-detail/group-detail.component';
import { GroupActivityComponent } from './work-management/group-detail/group-activity/group-activity.component';
import { GroupDashboardComponent } from './work-management/group-detail/group-dashboard/group-dashboard.component';
import { GroupTasksComponent } from './work-management/group-detail/group-tasks/group-tasks.component';
import { GroupAdminComponent } from './work-management/group-detail/group-admin/group-admin.component';
import { TaskDetailComponent } from './work-management/group-detail/group-tasks/task-detail/task-detail.component';
import { AdminGeneralComponent } from './work-management/group-detail/group-admin/admin-general/admin-general.component';
import { AdminMembersComponent } from './work-management/group-detail/group-admin/admin-members/admin-members.component';
import { AdminPermissionsComponent } from './work-management/group-detail/group-admin/admin-permissions/admin-permissions.component';
import { AdminDangerZoneComponent } from './work-management/group-detail/group-admin/admin-danger-zone/admin-danger-zone.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'apps', pathMatch: 'full' },
      { path: 'apps', component: AppsComponent },
      { path: 'work-management', component: WorkManagementComponent },
      {
        path: 'work-management/:uuid',
        component: GroupDetailComponent,
        children: [
          { path: '', redirectTo: 'activity', pathMatch: 'full' },
          { path: 'activity', component: GroupActivityComponent },
          { path: 'dashboard', component: GroupDashboardComponent },
          { path: 'tasks', component: GroupTasksComponent },
          { path: 'tasks/:taskId', component: TaskDetailComponent },
          { 
            path: 'admin', 
            component: GroupAdminComponent,
            children: [
              { path: '', redirectTo: 'general', pathMatch: 'full' },
              { path: 'general', component: AdminGeneralComponent },
              { path: 'members', component: AdminMembersComponent },
              { path: 'permissions', component: AdminPermissionsComponent },
              { path: 'danger-zone', component: AdminDangerZoneComponent }
            ]
          },
        ]
      },
      { path: 'files', component: FilesComponent },
      { path: 'files/:folder', component: FileListComponent },
      { path: 'crm', component: CrmComponent },
      { path: 'communities', component: CommunitiesComponent },
      { path: 'library', component: LibraryComponent },
      {
        path: 'lounge',
        children: [
          { path: '', component: LoungeComponent },
          { path: 'story/:uuid', component: LoungeStoryDetailComponent },
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WorkplaceRoutingModule { }
