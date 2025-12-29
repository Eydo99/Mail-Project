import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FoldersPageComponent } from './folders-page.component';

describe('FoldersPageComponent', () => {
  let component: FoldersPageComponent;
  let fixture: ComponentFixture<FoldersPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoldersPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FoldersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
