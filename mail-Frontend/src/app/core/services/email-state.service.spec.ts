import { TestBed } from '@angular/core/testing';

import { EmailStateService } from './email-state.service';

describe('EmailStateService', () => {
  let service: EmailStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmailStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
