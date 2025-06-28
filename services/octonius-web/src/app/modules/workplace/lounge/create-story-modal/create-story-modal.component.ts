import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
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

  form;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      type: ['news', Validators.required],
      date: ['', Validators.required],
      image: [''],
      eventDate: [''],
      location: ['']
    });
  }

  ngOnInit(): void {
    console.log('CreateStoryModalComponent initialized');
  }

  onSubmit() {
    if (this.form.valid) {
      this.storyCreated.emit(this.form.value as Partial<LoungeStory>);
    }
  }

  onClose() {
    this.close.emit();
  }
} 