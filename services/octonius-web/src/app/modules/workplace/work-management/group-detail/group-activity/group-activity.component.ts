import { Component, Input, OnInit } from '@angular/core';
import { User, AuthService } from '../../../../../core/services/auth.service';
import { WorkGroup } from '../../../services/work-group.service';

interface Post {
  author: { name: string; avatar_url: string };
  timestamp: Date;
  title: string;
  content: string;
  likes: number;
  comments: number;
  expanded?: boolean;
}

@Component({
  selector: 'app-group-activity',
  standalone: false,
  templateUrl: './group-activity.component.html',
  styleUrls: ['./group-activity.component.scss']
})
export class GroupActivityComponent implements OnInit {
  @Input() group: WorkGroup | undefined;
  
  posts: Post[] = [];

  constructor() { }

  ngOnInit(): void {

    // Mock data for posts
    this.posts = [
      {
        author: { name: 'Miriam Enzo', avatar_url: 'https://i.pravatar.cc/150?u=a042581f4e29026704e' },
        timestamp: new Date('2025-05-16T16:56:00'),
        title: 'Updates regarding the new Launch Event',
        content: 'User experience (UX) design is all about creating products that provide meaningful and relevant experiences to users. It involves understanding user needs, behaviors, and motivations through research and testing. A well-designed UX can enhance user satisfaction and drive engagement, making it a crucial aspect of product development.',
        likes: 3,
        comments: 1
      },
      {
        author: { name: 'John Doe', avatar_url: 'https://i.pravatar.cc/150?u=a042581f4e29026704f' },
        timestamp: new Date('2025-05-15T10:30:00'),
        title: 'Weekly Sync Notes',
        content: 'Here are the notes from our weekly sync. Please review and add your comments. We have a lot to cover for the upcoming sprint. Lets make sure we are all aligned on the priorities.',
        likes: 12,
        comments: 5
      }
    ];
  }
}
