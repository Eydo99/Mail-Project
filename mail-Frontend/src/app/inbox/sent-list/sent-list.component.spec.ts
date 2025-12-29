import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SentListComponent } from './sent-list.component';

describe('SentListComponent', () => {
  let component: SentListComponent;
  let fixture: ComponentFixture<SentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SentListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
