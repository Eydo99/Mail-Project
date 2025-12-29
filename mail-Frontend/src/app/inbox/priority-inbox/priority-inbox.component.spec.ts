import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriorityInboxComponent } from './priority-inbox.component';

describe('PriorityInboxComponent', () => {
  let component: PriorityInboxComponent;
  let fixture: ComponentFixture<PriorityInboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriorityInboxComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PriorityInboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
