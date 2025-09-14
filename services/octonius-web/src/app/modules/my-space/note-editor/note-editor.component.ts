import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router, ActivatedRoute } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'

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
import Mention from '@tiptap/extension-mention'
import { Node as TiptapNode } from '@tiptap/core'
import { Subscription } from 'rxjs'

import { UserService } from '../../../core/services/user.service'
import { FileService } from '../../../core/services/file.service'
import { User } from '../../../core/services/auth.service'
import { File } from '../../../core/models/file.model'
import { AuthService } from '../../../core/services/auth.service'
import { ThemeService } from '../../../core/services/theme.service'
import { environment } from '../../../../environments/environment'
import { SharedModule } from '../../shared/shared.module'
import { UserMentionService, UserMentionSuggestion } from '../../../core/services/user-mention.service'
import { FileMentionService, FileMentionSuggestion } from '../../../core/services/file-mention.service'

// Custom mention node definitions
const UserMentionNode = TiptapNode.create({
  name: 'userMention',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes['id']) {
            return {}
          }
          return {
            'data-id': attributes['id'],
          }
        },
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes['label']) {
            return {}
          }
          return {
            'data-label': attributes['label'],
          }
        },
      },
      avatar: {
        default: null,
        parseHTML: element => element.getAttribute('data-avatar'),
        renderHTML: attributes => {
          if (!attributes['avatar']) {
            return {}
          }
          return {
            'data-avatar': attributes['avatar'],
          }
        },
      },
      email: {
        default: null,
        parseHTML: element => element.getAttribute('data-email'),
        renderHTML: attributes => {
          if (!attributes['email']) {
            return {}
          }
          return {
            'data-email': attributes['email'],
          }
        },
      },
      type: {
        default: 'user',
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => {
          return {
            'data-type': attributes['type'],
          }
        },
      },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'span[data-type="user"]',
      },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        class: 'userMention mention-user bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-medium',
      },
      `@${HTMLAttributes['data-label'] || 'User'}`,
    ]
  },
})

