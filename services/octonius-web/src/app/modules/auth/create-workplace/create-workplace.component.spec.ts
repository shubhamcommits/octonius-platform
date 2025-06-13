import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWorkplaceComponent } from './create-workplace.component';

describe('CreateWorkplaceComponent', () => {
  let component: CreateWorkplaceComponent;
  let fixture: ComponentFixture<CreateWorkplaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateWorkplaceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateWorkplaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
