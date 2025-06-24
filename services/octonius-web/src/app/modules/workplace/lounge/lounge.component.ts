import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface LoungeStory {
  id: string;
  title: string;
  date: string;
  time: string;
  image: string;
  description: string;
  highlight?: boolean;
  event?: boolean;
  eventDate?: string;
  eventLocation?: string;
  eventAttending?: number;
  eventStatus?: string;
  author?: string;
}

@Component({
  selector: 'app-lounge',
  standalone: false,
  templateUrl: './lounge.component.html',
  styleUrl: './lounge.component.scss'
})
export class LoungeComponent {
  globalStories: LoungeStory[] = [
    {
      id: '1',
      title: 'Outstanding Client Support',
      date: 'June 10, 2025',
      time: '3:30 PM',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b',
      description: `Explore the latest trends in workplace culture and discover how to enhance your team's productivity and well-being.`
    },
    {
      id: '2',
      title: 'CEO MEETING',
      date: 'July 15, 2025',
      time: '2:00 PM',
      image: 'https://randomuser.me/api/portraits/women/44.jpg',
      description: `A great event: our CEO is coming to Barcelona HQ, we are organizing an event to meet and greet him. Casual lunch.`,
      event: true,
      eventDate: 'July 15, 2025 2:00 PM',
      eventLocation: 'HQ Barcelona, Sala Buena Vista',
      eventAttending: 89,
      eventStatus: 'I\'m going',
      highlight: true
    }
  ];

  managementUpdates: LoungeStory[] = [
    {
      id: '3',
      title: 'Outstanding Client Support',
      date: 'June 10, 2025',
      time: '3:30 PM',
      image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b',
      description: `Explore the latest trends in workplace culture and discover how to enhance your team's productivity and well-being.`
    },
    {
      id: '4',
      title: 'Exceptional Customer Engagement',
      date: 'July 15, 2025',
      time: '2:00 PM',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
      description: `Dive into the newest insights on workplace dynamics and learn effective strategies to boost your team's efficiency and happiness.`
    }
  ];

  constructor(private router: Router) {}

  openStory(story: LoungeStory) {
    this.router.navigate(['/workplace/lounge/story', story.id]);
  }
}
