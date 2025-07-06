import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../../environments/environment';

interface LoungeStoryDetail {
  uuid: string;
  title: string;
  description: string;
  type: 'news' | 'event' | 'update';
  date: string;
  time?: string;
  image?: string;
  user_id: string;
  event_date?: string;
  location?: string;
  attendees?: string[];
  created_at: string;
  updated_at: string;
  // UI-specific fields
  event?: boolean;
  eventAttending?: number;
  eventStatus?: string;
  author?: string;
  authorAvatar?: string;
  content?: string;
}

@Component({
  selector: 'app-lounge-story-detail',
  standalone: false,
  templateUrl: './lounge-story-detail.component.html',
  styleUrls: ['./lounge-story-detail.component.scss']
})
export class LoungeStoryDetailComponent implements OnInit {
  story: LoungeStoryDetail | null = null;
  newComment: string = '';

  private mockStories: LoungeStoryDetail[] = [
    {
      uuid: '1',
      title: 'Insights into Workplace Culture',
      description: 'Explore the latest trends in workplace culture and discover how to enhance your team\'s productivity and well-being.',
      type: 'news',
      date: 'June 10, 2025',
      user_id: 'user-1',
      created_at: '2025-06-10T12:00:00Z',
      updated_at: '2025-06-10T15:30:00Z',
      author: 'Miriam Enzo',
      authorAvatar: environment.defaultAvatarUrl,
      content: `Explore the latest trends in workplace culture and discover how to enhance your team's productivity and well-being.`
    },
    {
      uuid: '2',
      title: 'Meet & Greet with CEO Alex Rivera',
      description: 'A great event: our CEO is coming to Barcelona HQ, we are organizing an event to meet and greet him.',
      type: 'event',
      date: 'July 15, 2025',
      user_id: 'user-1',
      created_at: '2025-07-01T09:00:00Z',
      updated_at: '2025-07-01T10:45:00Z',
      event_date: '2025-07-15T14:00:00Z',
      location: 'HQ Barcelona, Sala Buena Vista',
      eventStatus: `I'm going`,
      author: 'Miriam Enzo',
      authorAvatar: environment.defaultAvatarUrl,
      content: `Join us for an exclusive opportunity to meet our CEO, Alex Rivera, on July 15, 2025, at 2:00 PM in HQ Barcelona, Sala Buena Vista. This is a chance to engage directly, ask questions, and gain insights into our company's vision and future. Your participation is valuable, and we encourage all employees to attend this important event!`
    },
    {
      uuid: '3',
      title: 'Embracing Diversity: The Heart of Our Workplace',
      description: 'Important updates about our human capital initiatives',
      type: 'update',
      date: 'May 16, 2025',
      user_id: 'user-1',
      created_at: '2025-05-16T08:30:00Z',
      updated_at: '2025-05-16T16:56:00Z',
      author: 'Miriam Enzo',
      authorAvatar: environment.defaultAvatarUrl,
      content: `In today's dynamic workplace, fostering a vibrant culture is essential for organizational success. People are at the heart of every company, and their diverse backgrounds, experiences, and perspectives shape the environment in which they work. Embracing inclusivity and encouraging open communication can lead to innovative ideas and stronger collaboration among teams.

        Organizations that prioritize workplace culture often see increased employee engagement, higher retention rates, and improved overall performance. When employees feel valued and heard, they are more likely to contribute their best efforts and remain committed to the company's mission.

        Creating a positive workplace culture requires intentional effort from leadership and team members alike. This includes establishing clear values, promoting work-life balance, recognizing achievements, and providing opportunities for professional development. Regular feedback sessions and team-building activities can also strengthen relationships and build trust among colleagues.

        Moreover, adapting to changing work environments, such as remote or hybrid models, presents new challenges and opportunities for culture building. Companies must find creative ways to maintain connection and camaraderie, whether through virtual coffee breaks, online team challenges, or flexible collaboration tools.

        Ultimately, a strong workplace culture is not just about policies and procedures; it's about creating an environment where everyone feels they belong and can thrive. By investing in our people and culture, we build a foundation for long-term success and innovation.`
    }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const uuid = params.get('uuid');
      this.story = this.mockStories.find(s => s.uuid === uuid) || null;
    });
  }

  toggleLike() {
    // TODO: Implement like functionality
    console.log('Toggle like');
  }

  addComment() {
    if (this.newComment.trim()) {
      // TODO: Implement add comment functionality
      console.log('Add comment:', this.newComment);
      this.newComment = '';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