const FileMentionNode = TiptapNode.create({
  name: 'fileMention',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes['id']) {
            return {}
          }
          return {
            'data-id': attributes['id'],
          }
        },
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes['label']) {
            return {}
          }
          return {
            'data-label': attributes['label'],
          }
        },
      },
      icon: {
        default: null,
        parseHTML: element => element.getAttribute('data-icon'),
        renderHTML: attributes => {
          if (!attributes['icon']) {
            return {}
          }
          return {
            'data-icon': attributes['icon'],
          }
        },
      },
      type: {
        default: 'file',
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => {
          return {
            'data-type': attributes['type'],
          }
        },
      },
      size: {
        default: null,
        parseHTML: element => element.getAttribute('data-size'),
        renderHTML: attributes => {
          if (!attributes['size']) {
            return {}
          }
          return {
            'data-size': attributes['size'],
          }
        },
      },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'span[data-type="file"]',
      },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        class: 'fileMention mention-file bg-secondary/10 text-secondary px-2 py-1 rounded-full text-sm font-medium',
      },
      `#${HTMLAttributes['data-label'] || 'File'}`,
    ]
  },
})

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
  
  // Help modal state
  showHelpModal = false
  
  // Emoji and GIF state
  showEmojiPicker = false
  showGifPicker = false
  emojiSearchTerm = ''
  gifSearchTerm = ''
  gifSearchResults: any[] = []
  isLoadingGifs = false
  
  // Image upload state
  imageUploadProgress: number | null = null
  isUploadingImage = false
  imageUploadError: string | null = null
  showImageOptions = false
  
  // Track uploaded images for deletion
  uploadedImages: Map<string, string> = new Map() // URL -> File ID mapping
  private processedDeletions: Set<string> = new Set() // Track processed deletions to avoid duplicates
  private deletionCheckTimer: any = null // Debounce timer for deletion checks

  // Mention-related properties
  userMentionSuggestions: UserMentionSuggestion[] = []
  fileMentionSuggestions: FileMentionSuggestion[] = []
  showUserMentions = false
  showFileMentions = false
  currentMentionQuery = ''
  
  // Common emojis for quick access
  commonEmojis = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
    '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒',
    '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩',
    '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👏', '🙌',
    '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '✨', '💫', '⭐', '🌟', '💥', '💢', '💯', '🔥', '⚡', '🌈'
  ]
  
  // Emoji categories
  emojiCategories = [
    { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋'] },
    { name: 'Gestures', emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶'] },
    { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️'] },
    { name: 'Symbols', emojis: ['✨', '💫', '⭐', '🌟', '💥', '💢', '💯', '🔥', '⚡', '🌈', '☀️', '🌤️', '⛅', '☁️', '🌧️', '⛈️', '❄️', '☃️', '⛄', '🌬️'] },
    { name: 'Animals', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄', '🐔', '🐧', '🐦', '🐤'] },
    { name: 'Food', emojis: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥝', '🍅', '🥑', '🌶️', '🌽', '🥕', '🥦', '🍔', '🍕', '🌭', '🍿'] },
    { name: 'Objects', emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🏆', '🎨', '🎭', '🎪', '🎤', '🎧', '🎼', '🎵', '🎶', '🎸', '🎹', '🎺', '🎻'] }
  ]
  
  // Recently used emojis (stored in localStorage)
  recentEmojis: string[] = []
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private fileService: FileService,
    private authService: AuthService,
    private themeService: ThemeService,
    private sanitizer: DomSanitizer,
    private userMentionService: UserMentionService,
    private fileMentionService: FileMentionService
  ) {}
  
  ngOnInit(): void {
    // Load recently used emojis from localStorage
    const savedRecentEmojis = localStorage.getItem('recentEmojis')
    if (savedRecentEmojis) {
      this.recentEmojis = JSON.parse(savedRecentEmojis)
    }
    
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
        
        // Set context for mention services
        // For "my space", use a special context that only shows the current user
        this.userMentionService.setContext('myspace', undefined)
        this.fileMentionService.setContext('myspace', undefined, this.userId)
        
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
    // Clean up orphaned images before destroying
    this.cleanupOrphanedImages()
    
    // Clean up auto-save timer
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }
    
    // Clean up debounced save timer
    if (this.debouncedSaveTimer) {
      clearTimeout(this.debouncedSaveTimer)
    }
    
    // Clean up theme subscription
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe()
    }
    
    // Clean up editor
    if (this.editor) {
      this.editor.destroy()
    }
    
    // Clear image tracking
    this.uploadedImages.clear()
  }

  // Debug method
  debugListExtensions(): void {
    if (this.editor) {
      console.log('=== List Extension Debug ===')
      console.log('Available extensions:', this.editor.extensionManager.extensions.map(ext => ext.name))
      console.log('BulletList extension:', this.editor.extensionManager.extensions.find(ext => ext.name === 'bulletList'))
      console.log('OrderedList extension:', this.editor.extensionManager.extensions.find(ext => ext.name === 'orderedList'))
      console.log('ListItem extension:', this.editor.extensionManager.extensions.find(ext => ext.name === 'listItem'))
      console.log('Can toggle bullet list:', this.editor.can().toggleBulletList())
      console.log('Can toggle ordered list:', this.editor.can().toggleOrderedList())
      console.log('Current schema nodes:', Object.keys(this.editor.schema.nodes))
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
        enableInputRules: true,
        extensions: [
          // Add custom mention nodes first
          UserMentionNode,
          FileMentionNode,
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
              },
              keepMarks: true,
              keepAttributes: false
            },
            orderedList: {
              HTMLAttributes: {
                class: 'prose-ol'
              },
              keepMarks: true,
              keepAttributes: false
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
          Underline,
          TextAlign.extend({
            addKeyboardShortcuts() {
              return {} // Disable all default keyboard shortcuts
            }
          }).configure({
            types: ['heading', 'paragraph']
          }),
          TextStyle,
          CharacterCount,
          BubbleMenu.configure({
            element: this.bubbleMenuElement?.nativeElement,
            tippyOptions: {
              duration: 100,
              placement: 'top'
            }
          }),
          // User mentions (@)
          Mention.configure({
            HTMLAttributes: {
              class: 'userMention mention-user bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-medium',
            },
            suggestion: {
              char: '@',
              allowSpaces: false,
              startOfLine: false,
          command: ({ editor, range, props }: any) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertContent([
                {
                  type: 'userMention',
                  attrs: {
                    id: props.id,
                    label: props.label,
                    avatar: props.avatar,
                    email: props.email,
                    type: 'user'
                  }
                },
                {
                  type: 'text',
                  text: ' '
                }
              ])
              .run()
          },
              items: ({ query }: any) => {
                console.log('User mention query:', query);
                this.currentMentionQuery = query
                this.showUserMentions = true
                this.showFileMentions = false
                
                return new Promise((resolve) => {
                  this.userMentionService.getUserSuggestions(query).subscribe({
                    next: (suggestions: any) => {
                      console.log('User suggestions received:', suggestions);
                      this.userMentionSuggestions = suggestions
                      resolve(suggestions)
                    },
                    error: (error) => {
                      console.error('Error fetching user suggestions:', error);
                      this.userMentionSuggestions = []
                      resolve([])
                    }
                  })
                })
              },
              render: () => {
                let component: HTMLElement
                let popup: any

                return {
                  onStart: (props: any) => {
                    component = this.createMentionComponent('user', props)
                    popup = this.createMentionPopup(component)
                  },
                  onUpdate: (props: any) => {
                    if (!component || !popup) return
                    
                    // Update component with new props
                    component.innerHTML = ''
                    const newComponent = this.createMentionComponent('user', props)
                    component.appendChild(newComponent)
                  },
                  onKeyDown: (props: any) => {
                    if (props.event.key === 'Escape') {
                      popup.hide()
                      return true
                    }
                    return false
                  },
                  onExit: () => {
                    if (popup) {
                      popup.destroy()
                    }
                    this.hideAllMentionPopups()
                  },
                }
              },
            },
          }),
          // File mentions (#)
          Mention.configure({
            HTMLAttributes: {
              class: 'fileMention mention-file bg-secondary/10 text-secondary px-2 py-1 rounded-full text-sm font-medium',
            },
            suggestion: {
              char: '#',
              allowSpaces: false,
              startOfLine: false,
              command: ({ editor, range, props }: any) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .insertContent([
                    {
                      type: 'fileMention',
                      attrs: {
                        id: props.id,
                        label: props.label,
                        icon: props.icon,
                        type: 'file',
                        size: props.size
                      }
                    },
                    {
                      type: 'text',
                      text: ' '
                    }
                  ])
                  .run()
              },
              items: ({ query }: any) => {
                console.log('File mention query:', query);
                this.currentMentionQuery = query
                this.showUserMentions = false
                this.showFileMentions = true
                
                return new Promise((resolve) => {
                  this.fileMentionService.getFileSuggestions(query).subscribe({
                    next: (suggestions: any) => {
                      console.log('File suggestions received:', suggestions);
                      this.fileMentionSuggestions = suggestions
                      resolve(suggestions)
                    },
                    error: (error) => {
                      console.error('Error fetching file suggestions:', error);
                      this.fileMentionSuggestions = []
                      resolve([])
                    }
                  })
                })
              },
              render: () => {
                let component: HTMLElement
                let popup: any

                return {
                  onStart: (props: any) => {
                    component = this.createMentionComponent('file', props)
                    popup = this.createMentionPopup(component)
                  },
                  onUpdate: (props: any) => {
                    if (!component || !popup) return
                    
                    // Update component with new props
                    component.innerHTML = ''
                    const newComponent = this.createMentionComponent('file', props)
                    component.appendChild(newComponent)
                  },
                  onKeyDown: (props: any) => {
                    if (props.event.key === 'Escape') {
                      popup.hide()
                      return true
                    }
                    return false
                  },
                  onExit: () => {
                    if (popup) {
                      popup.destroy()
                    }
                    this.hideAllMentionPopups()
                  },
                }
              },
            },
          })
        ],
        editorProps: {
          attributes: {
            class: this.getEditorClasses()
          },
          handleDrop: (view, event, slice, moved) => {
            if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
              const file = event.dataTransfer.files[0]
              const fileSize = file.size / 1024 / 1024 // Size in MB
              
              if (fileSize > 10) {
                alert('Please select an image smaller than 10MB')
                return true
              }
              
              if (file.type.indexOf('image/') === 0) {
                event.preventDefault()
                
                // Upload to S3 instead of using data URL
                this.fileService.uploadFileViaS3(file, undefined, 'note').subscribe({
                  next: (uploadedFile: any) => {
                    const url = uploadedFile.cdn_url || uploadedFile.download_url || uploadedFile.url
                    const node = view.state.schema.nodes['image'].create({
                      src: url
                    })
                    const transaction = view.state.tr.replaceSelectionWith(node)
                    view.dispatch(transaction)
                    
                    // Track uploaded image for deletion
                    this.trackUploadedImage(url, uploadedFile.id)
                  },
                  error: (err: any) => {
                    console.error('Error uploading dropped image:', err)
                    alert('Failed to upload image. Please try again.')
                  }
                })
                return true
              }
            }
            return false
          },
          handlePaste: (view, event) => {
            if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
              const file = event.clipboardData.files[0]
              const fileSize = file.size / 1024 / 1024 // Size in MB
              
              if (fileSize > 10) {
                alert('Please select an image smaller than 10MB')
                return true
              }
              
              if (file.type.indexOf('image/') === 0) {
                event.preventDefault()
                
                // Upload to S3 instead of using data URL
                this.fileService.uploadFileViaS3(file, undefined, 'note').subscribe({
                  next: (uploadedFile: any) => {
                    const url = uploadedFile.cdn_url || uploadedFile.download_url || uploadedFile.url
                    const node = view.state.schema.nodes['image'].create({
                      src: url
                    })
                    const transaction = view.state.tr.replaceSelectionWith(node)
                    view.dispatch(transaction)
                    
                    // Track uploaded image for deletion
                    this.trackUploadedImage(url, uploadedFile.id)
                  },
                  error: (err: any) => {
                    console.error('Error uploading pasted image:', err)
                    alert('Failed to upload image. Please try again.')
                  }
                })
                return true
              }
            }
            return false
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
      
      // Debug list extensions
      setTimeout(() => {
        this.debugListExtensions()
      }, 100)
      
      // Set up keyboard shortcuts
      this.setupKeyboardShortcuts()
      
      // Set up image deletion handler
      this.handleImageDeletion()
      
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
      
      // Track existing images in the content
      this.trackExistingImages(this.note.content)
      
      return this.note.content
    }
    
    // Otherwise, start with empty content
    return '<p></p>'
  }

  /**
   * Track existing images from loaded note content
   */
  private trackExistingImages(content: string): void {
    const imageUrls = this.extractImageUrls(content)
    
    // For existing images, we need to extract file IDs from URLs
    // Since we don't have the file IDs stored, we'll try to extract them from URLs
    imageUrls.forEach(url => {
      const fileId = this.extractFileIdFromUrl(url)
      if (fileId) {
        this.uploadedImages.set(url, fileId)
      }
    })
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
    // Add keyboard event listener for various shortcuts
    document.addEventListener('keydown', (event) => {
      // Save: Ctrl/Cmd+S
      if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        this.saveNow()
      }
      
      // Insert link: Ctrl/Cmd+K
      if (event.key === 'k' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        this.setLink()
      }
      
      // Insert table: Ctrl/Cmd+Shift+T
      if (event.key === 'T' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
        event.preventDefault()
        this.insertTable()
      }
      
      // Help modal: F1 or Ctrl/Cmd+?
      if (event.key === 'F1' || (event.key === '?' && (event.ctrlKey || event.metaKey))) {
        event.preventDefault()
        this.showHelpModal = true
      }
      
      // Close modal: Escape
      if (event.key === 'Escape') {
        if (this.showHelpModal) {
          event.preventDefault()
          this.showHelpModal = false
        }
        if (this.showEmojiPicker) {
          event.preventDefault()
          this.showEmojiPicker = false
        }
        if (this.showGifPicker) {
          event.preventDefault()
          this.showGifPicker = false
        }
      }
      
      // Emoji picker: Ctrl/Cmd+E
      if (event.key === 'e' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
        event.preventDefault()
        this.showEmojiPicker = !this.showEmojiPicker
        this.showGifPicker = false
      }
      
      // GIF picker: Ctrl/Cmd+G
      if (event.key === 'g' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
        event.preventDefault()
        this.showGifPicker = !this.showGifPicker
        this.showEmojiPicker = false
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
   * Clean up orphaned images that are no longer in the note content
   */
  private cleanupOrphanedImages(): void {
    if (!this.editor) return
    
    const currentImages = this.extractImageUrls(this.editor.getHTML())
    const trackedImages = Array.from(this.uploadedImages.keys())
    
    // Find orphaned images (tracked but not in current content)
    const orphanedImages = trackedImages.filter(url => !currentImages.includes(url))
    
    // Delete orphaned images from storage
    orphanedImages.forEach(url => {
      this.deleteImageFromStorage(url)
    })
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
              this.noteTitle = updatedNote.title || this.noteTitle // Update the title from the server response
              this.hasUnsavedChanges = false
              this.saveStatus = 'saved'
              this.lastSavedTime = new Date().toLocaleTimeString()
              this.lastSavedContent = htmlContent
              this.lastEdited = new Date().toISOString()
              this.isSaving = false
              
              // Clean up orphaned images after successful save
              this.cleanupOrphanedImages()
              
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
              this.noteTitle = newNote.title || this.noteTitle // Update title from server response
              // Update URL to include the new note ID
              this.router.navigate(['/myspace/note-editor', newNote.id], { replaceUrl: true })
              this.hasUnsavedChanges = false
              this.saveStatus = 'saved'
              this.lastSavedTime = new Date().toLocaleTimeString()
              this.lastSavedContent = htmlContent
              this.lastEdited = new Date().toISOString()
              this.isSaving = false
              
              // Clean up orphaned images after successful save
              this.cleanupOrphanedImages()
              
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
    // Clean up orphaned images before navigating away
    this.cleanupOrphanedImages()
    
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
    if (this.editor) {
      // Ensure we have a valid selection
      const { from, to, $from } = this.editor.state.selection
      
      // Try alternative approach if regular toggle doesn't work
      if (this.editor.isActive('bulletList')) {
        // If already in a bullet list, lift it
        const result = this.editor.chain().focus().liftListItem('listItem').run()
      } else {
        // First try regular toggle
        const result = this.editor.chain().focus().toggleBulletList().run()
        
        // If toggle didn't work, try wrapInList
        if (!result) {
          this.editor.chain().focus().wrapInList('bulletList').run()
        }
      }
    }
  }

  toggleOrderedList(): void {
    if (this.editor) {
      
      if (this.editor.isActive('orderedList')) {
        // If already in an ordered list, lift it
        this.editor.chain().focus().liftListItem('listItem').run()
      } else {
        // First try regular toggle
        const result = this.editor.chain().focus().toggleOrderedList().run()
        
        // If toggle didn't work, try wrapInList
        if (!result) {
          this.editor.chain().focus().wrapInList('orderedList').run()
        }
      }
    }
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

  clearFormatting(): void {
    this.editor?.chain().focus().clearNodes().unsetAllMarks().run()
  }

  // Check if current selection has a link
  hasLink(): boolean {
    return this.editor?.isActive('link') ?? false
  }

  // Remove link from selection
  removeLink(): void {
    this.editor?.chain().focus().unsetLink().run()
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

  addTableRow(): void {
    this.editor?.chain().focus().addRowAfter().run()
  }

  addTableRowBefore(): void {
    this.editor?.chain().focus().addRowBefore().run()
  }

  addTableColumn(): void {
    this.editor?.chain().focus().addColumnAfter().run()
  }

  addTableColumnBefore(): void {
    this.editor?.chain().focus().addColumnBefore().run()
  }

  deleteTableRow(): void {
    this.editor?.chain().focus().deleteRow().run()
  }

  deleteTableColumn(): void {
    this.editor?.chain().focus().deleteColumn().run()
  }

  deleteTable(): void {
    this.editor?.chain().focus().deleteTable().run()
  }

  toggleTableHeader(): void {
    this.editor?.chain().focus().toggleHeaderRow().run()
  }

  mergeCells(): void {
    this.editor?.chain().focus().mergeCells().run()
  }

  splitCell(): void {
    this.editor?.chain().focus().splitCell().run()
  }

  setLink(): void {
    const previousUrl = this.editor?.getAttributes('link')['href']
    const url = window.prompt('Enter URL:', previousUrl)
    
    if (url === null) {
      return
    }

    if (url === '') {
      this.editor?.chain().focus().unsetLink().run()
      return
    }

    this.editor?.chain().focus().setLink({ href: url }).run()
  }

  insertImage(): void {
    // Toggle image options dropdown
    this.showImageOptions = !this.showImageOptions
    this.showEmojiPicker = false
    this.showGifPicker = false
  }

  insertImageFromUrl(): void {
    const url = window.prompt('Enter image URL:')
    if (url) {
      this.editor?.chain().focus().setImage({ src: url }).run()
      
      // Only track internal URLs for deletion (not external URLs)
      const fileId = this.extractFileIdFromUrl(url)
      if (fileId) {
        this.trackUploadedImage(url, fileId)
      }
    }
  }

  clearImageUploadError(): void {
    this.imageUploadError = null
  }

  /**
   * Extract file ID from image URL
   * URLs can be in formats:
   * - CDN URL: https://cdn.example.com/files/{fileId}/image.jpg
   * - Download URL: https://api.example.com/files/{fileId}/download
   * - Direct URL: https://api.example.com/files/{fileId}
   * - S3 URL: https://bucket.s3.region.amazonaws.com/path/to/{fileId}
   */
  private extractFileIdFromUrl(url: string): string | null {
    try {
      console.log('Extracting file ID from URL:', url)
      
      // Try to extract file ID from various URL patterns
      // The URLs follow this pattern: /workplaces/{workplaceId}/users/{userId}/files/{fileId}.{extension}
      const patterns = [
        // CDN URL pattern: https://media.octonius.com/workplaces/{workplaceId}/users/{userId}/files/{fileId}.{extension}
        /\/workplaces\/[a-f0-9-]+\/users\/[a-f0-9-]+\/files\/([a-f0-9-]+)\./,
        // S3 URL pattern: https://bucket.s3.amazonaws.com/workplaces/{workplaceId}/users/{userId}/files/{fileId}.{extension}
        /\/workplaces\/[a-f0-9-]+\/users\/[a-f0-9-]+\/files\/([a-f0-9-]+)\./,
        // Legacy patterns for backward compatibility
        /\/files\/([a-f0-9-]+)\//, // CDN URL pattern
        /\/files\/([a-f0-9-]+)\/download/, // Download URL pattern
        /\/files\/([a-f0-9-]+)$/, // Direct file URL pattern
        /\/files\/([a-f0-9-]+)\?/, // URL with query params
      ]
      
      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i]
        const match = url.match(pattern)
        if (match && match[1]) {
          // Validate that this looks like a file ID (not a workplace ID)
          const fileId = match[1]
          console.log(`Pattern ${i} matched file ID:`, fileId)
          
          // File IDs should be UUIDs, but let's be more specific about the pattern
          const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
          if (uuidPattern.test(fileId)) {
            console.log('Valid file ID extracted:', fileId)
            return fileId
          } else {
            console.log('Invalid file ID format:', fileId)
          }
        }
      }
      
      console.log('No valid file ID found in URL')
      return null
    } catch (error) {
      console.error('Error extracting file ID from URL:', error)
      return null
    }
  }

  /**
   * Track uploaded image for potential deletion
   */
  private trackUploadedImage(url: string, fileId: string): void {
    this.uploadedImages.set(url, fileId)
  }

  /**
   * Delete image from storage when removed from editor
   */
  private async deleteImageFromStorage(url: string): Promise<void> {
    const fileId = this.uploadedImages.get(url)
    if (!fileId) {
      // Try to extract file ID from URL if not tracked
      const extractedFileId = this.extractFileIdFromUrl(url)
      if (extractedFileId) {
        await this.deleteFileById(extractedFileId)
      }
      return
    }

    await this.deleteFileById(fileId)
    this.uploadedImages.delete(url)
    // Clean up processed deletions tracking after successful deletion
    this.processedDeletions.delete(url)
  }

  /**
   * Delete file by ID
   */
  private async deleteFileById(fileId: string): Promise<void> {
    try {
      console.log('Attempting to delete file with ID:', fileId)
      return new Promise((resolve) => {
        this.fileService.deleteFile(fileId).subscribe({
          next: () => {
            console.log('File deleted successfully:', fileId)
            resolve()
          },
          error: (error) => {
            console.error('Error deleting file:', fileId, error)
            // Don't reject to avoid breaking the editor functionality
            resolve()
          }
        })
      })
    } catch (error) {
      console.error('Exception in deleteFileById:', error)
      // Don't throw error to avoid breaking the editor functionality
    }
  }

  /**
   * Handle image deletion from editor
   */
  private handleImageDeletion(): void {
    if (!this.editor) return

    // Use a single event listener with debouncing to avoid multiple calls
    this.editor.on('update', ({ editor }) => {
      // Clear existing timer
      if (this.deletionCheckTimer) {
        clearTimeout(this.deletionCheckTimer)
      }
      
      // Debounce the deletion check to avoid multiple rapid calls
      this.deletionCheckTimer = setTimeout(() => {
        this.checkForDeletedImages()
      }, 100) // 100ms debounce
    })
  }

  /**
   * Check for deleted images by comparing current content with tracked images
   */
  private checkForDeletedImages(): void {
    if (!this.editor) return

    const currentImages = this.extractImageUrls(this.editor.getHTML())
    const trackedImages = Array.from(this.uploadedImages.keys())
    
    // Find deleted images by comparing tracked images with current images
    const deletedImages = trackedImages.filter(url => !currentImages.includes(url))
    
    // Delete removed images from storage (avoid duplicates)
    deletedImages.forEach(url => {
      if (!this.processedDeletions.has(url)) {
        this.processedDeletions.add(url)
        this.deleteImageFromStorage(url)
      }
    })
  }

  /**
   * Extract image URLs from HTML content
   */
  private extractImageUrls(html: string): string[] {
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
    const urls: string[] = []
    let match
    
    while ((match = imgRegex.exec(html)) !== null) {
      urls.push(match[1])
    }
    
    return urls
  }

  // Enhanced image insert with S3 file upload support
  async insertImageFromFile(): Promise<void> {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        // Reset upload state
        this.imageUploadError = null
        this.isUploadingImage = true
        this.imageUploadProgress = 0
        
        // Upload to S3 with note source context
        this.fileService.uploadFileViaS3(file, undefined, 'note').subscribe({
          next: (uploadedFile: any) => {
            const url = uploadedFile.cdn_url || uploadedFile.download_url || uploadedFile.url
            this.editor?.chain().focus().setImage({ src: url }).run()
            this.isUploadingImage = false
            this.imageUploadProgress = null
            
            // Track uploaded image for deletion
            this.trackUploadedImage(url, uploadedFile.id)
          },
          error: (err: any) => {
            console.error('Error uploading image:', err)
            this.imageUploadError = 'Failed to upload image. Please try again.'
            this.isUploadingImage = false
            this.imageUploadProgress = null
          }
        })
      }
    }
    
    input.click()
  }

  onHeadingChange(event: Event): void {
    const target = event.target as HTMLSelectElement
    const level = parseInt(target.value, 10)
    this.setHeading(level)
  }

  // Insert emoji at current cursor position
  insertEmoji(emoji: string): void {
    this.editor?.chain().focus().insertContent(emoji).run()
    this.showEmojiPicker = false
    
    // Add to recent emojis
    if (!this.recentEmojis.includes(emoji)) {
      this.recentEmojis.unshift(emoji)
      if (this.recentEmojis.length > 20) {
        this.recentEmojis = this.recentEmojis.slice(0, 20)
      }
      localStorage.setItem('recentEmojis', JSON.stringify(this.recentEmojis))
    }
  }

  // Search and load GIFs (using Giphy API)
  async searchGifs(): Promise<void> {
    if (!this.gifSearchTerm.trim()) {
      this.gifSearchResults = []
      return
    }

    this.isLoadingGifs = true
    
    try {
      const GIPHY_API_KEY = environment.giphyApiKey
      const limit = 12
      const rating = 'g' // General audience
      
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(this.gifSearchTerm)}&limit=${limit}&rating=${rating}`
      )
      
      if (response.ok) {
        const data = await response.json()
        this.gifSearchResults = data.data.map((gif: any) => ({
          url: gif.images.fixed_height.url,
          title: gif.title
        }))
      } else {
        throw new Error('Failed to fetch GIFs')
      }
      
    } catch (error) {
      console.error('Error searching GIFs:', error)
      this.gifSearchResults = []
    } finally {
      this.isLoadingGifs = false
    }
  }

  // Insert GIF as an image
  insertGif(gifUrl: string): void {
    // Insert GIF as an image
    this.editor?.chain().focus().setImage({ src: gifUrl }).run()
    this.showGifPicker = false
    
    // Don't track external GIF URLs for deletion
    // GIFs from external services like Giphy should not be deleted
  }

  // Filter emojis based on search
  getFilteredEmojis(): string[] {
    if (!this.emojiSearchTerm) {
      return this.commonEmojis
    }
    
    // In a real app, you'd have emoji names/keywords to search
    // For now, just return common emojis
    return this.commonEmojis
  }

  // Close emoji/gif pickers when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const emojiPicker = document.querySelector('.emoji-picker-container')
    const gifPicker = document.querySelector('.gif-picker-container')
    const imageOptions = document.querySelector('.image-options-container')
    const emojiBtn = document.querySelector('.emoji-picker-btn')
    const gifBtn = document.querySelector('.gif-picker-btn')
    const imageBtn = document.querySelector('.image-btn')
    
    if (emojiPicker && !emojiPicker.contains(event.target as Node) && 
        emojiBtn && !emojiBtn.contains(event.target as Node)) {
      this.showEmojiPicker = false
    }
    
    if (gifPicker && !gifPicker.contains(event.target as Node) && 
        gifBtn && !gifBtn.contains(event.target as Node)) {
      this.showGifPicker = false
    }
    
    if (imageOptions && !imageOptions.contains(event.target as Node) && 
        imageBtn && !imageBtn.contains(event.target as Node)) {
      this.showImageOptions = false
    }
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
      '[&_ul]:list-disc',
      '[&_ul]:pl-6',
      '[&_ul]:text-base-content',
      '[&_ul]:mb-4',
      '[&_ol]:list-decimal',
      '[&_ol]:pl-6',
      '[&_ol]:text-base-content',
      '[&_ol]:mb-4',
      '[&_li]:mb-1',
      '[&_li::marker]:text-base-content',
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
      '[&_table]:border-separate',
      '[&_table]:border-spacing-0',
      '[&_table]:w-full',
      '[&_table]:my-6',
      '[&_table]:overflow-hidden',
      '[&_table]:rounded-lg',
      '[&_table]:bg-base-100',
      '[&_table]:shadow-[0_0_0_2px_hsl(var(--bc)/0.2)]',
      '[&_th]:border-r-2',
      '[&_th]:border-b-2',
      '[&_th]:border-base-content/10',
      '[&_th]:bg-base-300',
      '[&_th]:p-3',
      '[&_th]:text-left',
      '[&_th]:font-semibold',
      '[&_th]:text-sm',
      '[&_th]:text-base-content',
      '[&_th:last-child]:border-r-0',
      '[&_td]:border-r-2',
      '[&_td]:border-b-2',
      '[&_td]:border-base-content/10',
      '[&_td]:bg-base-100',
      '[&_td]:p-3',
      '[&_td]:relative',
      '[&_td:last-child]:border-r-0',
      '[&_tr:last-child_td]:border-b-0',
      '[&_tr]:transition-colors',
      '[&_tr:hover_td]:bg-base-200',
      '[&_.selectedCell]:bg-primary/15',
      '[&_.selectedCell]:shadow-[inset_0_0_0_2px_hsl(var(--p)/0.5)]',
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

  // Mention helper methods
  private createMentionComponent(type: 'user' | 'file', props: any): HTMLElement {
    const container = document.createElement('div')
    container.className = 'mention-popup bg-base-100 border border-base-300 rounded-lg shadow-xl p-2 max-w-xs'
    
    const suggestions = type === 'user' ? this.userMentionSuggestions : this.fileMentionSuggestions
    
    if (suggestions.length === 0) {
      const noResultsText = type === 'user' ? 'No users found' : 'No files found'
      container.innerHTML = `<div class="text-sm text-base-content/60 p-2">${noResultsText}</div>`
      return container
    }
    
    suggestions.forEach((suggestion: any, index: number) => {
      const item = document.createElement('div')
      item.className = `mention-item flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-base-200 ${index === props.selectedIndex ? 'bg-primary/10' : ''}`
      
      if (type === 'user') {
        item.innerHTML = `
          <div class="avatar">
            <div class="w-6 h-6 rounded-full">
              <img src="${suggestion.avatar || environment.defaultAvatarUrl}" alt="${suggestion.label}" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-base-content truncate">${suggestion.label}</div>
            <div class="text-xs text-base-content/60 truncate">${suggestion.email || ''}</div>
          </div>
        `
        
        item.addEventListener('click', () => {
          console.log('🔍 Click handler - type:', type);
          console.log('🔍 Click handler - suggestion:', suggestion);
          console.log('🔍 Click handler - props:', props);
          
          if (type === 'user') {
            this.insertUserMention(suggestion as UserMentionSuggestion, props)
          } else if (type === 'file') {
            this.insertFileMention(suggestion as FileMentionSuggestion, props)
          }
          // Close the dropdown after selection
          this.hideAllMentionPopups()
        })
      } else {
        console.log('🔍 File suggestion details:', {
          label: suggestion.label,
          type: suggestion.type,
          icon: suggestion.icon,
          size: suggestion.size
        });
        
        // Create the icon container with SVG icon
        const iconContainer = document.createElement('div');
        iconContainer.className = 'w-8 h-8 flex items-center justify-center flex-shrink-0';
        
        // Create SVG icon based on the suggestion icon
        const iconSvg = this.createFileIconSVG(suggestion.icon || 'file');
        iconContainer.appendChild(iconSvg);
        
        // Create the text container
        const textContainer = document.createElement('div');
        textContainer.className = 'flex-1 min-w-0';
        textContainer.innerHTML = `
          <div class="text-sm font-medium text-base-content truncate">${suggestion.label}</div>
          <div class="text-xs text-base-content/60">${suggestion.type} ${suggestion.size ? `• ${suggestion.size}` : ''}</div>
        `;
        
        // Append both containers to the item
        item.appendChild(iconContainer);
        item.appendChild(textContainer);
        
        item.addEventListener('click', () => {
          this.insertFileMention(suggestion as FileMentionSuggestion, props)
          // Close the dropdown after selection
          this.hideAllMentionPopups()
        })
      }
      
      container.appendChild(item)
    })
    
    return container
  }

  private createMentionPopup(component: HTMLElement): any {
    // This is a simplified popup implementation
    // In a real implementation, you'd use a proper popup library like Tippy.js
    const popup = {
      element: component,
      isVisible: false,
      show: () => {
        // Prevent duplicate popups
        if (popup.isVisible) {
          return
        }
        
        // Remove any existing popups first
        this.hideAllMentionPopups()
        
        // Add to document.body for better positioning control
        document.body.appendChild(component)
        popup.isVisible = true
        
        // Find the text area and position relative to it
        const editorElement = this.editorElement?.nativeElement || document.body
        const proseMirror = editorElement.querySelector('.ProseMirror')
        
        if (proseMirror) {
          // Try to find the actual text input element within ProseMirror
          const textInput = proseMirror.querySelector('p') || proseMirror.querySelector('div') || proseMirror
          const textInputRect = textInput.getBoundingClientRect()
          
          // Position the dropdown right below the text input, but only if it's visible
          // Check if the text input is actually visible and in the viewport
          if (textInputRect.top > 0 && textInputRect.bottom > 0) {
            component.style.position = 'fixed'
            component.style.top = `${textInputRect.bottom}px`
            component.style.left = `${textInputRect.left}px`
            component.style.zIndex = '99999'
            
            console.log('🔍 Text input found and visible, positioning dropdown at:', {
              top: textInputRect.bottom,
              left: textInputRect.left,
              textInputRect: textInputRect,
              proseMirrorRect: proseMirror.getBoundingClientRect()
            });
          } else {
            // If text input is not visible, position it at the top of the editor
            const editorRect = editorElement.getBoundingClientRect()
            component.style.position = 'fixed'
            component.style.top = `${editorRect.top + 2}px`
            component.style.left = `${editorRect.left}px`
            component.style.zIndex = '99999'
            
            console.log('🔍 Text input not visible, positioning at editor top:', {
              top: editorRect.top + 2,
              left: editorRect.left,
              editorRect: editorRect
            });
          }
        } else {
          // Fallback positioning - position at the editor container
          const editorRect = editorElement.getBoundingClientRect()
          component.style.position = 'fixed'
          component.style.top = `${editorRect.top + 2}px`
          component.style.left = `${editorRect.left}px`
          component.style.zIndex = '99999'
          
          console.log('🔍 ProseMirror not found, positioning at editor:', {
            top: editorRect.top + 2,
            left: editorRect.left,
            editorRect: editorRect
          });
        }
        
        // Add click outside handler to close dropdown
        this.addClickOutsideHandler(component, () => {
          popup.hide()
        })
        
        // Add scroll handler to close dropdown
        this.addScrollHandler(() => {
          popup.hide()
        })
        
        // Prevent scroll from bubbling up when scrolling within the dropdown
        component.addEventListener('wheel', (event) => {
          event.stopPropagation()
        }, { passive: true })
        
        console.log('🔍 Mention popup created and shown:', component);
      },
      hide: () => {
        if (component.parentNode) {
          component.parentNode.removeChild(component)
        }
        popup.isVisible = false
        this.removeClickOutsideHandler()
        this.removeScrollHandler()
      },
      destroy: () => {
        popup.hide()
      }
    }
    
    popup.show()
    return popup
  }

  private hideAllMentionPopups(): void {
    // Remove all existing mention popups
    const existingPopups = document.querySelectorAll('.mention-popup')
    existingPopups.forEach(popup => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup)
      }
    })
    
    this.showUserMentions = false
    this.showFileMentions = false
  }

  private clickOutsideHandler: ((event: MouseEvent) => void) | null = null
  private scrollHandler: ((event: Event) => void) | null = null

  private addClickOutsideHandler(element: HTMLElement, callback: () => void): void {
    this.clickOutsideHandler = (event: MouseEvent) => {
      if (!element.contains(event.target as Node)) {
        callback()
      }
    }
    document.addEventListener('mousedown', this.clickOutsideHandler)
  }

  private removeClickOutsideHandler(): void {
    if (this.clickOutsideHandler) {
      document.removeEventListener('mousedown', this.clickOutsideHandler)
      this.clickOutsideHandler = null
    }
  }

  private addScrollHandler(callback: () => void): void {
    this.scrollHandler = (event: Event) => {
      // Only close dropdown if scrolling outside of the dropdown
      const target = event.target as Element
      const dropdown = document.querySelector('.mention-popup')
      
      if (dropdown && !dropdown.contains(target)) {
        callback()
      }
    }
    if (this.scrollHandler) {
      window.addEventListener('scroll', this.scrollHandler, true)
    }
  }

  private removeScrollHandler(): void {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, true)
      this.scrollHandler = null
    }
  }

  private insertUserMention(user: UserMentionSuggestion, props: any): void {
    console.log('🔍 insertUserMention called with user:', user);
    console.log('🔍 insertUserMention called with props:', props);
    
    const { editor, range } = props
    
    // Insert the mention with proper styling
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent([
        {
          type: 'userMention',
          attrs: {
            id: user.id,
            label: user.label,
            avatar: user.avatar,
            email: user.email,
            type: 'user'
          }
        },
        {
          type: 'text',
          text: ' '
        }
      ])
      .run()
  }

  private insertFileMention(file: FileMentionSuggestion, props: any): void {
    const { editor, range } = props
    
    // Insert the mention with proper styling
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent([
        {
          type: 'fileMention',
          attrs: {
            id: file.id,
            label: file.label,
            icon: file.icon,
            type: 'file',
            size: file.size
          }
        },
        {
          type: 'text',
          text: ' '
        }
      ])
      .run()
  }

  private createFileIconSVG(iconName: string): SVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('class', 'w-5 h-5 text-base-content/70');

    // Icon paths based on Lucide icons
    const iconPaths: { [key: string]: string } = {
      'file': 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z',
      'file-pen-line': 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
      'file-image': 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 2v6h6M18 13a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM6 20l4-8 3 3 4-6 3 4',
      'file-video': 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 2v6h6M10 11l5 3-5 3v-6z',
      'file-audio': 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 2v6h6M9 18v-6a3 3 0 1 1 6 0v6M9 12h6',
      'file-text': 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 2v6h6M16 13H8M16 17H8M10 9H8',
      'file-keynote': 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 2v6h6M8 13h8M8 17h8M8 9h8',
      'file-archive': 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 2v6h6M4 7h16M10 11h4M10 15h4M10 19h4',
      'file-code': 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 2v6h6M10 9l-2 2 2 2M14 9l2 2-2 2',
      'folder': 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'
    };

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', iconPaths[iconName] || iconPaths['file']);
    svg.appendChild(path);

    return svg;
  }

} 