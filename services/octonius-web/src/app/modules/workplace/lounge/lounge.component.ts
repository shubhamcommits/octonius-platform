import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LoungeService, LoungeStory } from '../services/lounge.service';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lounge',
  standalone: false,
  templateUrl: './lounge.component.html',
  styleUrl: './lounge.component.scss'
})
export class LoungeComponent implements OnInit, OnDestroy {
  globalStories: LoungeStory[] = [];
  managementUpdates: LoungeStory[] = [];
  isLoading = true;
  error: string | null = null;
  showCreateModal = false;
  isSubmitting = false;
  feedback: string | null = null;
  currentTheme: string = 'light';
  private themeSubscription: Subscription;

  constructor(
    private router: Router, 
    private loungeService: LoungeService,
    private authService: AuthService,
    private themeService: ThemeService
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  ngOnInit(): void {
    this.fetchStories();
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  getLoungeStoriesEmptyStateImage(): string {
    return this.currentTheme === 'night' 
      ? 'https://media.octonius.com/assets/no-lounge-light.svg'
      : 'https://media.octonius.com/assets/no-lounge-dark.svg'
  }

  getManagementUpdatesEmptyStateImage(): string {
    return this.currentTheme === 'night' 
      ? 'https://media.octonius.com/assets/no-lounge-light.svg'
      : 'https://media.octonius.com/assets/no-lounge-dark.svg'
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
    this.router.navigate(['/workplace/lounge/story', story.uuid]);
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
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.feedback = 'User not authenticated.';
      this.isSubmitting = false;
      return;
    }
    
    const storyData = {
      ...data,
      user_id: currentUser.uuid
    };
    
    this.loungeService.createStory(storyData).subscribe({
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
