import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterEvent, UrlSegment } from '@angular/router';
import { WorkGroup, WorkGroupService } from '../../services/work-group.service';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-group-detail',
  standalone: false,
  templateUrl: './group-detail.component.html',
  styleUrls: ['./group-detail.component.scss']
})
export class GroupDetailComponent implements OnInit {
  group: WorkGroup | undefined;
  activeView: string = 'activity';

  menuItems = [
    { label: 'Dashboard', description: 'Your team\'s dashboard', icon: 'LayoutDashboard', route: './dashboard' },
    { label: 'Activity', description: 'For team communication', icon: 'MessageSquare', route: './activity' },
    { label: 'Tasks', description: 'This is where work happens', icon: 'CheckSquare', route: './tasks' },
    { label: 'Admin Area', description: 'Manage the group settings', icon: 'Settings', route: './admin' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workGroupService: WorkGroupService
  ) { }

  ngOnInit(): void {
    const groupId = this.route.snapshot.paramMap.get('uuid');
    if (groupId) {
      this.workGroupService.getGroup(groupId).subscribe(group => {
        this.group = group;
      });
    }

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event: NavigationEnd) => event.urlAfterRedirects),
      startWith(this.router.url),
      map(url => {
        const urlSegments = url.split('/');
        return urlSegments.pop() || 'activity';
      })
    ).subscribe(view => {
      this.activeView = view;
    });
  }

  isTaskDetailRoute(): boolean {
    // Check if the current child route matches 'tasks/:taskId'
    const child = this.route.firstChild;
    if (!child) return false;
    const segments = child.snapshot.url;
    return segments.length === 2 && segments[0].path === 'tasks';
  }
}
