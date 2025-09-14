import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, Input, Output, EventEmitter, forwardRef, HostListener } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms'

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
import { Suggestion } from '@tiptap/suggestion'
import { Node as TiptapNode } from '@tiptap/core'

// Services
import { FileService } from '../../services/file.service'
import { UserMentionService, UserMentionSuggestion } from '../../services/user-mention.service'
import { FileMentionService, FileMentionSuggestion } from '../../services/file-mention.service'
import { AuthService } from '../../services/auth.service'

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
    return ['span', { class: 'userMention mention-user bg-primary/10 text-primary px-2 py-1 rounded-full text-sm font-medium', ...HTMLAttributes }, `@${HTMLAttributes['data-label'] || 'User'}`]
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
    return ['span', { class: 'fileMention mention-file bg-secondary/10 text-secondary px-2 py-1 rounded-full text-sm font-medium', ...HTMLAttributes }, `#${HTMLAttributes['data-label'] || 'File'}`]
  },
})

export interface TiptapEditorConfig {
  placeholder?: string
  showToolbar?: boolean
  showBubbleMenu?: boolean
  showCharacterCount?: boolean
  maxHeight?: string
  minHeight?: string
  readOnly?: boolean
  extensions?: any[]
  toolbarItems?: string[]
  enableImageUpload?: boolean
  enableEmojiPicker?: boolean
  enableTableControls?: boolean
  sourceContext?: string
  autoExpand?: boolean
  enableMentions?: boolean
  groupId?: string
  workplaceId?: string
}

@Component({
  selector: 'app-tiptap-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tiptap-editor.component.html',
  styleUrls: ['./tiptap-editor.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TiptapEditorComponent),
      multi: true
    }
  ]
})
export class TiptapEditorComponent implements OnInit, OnDestroy, AfterViewInit, ControlValueAccessor {
  @ViewChild('editorElement', { static: false }) editorElement!: ElementRef
  @ViewChild('bubbleMenuElement', { static: false }) bubbleMenuElement!: ElementRef
  
  @Input() config: TiptapEditorConfig = {
    placeholder: 'Start writing...',
    showToolbar: true,
    showBubbleMenu: true,
    showCharacterCount: false,
    maxHeight: '400px',
    minHeight: '120px',
    readOnly: false,
    toolbarItems: ['bold', 'italic', 'underline', 'link', 'bulletList', 'orderedList', 'table', 'emoji'],
    enableImageUpload: true,
    enableEmojiPicker: true,
    enableTableControls: true,
    sourceContext: 'editor',
    enableMentions: false,
    groupId: undefined,
    workplaceId: undefined
  }
  
  @Input() value: string = ''
  @Output() valueChange = new EventEmitter<string>()
  @Output() editorReady = new EventEmitter<Editor>()
  
  editor!: Editor
  isEditorFocused = false
  private onChange = (value: string) => {}
  private onTouched = () => {}
  private isDisabled = false

  // Image upload states
  isUploadingImage = false
  imageUploadProgress: number | null = null
  imageUploadError: string | null = null
  showImageOptions = false

  // Emoji and GIF state
  showEmojiPicker = false
  showGifPicker = false
  emojiSearchTerm = ''
  gifSearchTerm = ''
  gifSearchResults: any[] = []
  isLoadingGifs = false
  
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

  // Mention-related properties
  userMentionSuggestions: UserMentionSuggestion[] = []
  fileMentionSuggestions: FileMentionSuggestion[] = []
  showUserMentions = false
  showFileMentions = false
  currentMentionQuery = ''

