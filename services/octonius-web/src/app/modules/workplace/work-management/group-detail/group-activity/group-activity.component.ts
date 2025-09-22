import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { User, AuthService } from '../../../../../core/services/auth.service';
import { WorkGroupService, WorkGroup } from '../../../services/work-group.service';
import { GroupActivityService, GroupActivityPost } from '../../../services/group-activity.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../../../environments/environment';

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

  // Tiptap editor configuration
  editorConfig = {
    placeholder: 'What\'s on your mind?',
    showToolbar: true,
    showBubbleMenu: true,
    showCharacterCount: true,
    autoExpand: true,
    minHeight: '120px',
    readOnly: false,
    toolbarItems: ['bold', 'italic', 'underline', 'link', 'bulletList', 'orderedList', 'table', 'emoji'],
    enableImageUpload: true,
    enableEmojiPicker: true,
    enableTableControls: true,
    sourceContext: 'group-activity',
    enableMentions: true,
    groupId: undefined as string | undefined,
    workplaceId: undefined as string | undefined
  };

  constructor(
    private activityService: GroupActivityService,
    private authService: AuthService,
    private workGroupService: WorkGroupService,
    private toastService: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.groupSub = this.workGroupService.getCurrentGroup().subscribe(group => {
      this.group = group;
      // Update editor config with group context for mentions
      if (group) {
        this.editorConfig.groupId = group.uuid;
        // Get workplace ID from current user context
        if (this.currentUser?.current_workplace_id) {
          this.editorConfig.workplaceId = this.currentUser.current_workplace_id;
        }
      }
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
        // Ensure the post has all necessary data, including user information
        const newPost: GroupActivityPost = {
          ...post,
          showMenu: false,
          showComments: false,
          loadingComments: false,
          comments: [],
          newComment: '',
          submittingComment: false,
          // Ensure user data is present
          user: post.user || {
            uuid: this.currentUser?.uuid || '',
            first_name: this.currentUser?.first_name || 'Unknown',
            last_name: this.currentUser?.last_name || 'User',
            avatar_url: this.currentUser?.avatar_url || undefined
          }
        };
        this.posts.unshift(newPost);
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
        // Ensure the comment has all necessary user data
        const newComment = {
          ...comment,
          user: comment.user || {
            uuid: this.currentUser?.uuid || '',
            first_name: this.currentUser?.first_name || 'Unknown',
            last_name: this.currentUser?.last_name || 'User',
            avatar_url: this.currentUser?.avatar_url || undefined
          }
        };
        
        // Add the new comment to the list
        if (!post.comments) post.comments = [];
        post.comments.push(newComment);
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

  // Helper method to get user avatar with fallback
  getUserAvatarUrl(user: any): string {
    return user?.avatar_url || environment.defaultAvatarUrl;
  }
}
