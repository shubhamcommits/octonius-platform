import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TiptapEditorComponent } from '../../../core/components/tiptap-editor/tiptap-editor.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-mention-example',
  standalone: true,
  imports: [CommonModule, FormsModule, TiptapEditorComponent],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">Mention Example - My Space</h1>
      
      <div class="card bg-base-100 shadow-lg border border-base-200">
        <div class="card-body">
          <h2 class="card-title mb-4">Try mentioning users and files!</h2>
          <p class="text-base-content/70 mb-4">
            Type @ to mention users or # to mention files. In my-space context, 
            you can mention any user in your workplace and any file you have access to.
          </p>
          
          <app-tiptap-editor
            [config]="editorConfig"
            [(ngModel)]="content"
            name="mentionExample">
          </app-tiptap-editor>
          
          <div class="mt-4 p-4 bg-base-200 rounded-lg">
            <h3 class="font-semibold mb-2">Current Content:</h3>
            <pre class="text-sm text-base-content/70 whitespace-pre-wrap">{{ content }}</pre>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class MentionExampleComponent implements OnInit {
  content = '';
  currentUser: any = null;

  editorConfig = {
    placeholder: 'Type @ to mention users or # to mention files...',
    showToolbar: true,
    showBubbleMenu: true,
    showCharacterCount: true,
    maxHeight: '300px',
    minHeight: '150px',
    readOnly: false,
    toolbarItems: ['bold', 'italic', 'underline', 'bulletList', 'orderedList', 'link', 'emoji'],
    enableImageUpload: true,
    enableEmojiPicker: true,
    enableTableControls: true,
    sourceContext: 'my-space',
    enableMentions: true,
    groupId: undefined, // No group context for my-space
    workplaceId: undefined // Will be set in ngOnInit
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // Set workplace ID from current user context for my-space mentions
    if (this.currentUser?.current_workplace_id) {
      this.editorConfig.workplaceId = this.currentUser.current_workplace_id;
    }
    console.log('Mention example initialized for my-space context');
  }
}
