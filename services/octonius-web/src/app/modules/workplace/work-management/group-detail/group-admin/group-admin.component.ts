import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WorkGroup, WorkGroupService } from '../../../services/work-group.service';

@Component({
  selector: 'app-group-admin',
  standalone: false,
  templateUrl: './group-admin.component.html',
  styleUrl: './group-admin.component.scss'
})
export class GroupAdminComponent implements OnInit, OnDestroy {
  group: WorkGroup | undefined;
  private destroy$ = new Subject<void>();

  constructor(
    private workGroupService: WorkGroupService
  ) {}

  ngOnInit(): void {
    // Subscribe to the current group
    this.workGroupService.getCurrentGroup()
      .pipe(takeUntil(this.destroy$))
      .subscribe(group => {
        this.group = group || undefined;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
