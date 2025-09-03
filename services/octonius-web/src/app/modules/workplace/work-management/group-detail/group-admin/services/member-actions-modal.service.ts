import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GroupMember } from '../../../../services/group-member.service';

@Injectable({
  providedIn: 'root'
})
export class MemberActionsModalService {
  private selectedMemberSubject = new BehaviorSubject<GroupMember | null>(null);
  public selectedMember$ = this.selectedMemberSubject.asObservable();

  openModal(member: GroupMember): void {
    // Ensure member data is complete before opening
    if (member && member.user) {
      this.selectedMemberSubject.next(member);
    }
  }

  closeModal(): void {
    this.selectedMemberSubject.next(null);
  }

  get selectedMember(): GroupMember | null {
    return this.selectedMemberSubject.value;
  }
}