  constructor(
    private fileService: FileService,
    private userMentionService: UserMentionService,
    private fileMentionService: FileMentionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Load recently used emojis from localStorage
    const savedRecentEmojis = localStorage.getItem('recentEmojis')
    if (savedRecentEmojis) {
      this.recentEmojis = JSON.parse(savedRecentEmojis)
    }
    
    // Set up mention context if mentions are enabled
    if (this.config.enableMentions) {
      console.log('Setting up mention context:', {
        groupId: this.config.groupId,
        workplaceId: this.config.workplaceId
      });
      // Get current user ID for file mention service
      const currentUser = this.authService.getCurrentUser()
      const userId = currentUser?.uuid || undefined
      
      this.userMentionService.setContext(this.config.groupId, this.config.workplaceId)
      this.fileMentionService.setContext(this.config.groupId, this.config.workplaceId, userId)
    } else {
      console.log('Mentions are disabled in config');
    }
    
    // Component initialization
    console.log('TiptapEditorComponent initialized', this.config)
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeEditor()
    }, 100)
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.destroy()
    }
    // Clean up any remaining popups and event handlers
    this.hideAllMentionPopups()
    this.removeClickOutsideHandler()
    this.removeScrollHandler()
  }

  private initializeEditor(retryCount = 0): void {
    const maxRetries = 5
    const retryDelay = 500

    try {
      const editorElement = this.editorElement?.nativeElement
      if (!editorElement) {
        if (retryCount < maxRetries) {
          setTimeout(() => this.initializeEditor(retryCount + 1), retryDelay)
          return
        }
        throw new Error('Editor element not found after maximum retries')
      }

      this.editor = new Editor({
        element: editorElement,
        extensions: this.getExtensions(),
        content: this.value || '<p></p>',
        editable: !this.config.readOnly,
        editorProps: {
          attributes: {
            class: this.getEditorClasses(),
            style: this.config.autoExpand 
              ? `min-height: ${this.config.minHeight || '120px'};`
              : `min-height: ${this.config.minHeight || '120px'}; max-height: ${this.config.maxHeight || '200px'};`
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
                
                // Reset upload state
                this.imageUploadError = null
                this.isUploadingImage = true
                this.imageUploadProgress = 0
                
                // Upload to S3
                this.fileService.uploadFileViaS3(file, undefined, this.config.sourceContext).subscribe({
                  next: (uploadedFile: any) => {
                    const url = uploadedFile.cdn_url || uploadedFile.download_url || uploadedFile.url
                    const node = view.state.schema.nodes['image'].create({
                      src: url
                    })
                    const transaction = view.state.tr.replaceSelectionWith(node)
                    view.dispatch(transaction)
                    
                    this.isUploadingImage = false
                    this.imageUploadProgress = null
                  },
                  error: (err: any) => {
                    console.error('Error uploading dropped image:', err)
                    this.imageUploadError = 'Failed to upload image. Please try again.'
                    this.isUploadingImage = false
                    this.imageUploadProgress = null
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
                
                // Reset upload state
                this.imageUploadError = null
                this.isUploadingImage = true
                this.imageUploadProgress = 0
                
                // Upload to S3
                this.fileService.uploadFileViaS3(file, undefined, this.config.sourceContext).subscribe({
                  next: (uploadedFile: any) => {
                    const url = uploadedFile.cdn_url || uploadedFile.download_url || uploadedFile.url
                    const node = view.state.schema.nodes['image'].create({
                      src: url
                    })
                    const transaction = view.state.tr.replaceSelectionWith(node)
                    view.dispatch(transaction)
                    
                    this.isUploadingImage = false
                    this.imageUploadProgress = null
                  },
                  error: (err: any) => {
                    console.error('Error uploading pasted image:', err)
                    this.imageUploadError = 'Failed to upload image. Please try again.'
                    this.isUploadingImage = false
                    this.imageUploadProgress = null
                    alert('Failed to upload image. Please try again.')
                  }
                })
                return true
              }
            }
            return false
          }
        },
        onUpdate: ({ editor }) => {
          const html = editor.getHTML()
          this.value = html
          this.onChange(html)
          this.valueChange.emit(html)
          // Clear any upload errors when user starts typing
          this.imageUploadError = null
        },
        onFocus: () => {
          this.isEditorFocused = true
          this.onTouched()
          // Clear any upload errors when user starts interacting
          this.imageUploadError = null
        },
        onBlur: () => {
          this.isEditorFocused = false
        }
      })

      this.editorReady.emit(this.editor)
      
    } catch (error) {
      console.error('Error initializing editor:', error)
      if (retryCount < maxRetries) {
        setTimeout(() => this.initializeEditor(retryCount + 1), retryDelay)
      }
    }
  }

  private getExtensions(): any[] {
    const extensions: any[] = [
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
        placeholder: this.config.placeholder || 'Start writing...',
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
      Underline.configure({
        HTMLAttributes: {
          class: 'underline'
        }
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify']
      })
    ]

    if (this.config.showCharacterCount) {
      extensions.push(CharacterCount.configure({
        limit: 10000
      }))
    }

    if (this.config.showBubbleMenu && this.bubbleMenuElement?.nativeElement) {
      extensions.push(BubbleMenu.configure({
        element: this.bubbleMenuElement.nativeElement,
        tippyOptions: {
          duration: 100,
          placement: 'top'
        }
      }))
    }

    // Add mention extensions if enabled
    if (this.config.enableMentions) {
      console.log('Adding mention extensions to Tiptap editor');
      // User mentions (@)
      extensions.push(Mention.configure({
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
            let component: any
            let popup: any

            return {
              onStart: (props: any) => {
                component = this.createMentionComponent('user', props)
                popup = this.createMentionPopup(component)
              },
              onUpdate: (props: any) => {
                component = this.createMentionComponent('user', props)
                popup = this.createMentionPopup(component)
              },
              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  popup?.hide()
                  return true
                }
                return false
              },
              onExit: () => {
                popup?.destroy()
                this.showUserMentions = false
              }
            }
          }
        }
      }))

      // File mentions (#) - using a separate Mention configuration
      extensions.push(Mention.configure({
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
                    type: props.type,
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
            console.log('🔍 File mention query triggered:', query);
            this.currentMentionQuery = query
            this.showUserMentions = false
            this.showFileMentions = true
            
            return new Promise((resolve) => {
              console.log('🔍 Calling fileMentionService.getFileSuggestions with query:', query);
              this.fileMentionService.getFileSuggestions(query).subscribe({
                next: (suggestions: any) => {
                  console.log('🔍 File suggestions received:', suggestions);
                  this.fileMentionSuggestions = suggestions
                  resolve(suggestions)
                },
                error: (error) => {
                  console.error('🔍 Error fetching file suggestions:', error);
                  this.fileMentionSuggestions = []
                  resolve([])
                }
              })
            })
          },
          render: () => {
            let component: any
            let popup: any

            return {
              onStart: (props: any) => {
                console.log('🔍 File mention onStart:', props);
                component = this.createMentionComponent('file', props)
                popup = this.createMentionPopup(component)
              },
              onUpdate: (props: any) => {
                console.log('🔍 File mention onUpdate:', props);
                component = this.createMentionComponent('file', props)
                popup = this.createMentionPopup(component)
              },
              onKeyDown: (props: any) => {
                console.log('🔍 File mention onKeyDown:', props);
                if (props.event.key === 'Escape') {
                  popup?.hide()
                  return true
                }
                return false
              },
              onExit: () => {
                console.log('🔍 File mention onExit');
                popup?.destroy()
                this.showFileMentions = false
              }
            }
          }
        }
      }))
    }

    // Add custom extensions if provided
    if (this.config.extensions) {
      extensions.push(...this.config.extensions)
    }

    return extensions
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || ''
    if (this.editor) {
      this.editor.commands.setContent(this.value)
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled
    if (this.editor) {
      this.editor.setEditable(!isDisabled)
    }
  }

  // Editor methods
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
      this.editor?.chain().focus().setHeading({ level: level as 1 | 2 | 3 }).run()
    }
  }

  toggleBulletList(): void {
    this.editor?.chain().focus().toggleBulletList().run()
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

  setTextAlign(alignment: string): void {
    this.editor?.chain().focus().setTextAlign(alignment).run()
  }

  setLink(): void {
    const url = window.prompt('Enter URL:')
    if (url) {
      this.editor?.chain().focus().setLink({ href: url }).run()
    }
  }

  insertImage(): void {
    if (this.config.enableImageUpload) {
      this.insertImageFromFile()
    } else {
      const url = window.prompt('Enter image URL:')
      if (url) {
        this.editor?.chain().focus().setImage({ src: url }).run()
      }
    }
  }

  async insertImageFromFile(): Promise<void> {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    
    input.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (file) {
        // Validate file size (max 10MB)
        const fileSize = file.size / 1024 / 1024 // Size in MB
        if (fileSize > 10) {
          alert('Please select an image smaller than 10MB')
          return
        }

        // Reset upload state
        this.imageUploadError = null
        this.isUploadingImage = true
        this.imageUploadProgress = 0
        
        // Upload to S3
        this.fileService.uploadFileViaS3(file, undefined, this.config.sourceContext).subscribe({
          next: (uploadedFile: any) => {
            const url = uploadedFile.cdn_url || uploadedFile.download_url || uploadedFile.url
            this.editor?.chain().focus().setImage({ src: url }).run()
            this.isUploadingImage = false
            this.imageUploadProgress = null
          },
          error: (err: any) => {
            console.error('Error uploading image:', err)
            this.imageUploadError = 'Failed to upload image. Please try again.'
            this.isUploadingImage = false
            this.imageUploadProgress = null
            alert('Failed to upload image. Please try again.')
          }
        })
      }
    }
    
    input.click()
  }

  // Table methods
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

  // Emoji methods
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

  // Search and load GIFs (using Giphy API - you'll need to add your API key)
  async searchGifs(): Promise<void> {
    if (!this.gifSearchTerm.trim()) {
      this.gifSearchResults = []
      return
    }

    this.isLoadingGifs = true
    
    try {
      // TODO: Replace 'YOUR_GIPHY_API_KEY' with your actual Giphy API key
      // Get one at https://developers.giphy.com/
      const GIPHY_API_KEY = 'YOUR_GIPHY_API_KEY'
      const limit = 12
      const rating = 'g' // General audience
      
      // If you have a real API key, uncomment this code:
      /*
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
      */
      
      // Demo data (remove when using real API)
      await new Promise(resolve => setTimeout(resolve, 500))
      this.gifSearchResults = [
        { url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', title: 'Happy' },
        { url: 'https://media.giphy.com/media/26BRBupa6nRXMGBP2/giphy.gif', title: 'Celebrate' },
        { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', title: 'Thumbs up' },
        { url: 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif', title: 'Laughing' },
        { url: 'https://media.giphy.com/media/l2Sqir5ZxfoS27EvS/giphy.gif', title: 'Thank you' },
        { url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif', title: 'Applause' }
      ]
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

  clearImageUploadError(): void {
    this.imageUploadError = null
  }

  insertImageFromUrl(): void {
    const url = window.prompt('Enter image URL:')
    if (url) {
      this.editor?.chain().focus().setImage({ src: url }).run()
    }
  }

  undo(): void {
    this.editor?.chain().focus().undo().run()
  }

  redo(): void {
    this.editor?.chain().focus().redo().run()
  }

  // Utility methods
  isActive(nameOrAttributes: string | Record<string, any>, attributes?: any): boolean {
    if (!this.editor) return false
    
    if (typeof nameOrAttributes === 'string') {
      if (attributes) {
        return this.editor.isActive(nameOrAttributes, attributes)
      }
      return this.editor.isActive(nameOrAttributes)
    } else {
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

  getCurrentHeadingText(): string {
    if (!this.editor) return 'Paragraph'
    
    if (this.editor.isActive('heading', { level: 1 })) return 'Heading 1'
    if (this.editor.isActive('heading', { level: 2 })) return 'Heading 2'
    if (this.editor.isActive('heading', { level: 3 })) return 'Heading 3'
    
    return 'Paragraph'
  }

  private getEditorClasses(): string {
    const baseClasses = [
      'prose',
      'prose-sm',
      'max-w-none',
      'focus:outline-none',
      'text-base-content',
      'bg-transparent',
      'leading-relaxed',
      // Headings
      '[&_h1]:text-xl',
      '[&_h1]:font-bold',
      '[&_h1]:mb-2',
      '[&_h1]:mt-3',
      '[&_h2]:text-lg',
      '[&_h2]:font-bold',
      '[&_h2]:mb-2',
      '[&_h2]:mt-3',
      '[&_h3]:text-base',
      '[&_h3]:font-semibold',
      '[&_h3]:mb-1',
      '[&_h3]:mt-2',
      // Paragraphs
      '[&_p]:text-base-content',
      '[&_p]:mb-2',
      '[&_p]:leading-relaxed',
      // Lists
      '[&_ul]:text-base-content',
      '[&_ul]:list-disc',
      '[&_ul]:pl-4',
      '[&_ul]:mb-2',
      '[&_ol]:text-base-content',
      '[&_ol]:list-decimal',
      '[&_ol]:pl-4',
      '[&_ol]:mb-2',
      '[&_li]:text-base-content',
      '[&_li]:mb-0.5',
      // Task lists
      '[&_.task-list]:list-none',
      '[&_.task-list]:pl-0',
      '[&_.task-list-item]:flex',
      '[&_.task-list-item]:items-start',
      '[&_.task-list-item]:mb-1',
      '[&_.task-list-item_input]:mr-2',
      '[&_.task-list-item_input]:mt-1',
      // Blockquotes
      '[&_blockquote]:border-l-4',
      '[&_blockquote]:border-primary',
      '[&_blockquote]:pl-4',
      '[&_blockquote]:italic',
      '[&_blockquote]:text-base-content/80',
      '[&_blockquote]:mb-2',
      // Code blocks
      '[&_pre]:bg-base-200',
      '[&_pre]:text-base-content',
      '[&_pre]:p-3',
      '[&_pre]:rounded',
      '[&_pre]:mb-2',
      '[&_pre]:overflow-x-auto',
      // Inline code
      '[&_code]:bg-base-200',
      '[&_code]:text-base-content',
      '[&_code]:px-1',
      '[&_code]:py-0.5',
      '[&_code]:rounded',
      '[&_code]:text-xs',
      '[&_code]:font-mono',
      // Links
      '[&_a]:text-primary',
      '[&_a]:underline',
      '[&_a]:cursor-pointer',
      '[&_a:hover]:text-primary-focus',
      // Tables
      '[&_table]:w-full',
      '[&_table]:mb-2',
      '[&_td]:border',
      '[&_td]:border-base-300',
      '[&_td]:p-2',
      '[&_th]:border',
      '[&_th]:border-base-300',
      '[&_th]:p-2',
      '[&_th]:bg-base-200',
      '[&_th]:font-semibold',
      // Horizontal rule
      '[&_hr]:border-base-300',
      '[&_hr]:my-3',
      // Selection
      '[&_::selection]:bg-primary/20',
      // Mentions
      '[&_.mention-user]:bg-primary/10',
      '[&_.mention-user]:text-primary',
      '[&_.mention-user]:px-1',
      '[&_.mention-user]:py-0.5',
      '[&_.mention-user]:rounded',
      '[&_.mention-user]:font-medium',
      '[&_.userMention]:bg-primary/10',
      '[&_.userMention]:text-primary',
      '[&_.userMention]:px-1',
      '[&_.userMention]:py-0.5',
      '[&_.userMention]:rounded',
      '[&_.userMention]:font-medium',
      '[&_.mention-file]:bg-info/10',
      '[&_.mention-file]:text-info',
      '[&_.mention-file]:px-1',
      '[&_.mention-file]:py-0.5',
      '[&_.mention-file]:rounded',
      '[&_.mention-file]:font-medium',
      '[&_.fileMention]:bg-info/10',
      '[&_.fileMention]:text-info',
      '[&_.fileMention]:px-1',
      '[&_.fileMention]:py-0.5',
      '[&_.fileMention]:rounded',
      '[&_.fileMention]:font-medium',
    ]

    // Add auto-expand class if configured
    if (this.config.autoExpand) {
      baseClasses.push('auto-expand')
    }

    return baseClasses.join(' ')
  }

  // Mention helper methods
  private createMentionComponent(type: 'user' | 'file', props: any): HTMLElement {
    const container = document.createElement('div')
    container.className = 'mention-suggestions bg-base-100 border border-base-300 rounded-box shadow-xl p-2 max-h-48 overflow-y-auto min-w-64 z-50 absolute'
    
    const suggestions = type === 'user' ? this.userMentionSuggestions : this.fileMentionSuggestions
    
    if (suggestions.length === 0) {
      const noResults = document.createElement('div')
      noResults.className = 'text-base-content/60 text-sm p-2 text-center'
      noResults.textContent = `No ${type}s found`
      container.appendChild(noResults)
      return container
    }

    suggestions.forEach((suggestion, index) => {
      const item = document.createElement('div')
      item.className = `mention-item flex items-center gap-2 px-3 py-2 rounded-btn cursor-pointer transition-colors duration-200 ${index === 0 ? 'bg-base-200' : 'hover:bg-base-200'}`
      item.setAttribute('data-index', index.toString())
      
      if (type === 'user') {
        const userSuggestion = suggestion as UserMentionSuggestion
        const displayName = userSuggestion.label || 'Unknown User';
        const firstLetter = displayName.charAt(0).toUpperCase();
        
        item.innerHTML = `
          <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content text-xs font-medium flex-shrink-0">
            ${userSuggestion.avatar ? `<img src="${userSuggestion.avatar}" class="w-full h-full rounded-full object-cover" />` : firstLetter}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm text-base-content whitespace-nowrap overflow-hidden text-ellipsis">${displayName}</div>
            <div class="text-xs text-base-content/60 whitespace-nowrap overflow-hidden text-ellipsis">${userSuggestion.email || ''}</div>
          </div>
        `
      } else {
        const fileSuggestion = suggestion as FileMentionSuggestion
        item.innerHTML = `
          <div class="text-lg flex-shrink-0">${fileSuggestion.icon || '📁'}</div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm text-base-content whitespace-nowrap overflow-hidden text-ellipsis">${fileSuggestion.label}</div>
            <div class="text-xs text-base-content/60">${fileSuggestion.type} ${fileSuggestion.size ? `• ${fileSuggestion.size}` : ''}</div>
          </div>
        `
      }
      
      item.addEventListener('click', () => {
        if (type === 'user') {
          this.insertUserMention(suggestion as UserMentionSuggestion, props)
        } else {
          this.insertFileMention(suggestion as FileMentionSuggestion, props)
        }
        // Close the dropdown after selection
        this.hideAllMentionPopups()
      })
      
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
    const existingPopups = document.querySelectorAll('.mention-suggestions')
    existingPopups.forEach(popup => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup)
      }
    })
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
      const dropdown = document.querySelector('.mention-suggestions')
      
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
    
    // Insert the file mention with proper styling
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
            type: file.type,
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
} 