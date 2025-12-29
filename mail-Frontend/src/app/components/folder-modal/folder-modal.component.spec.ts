import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderModalComponent } from './folder-modal.component';

describe('FolderModalComponent', () => {
  let component: FolderModalComponent;
  let fixture: ComponentFixture<FolderModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolderModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FolderModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
