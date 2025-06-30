import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { User, AuthService } from '../../../../../core/services/auth.service';
import { WorkGroupService, WorkGroup } from '../../../services/work-group.service';
import { GroupActivityService, GroupActivityPost } from '../../../services/group-activity.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-group-activity',
  standalone: false,
  templateUrl: './group-activity.component.html',
  styleUrls: ['./group-activity.component.scss']
})
export class GroupActivityComponent implements OnInit, OnDestroy, AfterViewInit {
  posts: GroupActivityPost[] = [];
  isLoading = false;
  newPostContent = '';
  isSubmitting = false;
  currentUser: User | null = null;
  group: WorkGroup | null = null;
  private groupSub: Subscription | null = null;

  constructor(
    private activityService: GroupActivityService,
    private authService: AuthService,
    private workGroupService: WorkGroupService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.groupSub = this.workGroupService.getCurrentGroup().subscribe(group => {
      this.group = group;
      this.fetchPosts();
    });
  }

  ngOnDestroy(): void {
    if (this.groupSub) this.groupSub.unsubscribe();
    document.removeEventListener('click', this.closeAllDropdowns);
  }

  ngAfterViewInit(): void {
    document.addEventListener('click', this.closeAllDropdowns);
  }

  fetchPosts() {
    if (!this.group) return;
    this.isLoading = true;
    this.activityService.list(this.group.uuid).subscribe({
      next: (posts) => {
        this.posts = posts.map(post => ({ ...post, showMenu: false }));
        this.isLoading = false;
      },
      error: (err) => {
        this.toastService.error('Failed to load activity posts.');
        this.isLoading = false;
      }
    });
  }

  createPost() {
    if (!this.group || !this.newPostContent.trim()) return;
    this.isSubmitting = true;
    this.activityService.create(this.group.uuid, this.newPostContent.trim()).subscribe({
      next: (post) => {
        this.posts.unshift({ ...post, showMenu: false });
        this.newPostContent = '';
        this.isSubmitting = false;
      },
      error: (err) => {
        this.toastService.error('Failed to create post.');
        this.isSubmitting = false;
      }
    });
  }

  toggleLike(post: any) {
    if (!this.group) return;
    if (post.liked_by_current_user) {
      this.activityService.unlike(this.group.uuid, post.uuid).subscribe({
        next: (res) => {
          post.like_count = res.likeCount;
          post.liked_by_current_user = false;
        },
        error: () => {
          this.toastService.error('Failed to unlike post.');
        }
      });
    } else {
      this.activityService.like(this.group.uuid, post.uuid).subscribe({
        next: (res) => {
          post.like_count = res.likeCount;
          post.liked_by_current_user = true;
        },
        error: () => {
          this.toastService.error('Failed to like post.');
        }
      });
    }
  }

  editPost(post: any) {
    // TODO: Implement edit post logic (open modal or inline edit)
    this.toastService.info('Edit post coming soon!');
  }

  deletePost(post: any) {
    // TODO: Implement delete post logic (confirmation and API call)
    this.toastService.info('Delete post coming soon!');
  }

  // Close all dropdowns when opening one
  openDropdown(post: any) {
    this.posts.forEach(p => { if (p !== post) p.showMenu = false; });
    post.showMenu = !post.showMenu;
  }

  closeAllDropdowns = () => {
    this.posts.forEach(p => p.showMenu = false);
  }

  toggleComments(post: any) {
    post.showComments = !post.showComments;
    
    // Load comments if opening and not already loaded
    if (post.showComments && !post.comments) {
      post.loadingComments = true;
      this.activityService.listComments(this.group!.uuid, post.uuid).subscribe({
        next: (comments) => {
          post.comments = comments;
          post.loadingComments = false;
        },
        error: () => {
          this.toastService.error('Failed to load comments.');
          post.loadingComments = false;
        }
      });
    }
  }

  addComment(post: any) {
    if (!this.group || !post.newComment?.trim()) return;
    
    post.submittingComment = true;
    this.activityService.createComment(this.group.uuid, post.uuid, post.newComment.trim()).subscribe({
      next: (comment) => {
        // Add the new comment to the list
        if (!post.comments) post.comments = [];
        post.comments.push(comment);
        post.comment_count = (post.comment_count || 0) + 1;
        post.newComment = '';
        post.submittingComment = false;
      },
      error: () => {
        this.toastService.error('Failed to post comment.');
        post.submittingComment = false;
      }
    });
  }

  handleCommentKeydown(event: KeyboardEvent, post: any) {
    // Allow Shift+Enter for new lines, Enter alone submits the comment
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.addComment(post);
    }
  }
}
