import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectWorkplaceComponent } from './select-workplace.component';

describe('SelectWorkplaceComponent', () => {
  let component: SelectWorkplaceComponent;
  let fixture: ComponentFixture<SelectWorkplaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectWorkplaceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectWorkplaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
