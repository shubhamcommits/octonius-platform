import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router, ActivatedRoute } from '@angular/router'
import { FormsModule } from '@angular/forms'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import { UserService } from '../../../core/services/user.service'
import { FileService } from '../../../core/services/file.service'
import { User } from '../../../core/services/auth.service'
import { File } from '../../../core/models/file.model'
import { AuthService } from '../../../core/services/auth.service'
import { environment } from '../../../../environments/environment'

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './note-editor.component.html',
  styleUrls: ['./note-editor.component.scss']
})
export class NoteEditorComponent implements OnInit, OnDestroy {
  @ViewChild('editorjs', { static: true }) editorElement!: ElementRef
  editor!: EditorJS
  noteTitle = ''
  createdBy = ''
  createdByAvatar = ''
  lastEdited = ''
  isLoading = true
  error = ''
  noteId: string | null = null
  user: any = null
  workplaceId: string | null = null
  userName = ''
  userId = ''
  note: File | null = null
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private fileService: FileService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.isLoading = true
    this.userService.getCurrentUser().subscribe({
      next: (user: User) => {
        this.userName = user.first_name
        this.userId = user.uuid
        this.workplaceId = user.current_workplace_id || ''
        this.createdBy = user.first_name || user.email?.split('@')[0] || 'User'
        this.createdByAvatar = user.avatar_url || environment.defaultAvatarUrl
        if (this.noteId) {
          this.fileService.getNote(this.noteId).subscribe({
            next: (note: File) => {
              this.note = note
              this.noteTitle = note.title || ''
              this.lastEdited = note.last_modified || ''
              this.initializeEditor(note.content)
              this.isLoading = false
            },
            error: (err: Error) => {
              this.error = 'Failed to load note'
              this.isLoading = false
              console.error('Error loading note:', err)
              this.initializeEditor()
            }
          })
        } else {
          this.initializeEditor()
          this.isLoading = false
        }
      },
      error: (err: Error) => {
        this.error = 'Failed to load user data'
        this.isLoading = false
        console.error('Error loading user:', err)
      }
    })

    // Subscribe to current user
    this.authService.currentUser$.subscribe((user: any) => {
      if (user) {
        this.createdBy = user.first_name || user.last_name 
          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
          : user.email;
        this.createdByAvatar = user.avatar_url || environment.defaultAvatarUrl;
      }
    });
  }
  
  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.destroy()
    }
  }
  
  initializeEditor(content: any = { blocks: [] }): void {
    this.editor = new EditorJS({
      holder: 'editorjs',
      placeholder: 'Write something or press / for options',
      tools: {
        header: {
          class: Header as any,
          config: {
            placeholder: 'Enter a header',
            levels: [1, 2, 3, 4, 5, 6],
            defaultLevel: 3
          }
        },
        list: {
          class: List as any,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered'
          }
        }
      },
      data: content
    })
  }
  
  async saveNote(): Promise<void> {
    try {
      const outputData = await this.editor.save()
      const note = {
        id: this.noteId || '',
        title: this.noteTitle,
        content: outputData
      }
      if (this.user && this.workplaceId) {
        this.fileService.saveNote(note).subscribe({
          next: () => {
            // Optionally show a success message
            this.router.navigate(['/my-space/files'])
          },
          error: err => {
            this.error = 'Failed to save note.'
          }
        })
      }
    } catch (error) {
      this.error = 'Saving failed.'
    }
  }
  
  shareNote(): void {
    // Implement share functionality
  }
  
  showMoreOptions(): void {
    // Implement more options menu
  }
  
  goBackToFiles(): void {
    this.router.navigate(['/my-space/files'])
  }
} 