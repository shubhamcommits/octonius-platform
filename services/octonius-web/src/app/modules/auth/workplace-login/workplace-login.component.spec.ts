import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkplaceLoginComponent } from './workplace-login.component';

describe('WorkplaceLoginComponent', () => {
  let component: WorkplaceLoginComponent;
  let fixture: ComponentFixture<WorkplaceLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkplaceLoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkplaceLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
