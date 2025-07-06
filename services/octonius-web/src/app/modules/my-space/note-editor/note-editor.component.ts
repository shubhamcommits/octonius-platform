import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router, ActivatedRoute } from '@angular/router'
import { FormsModule } from '@angular/forms'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
// @ts-ignore
import Quote from '@editorjs/quote'
// @ts-ignore
import Code from '@editorjs/code'
// @ts-ignore
import Table from '@editorjs/table'
// @ts-ignore
import LinkTool from '@editorjs/link'
// @ts-ignore
import ImageTool from '@editorjs/image'
// @ts-ignore
import Delimiter from '@editorjs/delimiter'
// @ts-ignore
import RawTool from '@editorjs/raw'
// @ts-ignore
import Warning from '@editorjs/warning'
// @ts-ignore
import Checklist from '@editorjs/checklist'
// @ts-ignore
import Embed from '@editorjs/embed'
// @ts-ignore
import Marker from '@editorjs/marker'
// @ts-ignore
import InlineCode from '@editorjs/inline-code'
// @ts-ignore
import Underline from '@editorjs/underline'
// @ts-ignore
import SimpleImage from '@editorjs/simple-image'
// @ts-ignore
import AttachesTool from '@editorjs/attaches'
// @ts-ignore
// import Footnotes from '@editorjs/footnotes' // Disabled due to compatibility issues
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

  // Auto-save related properties
  autoSaveEnabled = true
  autoSaveInterval = 30 // seconds
  isSaving = false
  hasUnsavedChanges = false
  lastSavedTime: string | null = null
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error' = 'saved'
  private autoSaveTimer: any = null
  private lastSavedContent: any = null
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private fileService: FileService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.isLoading = true
    
    // Extract note ID from route parameters
    this.noteId = this.route.snapshot.paramMap.get('id')
    
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
              this.lastSavedContent = note.content
              this.isLoading = false
              this.startAutoSave()
            },
            error: (err: Error) => {
              this.error = 'Failed to load note'
              this.isLoading = false
              console.error('Error loading note:', err)
              this.initializeEditor()
              this.startAutoSave()
            }
          })
        } else {
          this.initializeEditor()
          this.isLoading = false
          this.startAutoSave()
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
    this.stopAutoSave()
    if (this.editor) {
      this.editor.destroy()
    }
  }
  
  initializeEditor(content: any = { blocks: [] }): void {
    this.editor = new EditorJS({
      holder: 'editorjs',
      placeholder: '',  // Custom placeholder handled by CSS
      tools: {
        // === BLOCK TOOLS ===
        header: {
          class: Header as any,
          config: {
            placeholder: 'Heading',
            levels: [1, 2, 3, 4, 5, 6],
            defaultLevel: 2
          },
          shortcut: 'CMD+SHIFT+H'
        },
        
        paragraph: {
          config: {
            placeholder: 'Tell your story...',
            preserveBlank: true
          }
        },
        
        list: {
          class: List as any,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered'
          },
          shortcut: 'CMD+SHIFT+L'
        },
        
        checklist: {
          class: Checklist as any,
          inlineToolbar: true,
          shortcut: 'CMD+SHIFT+C'
        },
        
        quote: {
          class: Quote as any,
          inlineToolbar: true,
          config: {
            quotePlaceholder: 'Enter a quote',
            captionPlaceholder: 'Quote\'s author'
          },
          shortcut: 'CMD+SHIFT+O'
        },
        
        warning: {
          class: Warning as any,
          inlineToolbar: true,
          config: {
            titlePlaceholder: 'Title',
            messagePlaceholder: 'Message'
          }
        },
        
        code: {
          class: Code as any,
          config: {
            placeholder: 'Enter code here...'
          },
          shortcut: 'CMD+SHIFT+K'
        },
        
        raw: {
          class: RawTool as any,
          config: {
            placeholder: 'Enter raw HTML'
          }
        },
        
        table: {
          class: Table as any,
          inlineToolbar: true,
          config: {
            rows: 2,
            cols: 3,
            withHeadings: true
          }
        },
        
        delimiter: {
          class: Delimiter as any,
          shortcut: 'CMD+SHIFT+D'
        },
        
        // === INLINE TOOLS ===
        marker: {
          class: Marker as any,
          shortcut: 'CMD+SHIFT+M'
        },
        
        inlineCode: {
          class: InlineCode as any,
          shortcut: 'CMD+SHIFT+E'
        },
        
        underline: {
          class: Underline as any,
          shortcut: 'CMD+U'
        },
        
        // === TOOLS WITH EXTERNAL DEPENDENCIES ===
        linkTool: {
          class: LinkTool as any,
          config: {
            endpoint: '/api/v1/link-preview', // You'll need to implement this endpoint
          }
        },
        
        image: {
          class: ImageTool as any,
          config: {
            endpoints: {
              byFile: '/api/v1/upload-image', // You'll need to implement this
              byUrl: '/api/v1/fetch-image',   // You'll need to implement this
            },
            additionalRequestHeaders: {
              authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        },
        
        simpleImage: {
          class: SimpleImage as any,
          config: {
            placeholder: 'Paste image URL'
          }
        },
        
        embed: {
          class: Embed as any,
          config: {
            services: {
              youtube: true,
              vimeo: true,
              twitter: true,
              instagram: true,
              codepen: true,
              github: true
            }
          },
          inlineToolbar: true
        },
        
        attaches: {
          class: AttachesTool as any,
          config: {
            endpoint: '/api/v1/upload-file', // You'll need to implement this
            additionalRequestHeaders: {
              authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        },
        
        // footnotes: {
        //   class: Footnotes as any,
        //   inlineToolbar: true
        // } // Disabled due to compatibility issues
      },
      
      // === EDITOR CONFIGURATION ===
      data: content,
      onChange: () => {
        this.onEditorChange()
      },
      onReady: () => {
        console.log('Editor.js is ready to work!')
      },
      
      // === ADVANCED SETTINGS ===
      minHeight: window.innerHeight - 200,
      defaultBlock: 'paragraph',
      autofocus: true,
      hideToolbar: false,
      
      // === INTERNATIONALIZATION ===
      i18n: {
        messages: {
          ui: {
            'blockTunes': {
              'toggler': {
                'Click to tune': 'Click to tune',
              }
            },
            'inlineToolbar': {
              'converter': {
                'Convert to': 'Convert to'
              }
            },
            'toolbar': {
              'toolbox': {
                'Add': 'Add'
              }
            }
          },
          toolNames: {
            'Text': 'Paragraph',
            'Heading': 'Heading',
            'List': 'List',
            'Warning': 'Warning',
            'Checklist': 'Checklist',
            'Quote': 'Quote',
            'Code': 'Code',
            'Delimiter': 'Delimiter',
            'Raw HTML': 'Raw HTML',
            'Table': 'Table',
            'Link': 'Link',
            'Marker': 'Marker',
            'Bold': 'Bold',
            'Italic': 'Italic',
            'InlineCode': 'Inline Code',
            'Image': 'Image'
          },
          blockTunes: {
            'delete': {
              'Delete': 'Delete'
            },
            'moveUp': {
              'Move up': 'Move up'
            },
            'moveDown': {
              'Move down': 'Move down'
            }
          }
        }
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
    if (this.isSaving) return

    this.isSaving = true
    this.saveStatus = 'saving'

    try {
      const outputData = await this.editor.save()
      
      // Check if content actually changed
      const contentChanged = JSON.stringify(outputData) !== JSON.stringify(this.lastSavedContent)
      const titleChanged = this.noteTitle !== (this.note?.title || '')
      
      if (!contentChanged && !titleChanged) {
        this.isSaving = false
        this.saveStatus = 'saved'
        return
      }

      const noteData = {
        id: this.noteId || '',
        title: this.noteTitle,
        content: outputData
      }

      if (this.user && this.workplaceId) {
        await new Promise<void>((resolve, reject) => {
          this.fileService.saveNote(noteData).subscribe({
            next: () => {
              this.hasUnsavedChanges = false
              this.saveStatus = 'saved'
              this.lastSavedTime = new Date().toLocaleTimeString()
              this.lastSavedContent = outputData
              this.lastEdited = new Date().toISOString()
              this.isSaving = false
              resolve()
            },
            error: (err) => {
              this.saveStatus = 'error'
              this.isSaving = false
              reject(err)
            }
          })
        })
      }
    } catch (error) {
      this.saveStatus = 'error'
      this.isSaving = false
      throw error
    }
  }

  /**
   * Toggle auto-save on/off
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
   * Handle auto-save interval change
   */
  onAutoSaveIntervalChange(): void {
    this.startAutoSave() // Restart with new interval
  }

  /**
   * Get CSS class for save status indicator
   */
  getSaveStatusClass(): string {
    switch (this.saveStatus) {
      case 'saved':
        return 'bg-success animate-pulse-success'
      case 'saving':
        return 'bg-warning animate-pulse'
      case 'unsaved':
        return 'bg-info'
      case 'error':
        return 'bg-error animate-shake'
      default:
        return 'bg-base-300'
    }
  }

  /**
   * Get text for save status indicator
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
        return 'Save failed'
      default:
        return 'Unknown'
    }
  }
  
  shareNote(): void {
    // Implement share functionality
  }
  
  goBackToFiles(): void {
    // Auto-save before leaving if there are unsaved changes
    if (this.hasUnsavedChanges && !this.isSaving) {
      this.saveNote(false).finally(() => {
        this.router.navigate(['/myspace/files'])
      })
    } else {
      this.router.navigate(['/myspace/files'])
    }
  }
} 