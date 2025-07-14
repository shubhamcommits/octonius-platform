import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoungeStory } from '../../services/lounge.service';

@Component({
  selector: 'app-create-story-modal',
  standalone: false,
  templateUrl: './create-story-modal.component.html',
  styleUrls: ['./create-story-modal.component.scss']
})
export class CreateStoryModalComponent implements OnInit {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() storyCreated = new EventEmitter<Partial<LoungeStory>>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      type: ['news', Validators.required],
      date: ['', Validators.required],
      image: [''],
      event_date: [''],
      location: ['']
    });

    // Watch for type changes to handle event_date field
    this.form.get('type')?.valueChanges.subscribe(type => {
      if (type !== 'event') {
        this.form.patchValue({ event_date: '', location: '' });
      }
    });
  }

  ngOnInit(): void {
    console.log('CreateStoryModalComponent initialized');
  }

  onSubmit() {
    if (this.form.valid) {
      const formValue = this.form.value;
      
      // Clean up the data before sending
      const storyData: Partial<LoungeStory> = {
        title: formValue.title || '',
        description: formValue.description || '',
        type: (formValue.type || 'news') as 'news' | 'event' | 'update',
        date: formValue.date || '',
        image: formValue.image || undefined
      };

      // Only include event_date and location if type is 'event' and they have valid values
      if (formValue.type === 'event') {
        if (formValue.event_date && formValue.event_date.trim()) {
          storyData.event_date = formValue.event_date;
        }
        if (formValue.location && formValue.location.trim()) {
          storyData.location = formValue.location;
        }
      }

      this.storyCreated.emit(storyData);
    }
  }

  onClose() {
    this.close.emit();
  }
} 