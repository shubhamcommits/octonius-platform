import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule, Router } from '@angular/router'
import { FormsModule } from '@angular/forms'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'

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
  createdBy = 'Cosmin Ciobanu'
  createdByAvatar = '👤'
  lastEdited = 'May 12, 2025 12:34 PM'
  
  constructor(private router: Router) {}
  
  ngOnInit(): void {
    this.initializeEditor()
  }
  
  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.destroy()
    }
  }
  
  initializeEditor(): void {
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
      data: {
        blocks: []
      }
    })
  }
  
  async saveNote(): Promise<void> {
    try {
      const outputData = await this.editor.save()
      console.log('Saving note:', this.noteTitle, outputData)
      // Here you would typically save to your backend
      // For now, just log the data
    } catch (error) {
      console.error('Saving failed:', error)
    }
  }
  
  shareNote(): void {
    console.log('Share note')
    // Implement share functionality
  }
  
  showMoreOptions(): void {
    console.log('Show more options')
    // Implement more options menu
  }
  
  goBackToFiles(): void {
    this.router.navigate(['/my-space/files'])
  }
} 