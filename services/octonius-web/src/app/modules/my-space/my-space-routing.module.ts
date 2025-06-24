import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { LayoutComponent } from './layout/layout.component'
import { InboxComponent } from './inbox/inbox.component'
import { WorkloadComponent } from './workload/workload.component'
import { FilesComponent } from './files/files.component'
import { NoteEditorComponent } from './note-editor/note-editor.component'

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'inbox', pathMatch: 'full' },
      { path: 'inbox', component: InboxComponent },
      { path: 'workload', component: WorkloadComponent },
      { path: 'files', component: FilesComponent },
      { path: 'note-editor', component: NoteEditorComponent },
      { path: 'note-editor/:id', component: NoteEditorComponent }
    ]
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MySpaceRoutingModule { } 