import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BulkActionsComponent } from './bulk-actions.component';

describe('BulkActionsComponent', () => {
  let component: BulkActionsComponent;
  let fixture: ComponentFixture<BulkActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BulkActionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BulkActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
