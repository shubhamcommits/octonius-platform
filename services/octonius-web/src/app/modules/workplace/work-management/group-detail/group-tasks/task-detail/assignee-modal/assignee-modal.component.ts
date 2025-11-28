import { Component, OnInit, OnDestroy, HostListener, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { GroupMember, GroupTaskService } from '../../../../../services/group-task.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { ModalService } from '../../../../../../../core/services/modal.service';
import { Subject } from 'rxjs';
import { SharedModule } from '../../../../../../shared/shared.module';
import { AvatarComponent } from '../../../../../../../core/components/avatar/avatar.component';
import { AvatarService } from '../../../../../../../core/services/avatar.service';

export interface AssigneeData {
  selectedUserIds: string[];
  groupId: string;
}

@Component({
  selector: 'app-assignee-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, AvatarComponent],
  templateUrl: './assignee-modal.component.html',
  styleUrls: ['./assignee-modal.component.scss']
})
export class AssigneeModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() assigneeData?: AssigneeData;
  @Input() onSave?: (selectedUserIds: string[]) => void;
  @Input() onCancel?: () => void;

  // Form data
  assigneeForm = {
    selectedUserIds: [] as string[]
  };

  // Data
  groupMembers: GroupMember[] = [];
  searchQuery = '';
  totalCount = 0;
  hasMore = false;
  currentOffset = 0;
  readonly limit = 5;

  // Loading states
  isSaving = false;
  isLoadingMembers = false;
  isLoadingMore = false;

  // Search subject for debounced search
  private searchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];

  constructor(
    private toastService: ToastService,
    private modalService: ModalService,
    private groupTaskService: GroupTaskService,
    private avatarService: AvatarService
  ) {}

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.resetForm();
    this.loadMembers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assigneeData'] && changes['assigneeData'].currentValue) {
      this.resetForm();
      this.loadMembers();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupSearchSubscription(): void {
    const searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          this.searchQuery = query;
          this.currentOffset = 0;
          this.groupMembers = [];
          return this.searchMembers(query);
        })
      )
      .subscribe({
        next: (result) => {
          this.groupMembers = result.members;
          this.totalCount = result.totalCount;
          this.hasMore = result.hasMore;
          this.isLoadingMembers = false;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.toastService.error('Failed to search members');
          this.isLoadingMembers = false;
        }
      });

    this.subscriptions.push(searchSubscription);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.onCancelAction();
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnterKey(event: KeyboardEvent): void {
    if (event.target instanceof HTMLInputElement) {
      // Allow normal enter behavior in inputs
      return;
    }
    if (!this.isSaving) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  resetForm(): void {
    if (this.assigneeData) {
      this.assigneeForm.selectedUserIds = [...this.assigneeData.selectedUserIds];
    } else {
      this.assigneeForm.selectedUserIds = [];
    }
    this.isSaving = false;
  }

  loadMembers(): void {
    if (!this.assigneeData?.groupId) return;
    
    this.isLoadingMembers = true;
    this.searchMembers('').subscribe({
      next: (result) => {
        this.groupMembers = result.members;
        this.totalCount = result.totalCount;
        this.hasMore = result.hasMore;
        this.isLoadingMembers = false;
      },
      error: (error) => {
        console.error('Error loading members:', error);
        this.toastService.error('Failed to load group members');
        this.isLoadingMembers = false;
      }
    });
  }

  private searchMembers(query: string) {
    if (!this.assigneeData?.groupId) {
      throw new Error('Group ID is required');
    }
    
    return this.groupTaskService.getGroupMembers(
      this.assigneeData.groupId,
      query,
      this.limit,
      this.currentOffset
    );
  }

  onSearchChange(query: string): void {
    this.isLoadingMembers = true;
    this.searchSubject.next(query);
  }

  loadMore(): void {
    if (this.isLoadingMore || !this.hasMore || !this.assigneeData?.groupId) return;

    this.isLoadingMore = true;
    this.currentOffset += this.limit;

    this.groupTaskService.getGroupMembers(
      this.assigneeData.groupId,
      this.searchQuery,
      this.limit,
      this.currentOffset
    ).subscribe({
      next: (result) => {
        this.groupMembers = [...this.groupMembers, ...result.members];
        this.hasMore = result.hasMore;
        this.isLoadingMore = false;
      },
      error: (error) => {
        console.error('Error loading more members:', error);
        this.toastService.error('Failed to load more members');
        this.isLoadingMore = false;
        this.currentOffset -= this.limit; // Revert offset on error
      }
    });
  }

  toggleAssignee(userId: string, event: any): void {
    event.stopPropagation();
    const index = this.assigneeForm.selectedUserIds.indexOf(userId);
    if (index > -1) {
      this.assigneeForm.selectedUserIds.splice(index, 1);
    } else {
      this.assigneeForm.selectedUserIds.push(userId);
    }
  }

  isAssigneeSelected(userId: string): boolean {
    return this.assigneeForm.selectedUserIds.includes(userId);
  }

  onSubmit(): void {
    this.isSaving = true;

    // Call the callback function
    if (this.onSave) {
      this.onSave(this.assigneeForm.selectedUserIds);
    }
    
    this.isSaving = false;
  }

  onCancelAction(): void {
    if (this.onCancel) {
      this.onCancel();
    }
    this.modalService.closeModal();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onCancelAction();
    }
  }

  // Prevent modal from closing when clicking inside
  onModalClick(event: Event): void {
    event.stopPropagation();
  }


  getAvatarUrl(user: any): string | null {
    return this.avatarService.getAvatarUrl(user);
  }

  getUserDisplayName(user: any): string {
    return this.avatarService.getUserDisplayName(user);
  }

  getUserInitials(user: any): string {
    return this.avatarService.getUserInitials(user);
  }
} 