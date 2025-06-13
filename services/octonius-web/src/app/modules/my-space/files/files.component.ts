import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router } from '@angular/router'

interface FileItem {
  name: string
  type: 'note' | 'pdf' | 'doc' | 'pptx' | 'xlsx'
  icon: string
  lastModified: string
  owner: string
  ownerAvatar: string
}

@Component({
  selector: 'app-files',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent {
  userName = 'Cosmin'
  
  files: FileItem[] = [
    {
      name: 'Meeting notes',
      type: 'note',
      icon: '📄',
      lastModified: 'May 3, 2025 12:45 PM',
      owner: 'You',
      ownerAvatar: '👤'
    },
    {
      name: 'Sales pitch.PDF',
      type: 'pdf',
      icon: '📘',
      lastModified: 'May 3, 2025 10:23 AM',
      owner: 'You',
      ownerAvatar: '👤'
    },
    {
      name: 'New article draft',
      type: 'note',
      icon: '📄',
      lastModified: 'May 3, 2025 12:45 PM',
      owner: 'You',
      ownerAvatar: '👤'
    },
    {
      name: 'Financial offer ACME.docx',
      type: 'doc',
      icon: '📘',
      lastModified: 'May 3, 2025 10:23 AM',
      owner: 'You',
      ownerAvatar: '👤'
    },
    {
      name: 'Sales pitch.pptx',
      type: 'pptx',
      icon: '📘',
      lastModified: 'May 3, 2025 10:23 AM',
      owner: 'You',
      ownerAvatar: '👤'
    },
    {
      name: 'Marketing strategy.docx',
      type: 'doc',
      icon: '📘',
      lastModified: 'June 14, 2025 2:45 PM',
      owner: 'You',
      ownerAvatar: '👤'
    },
    {
      name: 'Budget report.xlsx',
      type: 'xlsx',
      icon: '📘',
      lastModified: 'July 22, 2025 9:00 AM',
      owner: 'You',
      ownerAvatar: '👤'
    },
    {
      name: 'Project timeline.pdf',
      type: 'pdf',
      icon: '📘',
      lastModified: 'August 30, 2025 4:15 PM',
      owner: 'You',
      ownerAvatar: '👤'
    }
  ]
  
  constructor(private router: Router) {}
  
  onCreateNote(): void {
    // Navigate to note editor
    this.router.navigate(['/my-space/note-editor'])
  }
  
  onUploadFile(): void {
    // Handle file upload
    console.log('Upload file')
  }
  
  onFileClick(file: FileItem): void {
    if (file.type === 'note') {
      // Navigate to note editor with file
      this.router.navigate(['/my-space/note-editor', file.name])
    } else {
      // Open file preview or download
      console.log('Open file:', file.name)
    }
  }
} 