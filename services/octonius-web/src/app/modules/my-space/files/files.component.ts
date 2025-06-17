import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router } from '@angular/router'
import { UserService } from '../../../core/services/user.service'
import { AuthService } from '../../../core/services/auth.service'
import { FileService } from '../../../core/services/file.service'
import { File } from '../../../core/models/file.model'
import { ToastService } from '../../../core/services/toast.service'

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent implements OnInit {
  userName: string = 'User'
  files: File[] = []
  isLoading: boolean = true
  error: string | null = null

  constructor(
    private router: Router,
    private authService: AuthService,
    private fileService: FileService,
    private userService: UserService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUserData()
    this.loadFiles()
  }

  private loadUserData(): void {
    const user = this.authService.getCurrentUser()
    if (user) {
      this.userName = user.first_name || user.email?.split('@')[0] || 'User'
    }
  }

  private loadFiles(): void {
    this.isLoading = true
    this.error = null

    this.fileService.getFiles().subscribe({
      next: (files: File[]) => {
        this.files = files
        this.isLoading = false
      },
      error: (err: Error) => {
        this.error = 'Failed to load files. Please try again.'
        this.isLoading = false
        this.toastService.error('Failed to load files. Please try again.')
        console.error('Error loading files:', err)
      }
    })
  }

  onCreateNote(): void {
    this.toastService.info('Creating a new note...')
    this.router.navigate(['/my-space/note-editor'])
  }

  onUploadFile(): void {
    this.toastService.info('Opening file upload dialog...')
    // Create a hidden file input element
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.style.display = 'none'
    document.body.appendChild(fileInput)

    // Handle file selection
    fileInput.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        const file = target.files[0]
        this.uploadFile(file)
      }
      // Clean up
      document.body.removeChild(fileInput)
    }

    // Trigger file selection
    fileInput.click()
  }

  private uploadFile(file: globalThis.File): void {
    this.isLoading = true
    this.error = null

    this.fileService.uploadFile(file).subscribe({
      next: (response: File) => {
        this.files = [...this.files, response]
        this.isLoading = false
      },
      error: (err: Error) => {
        this.error = 'Failed to upload file. Please try again.'
        this.isLoading = false
        this.toastService.error('Failed to upload file. Please try again.')
        console.error('Error uploading file:', err)
      }
    })
  }

  onFileClick(file: File): void {
    if (file.type === 'note') {
      this.router.navigate(['/my-space/note-editor', file.id])
    } else {
      // Handle file download or preview
      this.fileService.downloadFile(file.id).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = file.name
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        },
        error: (err: Error) => {
          this.error = 'Failed to download file. Please try again.'
          this.toastService.error('Failed to download file. Please try again.')
          console.error('Error downloading file:', err)
        }
      })
    }
  }
} 