import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StarredListComponent } from './starred-list.component';

describe('StarredListComponent', () => {
  let component: StarredListComponent;
  let fixture: ComponentFixture<StarredListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarredListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StarredListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
