import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { UserService } from '../../../core/services/user.service'
import { AuthService, User } from '../../../core/services/auth.service'
import { FileService } from '../../../core/services/file.service'
import { File } from '../../../core/models/file.model'
import { ToastService } from '../../../core/services/toast.service'
import { CapitalizePipe } from '../../../core/pipes/capitalize.pipe'
import { firstValueFrom } from 'rxjs'
import { SharedModule } from '../../shared/shared.module'

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CapitalizePipe, SharedModule],
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent implements OnInit {
  userName: string = 'User'
  files: File[] = []
  filteredFiles: File[] = []
  isLoading: boolean = true
  error: string | null = null
  user: User | null = null
  searchQuery: string = ''

  constructor(
    private router: Router,
    private authService: AuthService,
    private fileService: FileService,
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData()
  }

  private async loadData(): Promise<void> {
    try {
      this.isLoading = true
      this.error = null

      // Load user data
      const response: any = await firstValueFrom(this.userService.getCurrentUser())
      const user = response.data.user
      if (!user) {
        throw new Error('No user data available')
      }
      
      this.userName = user.first_name || user.email?.split('@')[0] || 'User'
      this.user = user

      // Load files
      if (!user.current_workplace_id) {
        throw new Error('No workplace ID available')
      }

      const files = await firstValueFrom(
        this.fileService.getFiles(user.uuid, user.current_workplace_id)
      )

      // Format files with proper icons and owner info
      this.files = files.map(file => ({
        ...file,
        icon: this.getFileIcon(file.type),
        ownerAvatar: file.ownerAvatar || this.getInitials(file.owner)
      }))
      
      this.filteredFiles = [...this.files]
      this.isLoading = false
    } catch (err) {
      this.error = 'Failed to load data. Please try again.'
      this.isLoading = false
      this.toastService.error('Failed to load data. Please try again.')
      console.error('Error loading data:', err)
    }
  }

  private getInitials(name: string): string {
    if (!name) return '👤'
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredFiles = [...this.files]
      return
    }

    const query = this.searchQuery.toLowerCase()
    this.filteredFiles = this.files.filter(file => 
      file.name.toLowerCase().includes(query)
    )
  }

  getFileIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'note': '📝',
      'pdf': '📄',
      'doc': '📄',
      'docx': '📄',
      'xls': '📊',
      'xlsx': '📊',
      'ppt': '📊',
      'pptx': '📊',
      'image': '🖼️',
      'video': '🎥',
      'audio': '🎵',
      'folder': '📁',
      'default': '📄'
    }
    return icons[type] || icons['default']
  }

  onCreateNote(): void {
    this.toastService.info('Creating a new note...')
    this.router.navigate(['/my-space/note-editor'])
  }

  onUploadFile(): void {
    this.toastService.info('Opening file upload dialog...')
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.style.display = 'none'
    fileInput.multiple = true // Allow multiple file selection
    document.body.appendChild(fileInput)

    fileInput.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        for (let i = 0; i < target.files.length; i++) {
          await this.uploadFile(target.files[i])
        }
      }
      document.body.removeChild(fileInput)
    }

    fileInput.click()
  }

  private async uploadFile(file: globalThis.File): Promise<void> {
    try {
      const response = await firstValueFrom(this.fileService.uploadFile(file))
      this.files = [...this.files, response]
      this.filteredFiles = [...this.files]
      this.toastService.success(`Successfully uploaded ${file.name}`)
    } catch (err) {
      this.toastService.error(`Failed to upload ${file.name}. Please try again.`)
      console.error('Error uploading file:', err)
    }
  }

  onFileClick(file: File): void {
    if (file.type === 'note') {
      this.router.navigate(['/my-space/note-editor', file.id])
    } else {
      this.downloadFile(file)
    }
  }

  private async downloadFile(file: File): Promise<void> {
    try {
      const blob = await firstValueFrom(this.fileService.downloadFile(file.id))
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      this.toastService.error('Failed to download file. Please try again.')
      console.error('Error downloading file:', err)
    }
  }
} 