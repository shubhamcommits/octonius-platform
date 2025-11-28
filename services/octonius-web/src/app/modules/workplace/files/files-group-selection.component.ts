import { Component } from '@angular/core';
import { WorkGroup } from '../services/work-group.service';
import { GroupSelectionComponent } from '../../shared/components/group-selection/group-selection.component';

@Component({
  selector: 'app-files-group-selection',
  standalone: true,
  template: `
    <app-group-selection
      [redirectPath]="'/workplace/files'"
      [title]="'Workplace Files'"
      [description]="'Select a group to view and manage their files and notes'"
      [showCreateButton]="false"
      [showSearch]="true"
      [showFilter]="true"
      [showSort]="true"
      [searchPlaceholder]="'Search groups...'"
      [emptyStateImage]="'https://media.octonius.com/assets/icon_files.svg'"
      [emptyStateMessage]="'You don\\'t have access to any groups yet. Contact your administrator to get added to a group.'"
      (groupSelected)="onGroupSelected($event)">
    </app-group-selection>
  `,
  imports: [GroupSelectionComponent]
})
export class FilesGroupSelectionComponent {
  onGroupSelected(group: WorkGroup): void {
    // Group selection is handled by the reusable component's navigation
    console.log('Group selected for files:', group);
  }
}
