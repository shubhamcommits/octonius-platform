import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoungeService, LoungeStory } from '../services/lounge.service';

@Component({
  selector: 'app-lounge',
  standalone: false,
  templateUrl: './lounge.component.html',
  styleUrl: './lounge.component.scss'
})
export class LoungeComponent implements OnInit {
  globalStories: LoungeStory[] = [];
  managementUpdates: LoungeStory[] = [];
  isLoading = true;
  error: string | null = null;
  showCreateModal = false;
  isSubmitting = false;
  feedback: string | null = null;

  constructor(private router: Router, private loungeService: LoungeService) {}

  ngOnInit(): void {
    this.fetchStories();
  }

  fetchStories(): void {
    this.isLoading = true;
    this.loungeService.getStories().subscribe({
      next: (res) => {
        // Separate stories by type if needed
        this.globalStories = res.stories.filter(s => s.type === 'event' || s.type === 'news');
        this.managementUpdates = res.stories.filter(s => s.type === 'update');
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load stories.';
        this.isLoading = false;
      }
    });
  }

  openStory(story: LoungeStory) {
    this.router.navigate(['/workplace/lounge/story', story.id]);
  }

  onFilter() {
    console.log('Filter clicked');
  }

  onAdd() {
    this.showCreateModal = true;
  }

  onSearch(query: string) {
    console.log('Search:', query);
  }

  handleModalClose() {
    this.showCreateModal = false;
    this.feedback = null;
  }

  handleStoryCreated(data: Partial<LoungeStory>) {
    this.isSubmitting = true;
    this.loungeService.createStory(data).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showCreateModal = false;
        this.feedback = 'Story created!';
        this.fetchStories();
      },
      error: () => {
        this.isSubmitting = false;
        this.feedback = 'Failed to create story.';
      }
    });
  }
}
