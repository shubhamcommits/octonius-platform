import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router, ActivatedRoute } from '@angular/router'
import { FormsModule } from '@angular/forms'

// Tiptap imports
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import CharacterCount from '@tiptap/extension-character-count'
import BubbleMenu from '@tiptap/extension-bubble-menu'
import TextStyle from '@tiptap/extension-text-style'
import { Subscription } from 'rxjs'

import { UserService } from '../../../core/services/user.service'
import { FileService } from '../../../core/services/file.service'
import { User } from '../../../core/services/auth.service'
import { File } from '../../../core/models/file.model'
import { AuthService } from '../../../core/services/auth.service'
import { ThemeService } from '../../../core/services/theme.service'
import { environment } from '../../../../environments/environment'
import { SharedModule } from '../../shared/shared.module'

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SharedModule],
  templateUrl: './note-editor.component.html',
  styleUrls: ['./note-editor.component.scss']
})
export class NoteEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('editorElement', { static: false }) editorElement!: ElementRef
  @ViewChild('bubbleMenuElement', { static: false }) bubbleMenuElement!: ElementRef
  
  editor!: Editor
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
  currentTheme: string = 'light'

  // Auto-save configuration
  autoSaveEnabled = true
  autoSaveInterval = 30 // seconds
  isSaving = false
  hasUnsavedChanges = false
  lastSavedTime: string | null = null
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error' = 'saved'
  private autoSaveTimer: any = null
  private lastSavedContent: any = null
  private themeSubscription: Subscription | null = null
  private initializationAttempts = 0
  private maxInitializationAttempts = 10

  createdByUser: User | null = null
  
  // Editor state
  isEditorFocused = false
  private debouncedSaveTimer: any = null
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private fileService: FileService,
    private authService: AuthService,
    private themeService: ThemeService
  ) {}
  
  ngOnInit(): void {
    // Subscribe to theme changes
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme
      this.updateEditorTheme(theme)
    })
    
    // Extract note ID from route parameters
    this.noteId = this.route.snapshot.paramMap.get('id')
    
    console.log('Loading user data...')
    
    this.userService.getCurrentUser().subscribe({
      next: (user: User) => {
        console.log('User data loaded successfully:', user)
        this.userName = user.first_name || user.email?.split('@')[0] || 'User'
        this.userId = user.uuid
        this.workplaceId = user.current_workplace_id || ''
        
        console.log('User properties set:', {
          userId: this.userId,
          workplaceId: this.workplaceId,
          userName: this.userName
        })
        
        if (this.noteId) {
          this.fileService.getNote(this.noteId).subscribe({
            next: (note: File) => {
              console.log('Note loaded successfully:', note)
              this.note = note
              this.createdByUser = note.owner as unknown as User
              this.noteTitle = note.title || ''
              this.lastEdited = note.last_modified || ''
              this.lastSavedContent = note.content
              this.isLoading = false
              
              // Set the content in the editor if it's already initialized
              if (this.editor && note.content) {
                console.log('Setting editor content:', note.content)
                this.editor.commands.setContent(note.content)
              }
              // If editor is not initialized yet, content will be set in ngAfterViewInit
            },
            error: (err: Error) => {
              console.error('Error loading note:', err)
              this.error = 'Failed to load note'
              this.isLoading = false
              // Editor will still be initialized in ngAfterViewInit for new notes
            }
          })
        } else {
          this.isLoading = false
          // Editor will be initialized in ngAfterViewInit for new notes
        }
      },
      error: (err: Error) => {
        console.error('Error loading user data:', err)
        this.error = 'Failed to load user data'
        this.isLoading = false
      }
    })

    // Subscribe to current user for avatar updates
    this.authService.currentUser$.subscribe((user: any) => {
      console.log('Auth service user update:', user)
      if (user) {
        // Only update display properties, not the core userId
        this.createdBy = user.first_name || user.last_name 
          ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
          : user.email;
        this.createdByAvatar = user.avatar_url || environment.defaultAvatarUrl;
        
        // Ensure userId is set if not already set
        if (!this.userId && user.uuid) {
          console.log('Setting userId from auth service:', user.uuid)
          this.userId = user.uuid
        }
        if (!this.workplaceId && user.current_workplace_id) {
          console.log('Setting workplaceId from auth service:', user.current_workplace_id)
          this.workplaceId = user.current_workplace_id
        }
      }
    });
  }

  ngAfterViewInit(): void {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.initializeEditor()
    }, 100)
  }

  getUserAvatarUrl(user: any): string {
    return user?.avatar_url || environment.defaultAvatarUrl;
  }
  
  ngOnDestroy(): void {
    this.stopAutoSave()
    if (this.debouncedSaveTimer) {
      clearTimeout(this.debouncedSaveTimer)
    }
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe()
    }
    if (this.editor) {
      this.editor.destroy()
    }
  }

  private updateEditorTheme(theme: string): void {
    if (this.editor) {
      // Update editor props with new classes
      this.editor.view.dom.className = this.getEditorClasses()
    }
  }
  
  private initializeEditor(retryCount = 0): void {
    const maxRetries = 5
    const retryDelay = 500

    try {
      const editorElement = this.editorElement?.nativeElement
      if (!editorElement) {
        if (retryCount < maxRetries) {
          console.log(`Editor element not found, retrying... (${retryCount + 1}/${maxRetries})`)
          setTimeout(() => this.initializeEditor(retryCount + 1), retryDelay)
          return
        }
        throw new Error('Editor element not found after maximum retries')
      }

      console.log('Initializing Tiptap editor...')
      
      this.editor = new Editor({
        element: editorElement,
        extensions: [
          StarterKit.configure({
            heading: {
              levels: [1, 2, 3],
              HTMLAttributes: {
                class: 'prose-heading'
              }
            },
            bulletList: {
              HTMLAttributes: {
                class: 'prose-ul'
              }
            },
            orderedList: {
              HTMLAttributes: {
                class: 'prose-ol'
              }
            },
            listItem: {
              HTMLAttributes: {
                class: 'prose-li'
              }
            },
            blockquote: {
              HTMLAttributes: {
                class: 'prose-blockquote'
              }
            },
            code: {
              HTMLAttributes: {
                class: 'prose-code'
              }
            },
            codeBlock: {
              HTMLAttributes: {
                class: 'prose-pre'
              }
            }
          }),
          Placeholder.configure({
            placeholder: 'Start writing your note...',
            emptyEditorClass: 'is-editor-empty'
          }),
          Image.configure({
            HTMLAttributes: {
              class: 'prose-img'
            }
          }),
          Link.configure({
            HTMLAttributes: {
              class: 'prose-link'
            }
          }),
          Table.configure({
            HTMLAttributes: {
              class: 'prose-table'
            }
          }),
          TableRow.configure({
            HTMLAttributes: {
              class: 'prose-tr'
            }
          }),
          TableHeader.configure({
            HTMLAttributes: {
              class: 'prose-th'
            }
          }),
          TableCell.configure({
            HTMLAttributes: {
              class: 'prose-td'
            }
          }),
          TaskList.configure({
            HTMLAttributes: {
              class: 'prose-task-list'
            }
          }),
          TaskItem.configure({
            HTMLAttributes: {
              class: 'prose-task-item'
            }
          }),
          Highlight.configure({
            HTMLAttributes: {
              class: 'prose-highlight'
            }
          }),
          TextStyle,
          CharacterCount,
          BubbleMenu.configure({
            element: this.bubbleMenuElement?.nativeElement,
            tippyOptions: {
              duration: 100,
              placement: 'top'
            }
          })
        ],
        editorProps: {
          attributes: {
            class: this.getEditorClasses()
          }
        },
        content: this.getInitialContent(),
        onUpdate: ({ editor }) => {
          this.hasUnsavedChanges = true
          this.saveStatus = 'unsaved'
          this.debouncedSave()
        },
        onFocus: () => {
          this.isEditorFocused = true
        },
        onBlur: () => {
          this.isEditorFocused = false
        }
      })

      console.log('Editor initialized successfully')
      
      // Set up keyboard shortcuts
      this.setupKeyboardShortcuts()
      
    } catch (error) {
      console.error('Error initializing editor:', error)
      if (retryCount < maxRetries) {
        console.log(`Retrying editor initialization... (${retryCount + 1}/${maxRetries})`)
        setTimeout(() => this.initializeEditor(retryCount + 1), retryDelay)
      } else {
        this.error = 'Failed to initialize editor'
      }
    }
  }

  private getInitialContent(): string {
    // If we have loaded note content, use it
    if (this.note?.content) {
      console.log('Using loaded note content for editor initialization')
      return this.note.content
    }
    
    // Otherwise, start with empty content
    return '<p></p>'
  }

  /**
   * Debounced save to avoid too frequent saves
   */
  private debouncedSave(): void {
    if (this.debouncedSaveTimer) {
      clearTimeout(this.debouncedSaveTimer)
    }
    
    this.debouncedSaveTimer = setTimeout(() => {
      this.performAutoSave()
    }, 2000) // 2 second delay
  }

  /**
   * Set up keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    // Add keyboard event listener for Ctrl/Cmd+S
    document.addEventListener('keydown', (event) => {
      if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        this.saveNow()
      }
    })
  }

  /**
   * Called when editor content changes
   */
  onEditorChange(): void {
    this.hasUnsavedChanges = true
    this.saveStatus = 'unsaved'
  }

  /**
   * Called when note title changes
   */
  onTitleChange(): void {
    this.hasUnsavedChanges = true
    this.saveStatus = 'unsaved'
  }

  /**
   * Start auto-save functionality
   */
  startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }
    
    if (this.autoSaveEnabled) {
      this.autoSaveTimer = setInterval(() => {
        this.performAutoSave()
      }, this.autoSaveInterval * 1000)
    }
  }

  /**
   * Stop auto-save functionality
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  /**
   * Perform auto-save if there are unsaved changes
   */
  async performAutoSave(): Promise<void> {
    if (!this.hasUnsavedChanges || this.isSaving) {
      return
    }

    try {
      await this.saveNote(false) // silent save
    } catch (error) {
      console.error('Auto-save failed:', error)
      this.saveStatus = 'error'
    }
  }

  /**
   * Manual save triggered by user
   */
  async saveNow(): Promise<void> {
    try {
      await this.saveNote(true) // show feedback
    } catch (error) {
      console.error('Manual save failed:', error)
      this.saveStatus = 'error'
    }
  }

  /**
   * Save note functionality
   */
  async saveNote(showFeedback: boolean = false): Promise<void> {
    if (this.isSaving || !this.editor) return

    console.log('Starting save process...', {
      noteId: this.noteId,
      hasNote: !!this.note,
      userId: this.userId,
      workplaceId: this.workplaceId,
      noteTitle: this.noteTitle,
      isLoading: this.isLoading
    })

    // Don't save if still loading user data
    if (this.isLoading) {
      console.log('Still loading user data, deferring save...')
      // Retry after a short delay
      setTimeout(() => this.saveNote(showFeedback), 1000)
      return
    }

    // If userId is still not available, try to get it from auth service directly
    if (!this.userId) {
      console.log('UserId not available, checking auth service...')
      const currentUser = this.authService.getCurrentUser()
      if (currentUser?.uuid) {
        console.log('Found userId in auth service:', currentUser.uuid)
        this.userId = currentUser.uuid
        this.workplaceId = currentUser.current_workplace_id || this.workplaceId
      } else {
        console.error('No user data available in auth service either')
        this.saveStatus = 'error'
        throw new Error('Unable to load user authentication data')
      }
    }

    this.isSaving = true
    this.saveStatus = 'saving'

    try {
      const htmlContent = this.editor.getHTML()
      
      // Check if content actually changed
      const contentChanged = htmlContent !== this.lastSavedContent
      const titleChanged = this.noteTitle !== (this.note?.title || '')
      
      console.log('Content check:', {
        contentChanged,
        titleChanged,
        currentContentLength: htmlContent.length,
        lastSavedContentLength: this.lastSavedContent?.length || 0
      })
      
      if (!contentChanged && !titleChanged) {
        console.log('No changes detected, skipping save')
        this.isSaving = false
        this.saveStatus = 'saved'
        return
      }

      const noteData = {
        title: this.noteTitle,
        content: htmlContent
      }

      console.log('Preparing to save with data:', noteData)

      // Check authentication requirements based on operation type
      if (this.noteId && this.note) {
        // For updating existing notes, we only need userId (backend doesn't require workplace)
        if (!this.userId) {
          const error = new Error('User authentication required for updating note')
          console.error('Authentication error for update:', {
            userId: this.userId,
            operation: 'update'
          })
          throw error
        }
      } else {
        // For creating new notes, we need both userId and workplaceId
        if (!this.userId || !this.workplaceId) {
          const error = new Error('User authentication and workplace required for creating note')
          console.error('Authentication error for create:', {
            userId: this.userId,
            workplaceId: this.workplaceId,
            operation: 'create'
          })
          throw error
        }
      }

      await new Promise<void>((resolve, reject) => {
        if (this.noteId && this.note) {
          // Update existing note
          console.log('Updating existing note:', this.noteId)
          this.fileService.updateNote(this.noteId, noteData).subscribe({
            next: (updatedNote) => {
              console.log('Note updated successfully:', updatedNote)
              this.note = updatedNote
              this.hasUnsavedChanges = false
              this.saveStatus = 'saved'
              this.lastSavedTime = new Date().toLocaleTimeString()
              this.lastSavedContent = htmlContent
              this.lastEdited = new Date().toISOString()
              this.isSaving = false
              if (showFeedback) {
                console.log('Note saved successfully')
              }
              resolve()
            },
            error: (err) => {
              console.error('Error updating note:', err)
              this.saveStatus = 'error'
              this.isSaving = false
              reject(err)
            }
          })
        } else {
          // Create new note
          console.log('Creating new note')
          const newNoteData = {
            name: this.noteTitle || `Note ${new Date().toLocaleString()}`,
            title: this.noteTitle,
            content: htmlContent
          }
          
          console.log('New note data:', newNoteData)
          
          this.fileService.createMySpaceNote(newNoteData).subscribe({
            next: (newNote) => {
              console.log('Note created successfully:', newNote)
              this.note = newNote
              this.noteId = newNote.id
              // Update URL to include the new note ID
              this.router.navigate(['/myspace/note-editor', newNote.id], { replaceUrl: true })
              this.hasUnsavedChanges = false
              this.saveStatus = 'saved'
              this.lastSavedTime = new Date().toLocaleTimeString()
              this.lastSavedContent = htmlContent
              this.lastEdited = new Date().toISOString()
              this.isSaving = false
              if (showFeedback) {
                console.log('Note created successfully')
              }
              resolve()
            },
            error: (err) => {
              console.error('Error creating note:', err)
              this.saveStatus = 'error'
              this.isSaving = false
              reject(err)
            }
          })
        }
      })
    } catch (error) {
      console.error('Save note error:', error)
      this.saveStatus = 'error'
      this.isSaving = false
      throw error
    }
  }

  /**
   * Toggle auto-save functionality
   */
  toggleAutoSave(): void {
    this.autoSaveEnabled = !this.autoSaveEnabled
    if (this.autoSaveEnabled) {
      this.startAutoSave()
    } else {
      this.stopAutoSave()
    }
  }

  /**
   * Update auto-save interval
   */
  onAutoSaveIntervalChange(): void {
    if (this.autoSaveEnabled) {
      this.startAutoSave()
    }
  }

  /**
   * Get CSS class for save status indicator
   */
  getSaveStatusClass(): string {
    switch (this.saveStatus) {
      case 'saved':
        return 'text-success'
      case 'saving':
        return 'text-info'
      case 'unsaved':
        return 'text-warning'
      case 'error':
        return 'text-error'
      default:
        return 'text-base-content/60'
    }
  }

  /**
   * Get text for save status
   */
  getSaveStatusText(): string {
    switch (this.saveStatus) {
      case 'saved':
        return this.lastSavedTime ? `Saved at ${this.lastSavedTime}` : 'Saved'
      case 'saving':
        return 'Saving...'
      case 'unsaved':
        return 'Unsaved changes'
      case 'error':
        return 'Error saving'
      default:
        return ''
    }
  }

  /**
   * Share note functionality
   */
  shareNote(): void {
    // Implement share functionality
  }

  /**
   * Navigate back to files
   */
  goBackToFiles(): void {
    this.router.navigate(['/myspace/files'])
  }

  // Tiptap specific methods
  toggleBold(): void {
    this.editor?.chain().focus().toggleBold().run()
  }

  toggleItalic(): void {
    this.editor?.chain().focus().toggleItalic().run()
  }

  toggleUnderline(): void {
    this.editor?.chain().focus().toggleUnderline().run()
  }

  toggleStrike(): void {
    this.editor?.chain().focus().toggleStrike().run()
  }

  toggleCode(): void {
    this.editor?.chain().focus().toggleCode().run()
  }

  toggleHighlight(): void {
    this.editor?.chain().focus().toggleHighlight().run()
  }

  setHeading(level: number): void {
    if (level === 0) {
      this.editor?.chain().focus().setParagraph().run()
    } else {
      this.editor?.chain().focus().setHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()
    }
  }

  setParagraph(): void {
    this.editor?.chain().focus().setParagraph().run()
  }

  toggleBulletList(): void {
    console.log('toggleBulletList called')
    if (this.editor) {
      console.log('Editor exists, toggling bullet list')
      console.log('Can toggle bullet list:', this.editor.can().toggleBulletList())
      console.log('Current content:', this.editor.getHTML())
      this.editor.chain().focus().toggleBulletList().run()
      console.log('After toggle:', this.editor.getHTML())
    } else {
      console.log('Editor not available')
    }
  }

  toggleOrderedList(): void {
    this.editor?.chain().focus().toggleOrderedList().run()
  }

  toggleTaskList(): void {
    this.editor?.chain().focus().toggleTaskList().run()
  }

  toggleBlockquote(): void {
    this.editor?.chain().focus().toggleBlockquote().run()
  }

  toggleCodeBlock(): void {
    this.editor?.chain().focus().toggleCodeBlock().run()
  }

  insertHorizontalRule(): void {
    this.editor?.chain().focus().setHorizontalRule().run()
  }

  undo(): void {
    this.editor?.chain().focus().undo().run()
  }

  redo(): void {
    this.editor?.chain().focus().redo().run()
  }

  setTextAlign(alignment: string): void {
    this.editor?.chain().focus().setTextAlign(alignment).run()
  }

  getCurrentHeadingText(): string {
    if (!this.editor) return 'Paragraph'
    
    if (this.editor.isActive('heading', { level: 1 })) return 'Heading 1'
    if (this.editor.isActive('heading', { level: 2 })) return 'Heading 2'
    if (this.editor.isActive('heading', { level: 3 })) return 'Heading 3'
    if (this.editor.isActive('heading', { level: 4 })) return 'Heading 4'
    if (this.editor.isActive('heading', { level: 5 })) return 'Heading 5'
    if (this.editor.isActive('heading', { level: 6 })) return 'Heading 6'
    
    return 'Paragraph'
  }

  // Updated isActive method to handle both string and object parameters
  isActive(nameOrAttributes: string | Record<string, any>, attributes?: any): boolean {
    if (!this.editor) return false
    
    if (typeof nameOrAttributes === 'string') {
      // Handle string with optional attributes (old signature)
      if (attributes) {
        return this.editor.isActive(nameOrAttributes, attributes)
      }
      // Handle string only
      return this.editor.isActive(nameOrAttributes)
    } else {
      // Handle object attributes (like textAlign)
      const keys = Object.keys(nameOrAttributes)
      if (keys.length === 1) {
        const key = keys[0]
        const value = nameOrAttributes[key]
        return this.editor.isActive({ [key]: value })
      }
      return false
    }
  }

  canUndo(): boolean {
    return this.editor?.can().undo() ?? false
  }

  canRedo(): boolean {
    return this.editor?.can().redo() ?? false
  }

  getCharacterCount(): number {
    return this.editor?.storage['characterCount']?.characters() ?? 0
  }

  getWordCount(): number {
    return this.editor?.storage['characterCount']?.words() ?? 0
  }

  insertTable(): void {
    this.editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  setLink(): void {
    const url = window.prompt('Enter URL:')
    if (url) {
      this.editor?.chain().focus().setLink({ href: url }).run()
    }
  }

  insertImage(): void {
    const url = window.prompt('Enter image URL:')
    if (url) {
      this.editor?.chain().focus().setImage({ src: url }).run()
    }
  }

  onHeadingChange(event: Event): void {
    const target = event.target as HTMLSelectElement
    const level = parseInt(target.value, 10)
    this.setHeading(level)
  }

  private getEditorClasses(): string {
    const baseClasses = [
      'prose',
      'prose-lg',
      'max-w-none',
      'focus:outline-none',
      'min-h-screen',
      'p-6',
      'text-base-content',
      'bg-base-100',
      // Typography
      'leading-relaxed',
      // Headings
      '[&_h1]:text-4xl',
      '[&_h1]:font-bold',
      '[&_h1]:text-base-content',
      '[&_h1]:mb-4',
      '[&_h1]:mt-6',
      '[&_h1]:first:mt-0',
      '[&_h2]:text-3xl',
      '[&_h2]:font-bold',
      '[&_h2]:text-base-content',
      '[&_h2]:mb-3',
      '[&_h2]:mt-6',
      '[&_h2]:first:mt-0',
      '[&_h3]:text-2xl',
      '[&_h3]:font-semibold',
      '[&_h3]:text-base-content',
      '[&_h3]:mb-3',
      '[&_h3]:mt-5',
      '[&_h4]:text-xl',
      '[&_h4]:font-semibold',
      '[&_h4]:text-base-content',
      '[&_h4]:mb-2',
      '[&_h4]:mt-4',
      '[&_h5]:text-lg',
      '[&_h5]:font-medium',
      '[&_h5]:text-base-content',
      '[&_h5]:mb-2',
      '[&_h5]:mt-4',
      '[&_h6]:text-base',
      '[&_h6]:font-medium',
      '[&_h6]:text-base-content',
      '[&_h6]:mb-2',
      '[&_h6]:mt-3',
      // Paragraphs
      '[&_p]:text-base-content',
      '[&_p]:mb-3',
      '[&_p]:leading-relaxed',
      // Lists
      '[&_ul]:text-base-content',
      '[&_ul]:mb-4',
      '[&_ol]:text-base-content',
      '[&_ol]:mb-4',
      '[&_li]:mb-1',
      // Task lists
      '[&_ul[data-type="taskList"]]:list-none',
      '[&_ul[data-type="taskList"]]:pl-0',
      '[&_ul[data-type="taskList"]_li]:flex',
      '[&_ul[data-type="taskList"]_li]:items-start',
      '[&_ul[data-type="taskList"]_li]:gap-2',
      '[&_ul[data-type="taskList"]_li]:mb-2',
      '[&_ul[data-type="taskList"]_input]:mt-1',
      '[&_ul[data-type="taskList"]_input]:cursor-pointer',
      // Blockquotes
      '[&_blockquote]:border-l-4',
      '[&_blockquote]:border-primary',
      '[&_blockquote]:pl-4',
      '[&_blockquote]:italic',
      '[&_blockquote]:text-base-content/80',
      '[&_blockquote]:my-4',
      // Code
      '[&_pre]:bg-base-200',
      '[&_pre]:border',
      '[&_pre]:border-base-300',
      '[&_pre]:rounded-lg',
      '[&_pre]:p-4',
      '[&_pre]:mb-4',
      '[&_pre]:overflow-x-auto',
      '[&_pre_code]:bg-transparent',
      '[&_pre_code]:p-0',
      '[&_pre_code]:text-sm',
      '[&_pre_code]:font-mono',
      '[&_code]:bg-base-200',
      '[&_code]:text-base-content',
      '[&_code]:px-2',
      '[&_code]:py-1',
      '[&_code]:rounded',
      '[&_code]:text-sm',
      '[&_code]:font-mono',
      // Links
      '[&_a]:text-primary',
      '[&_a]:underline',
      '[&_a]:cursor-pointer',
      '[&_a:hover]:text-primary-focus',
      // Tables
      '[&_table]:border-collapse',
      '[&_table]:border',
      '[&_table]:border-base-300',
      '[&_table]:w-full',
      '[&_table]:my-4',
      '[&_th]:border',
      '[&_th]:border-base-300',
      '[&_th]:bg-base-200',
      '[&_th]:p-2',
      '[&_th]:text-left',
      '[&_th]:font-semibold',
      '[&_td]:border',
      '[&_td]:border-base-300',
      '[&_td]:p-2',
      // Images
      '[&_img]:max-w-full',
      '[&_img]:h-auto',
      '[&_img]:rounded-lg',
      '[&_img]:my-4',
      // HR
      '[&_hr]:border-none',
      '[&_hr]:border-t',
      '[&_hr]:border-base-300',
      '[&_hr]:my-6',
      // Selection
      '[&_::selection]:bg-primary/20',
    ]

    // Add theme-specific classes
    if (this.currentTheme === 'night') {
      baseClasses.push(
        'dark:bg-base-100',
        'dark:text-base-content',
        // Dark mode specific overrides can be added here
      )
    }

    return baseClasses.join(' ')
  }
} 