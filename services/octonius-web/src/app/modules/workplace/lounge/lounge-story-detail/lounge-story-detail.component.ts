import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

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

  private mockStories: LoungeStoryDetail[] = [
    {
      uuid: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Outstanding Client Support',
      description: 'Explore the latest trends in workplace culture and discover how to enhance your team\'s productivity and well-being.',
      type: 'news',
      date: 'June 10, 2025',
      time: '3:30 PM',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b',
      user_id: '550e8400-e29b-41d4-a716-446655440011',
      created_at: '2025-06-10T15:30:00Z',
      updated_at: '2025-06-10T15:30:00Z',
      author: 'Miriam Enzo',
      authorAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      content: `Explore the latest trends in workplace culture and discover how to enhance your team's productivity and well-being.`
    },
    {
      uuid: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Meet the CEO',
      description: 'A great event: our CEO is coming to Barcelona HQ, we are organizing an event to meet and greet him. Casual lunch.',
      type: 'event',
      date: 'July 15, 2025',
      time: '2:00 PM',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
      user_id: '550e8400-e29b-41d4-a716-446655440011',
      event: true,
      event_date: '2025-07-15T14:00:00Z',
      location: 'HQ Barcelona, Sala Buena Vista',
      attendees: [],
      created_at: '2025-06-01T10:00:00Z',
      updated_at: '2025-06-01T10:00:00Z',
      eventAttending: 89,
      eventStatus: `I'm going`,
      author: 'Miriam Enzo',
      authorAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      content: `Join us for an exclusive opportunity to meet our CEO, Alex Rivera, on July 15, 2025, at 2:00 PM in HQ Barcelona, Sala Buena Vista. This is a chance to engage directly, ask questions, and gain insights into our company's vision and future. Your participation is valuable, and we encourage all employees to attend this important event!`
    },
    {
      uuid: '550e8400-e29b-41d4-a716-446655440005',
      title: 'New Human capital',
      description: 'Important updates about our human capital initiatives',
      type: 'update',
      date: 'May 16, 2025',
      time: '4:56 PM',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
      user_id: '550e8400-e29b-41d4-a716-446655440011',
      created_at: '2025-05-16T16:56:00Z',
      updated_at: '2025-05-16T16:56:00Z',
      author: 'Miriam Enzo',
      authorAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      content: `In today's dynamic workplace, fostering a vibrant culture is essential for organizational success. People are at the heart of every company, and their diverse backgrounds, experiences, and perspectives shape the environment in which they work. Embracing inclusivity and encouraging open communication can lead to innovative ideas and stronger collaboration among teams.

Organizations that prioritize employee well-being and engagement often see higher productivity and job satisfaction. Celebrating achievements, promoting professional development, and creating opportunities for social interaction can enhance the sense of belonging among employees.

Ultimately, a positive organizational culture not only attracts top talent but also retains them, driving long-term success and growth.`
    }
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const uuid = params.get('uuid');
      this.story = this.mockStories.find(s => s.uuid === uuid) || null;
    });
  }
}
