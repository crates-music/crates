import { TestBed } from '@angular/core/testing';

import { CrateService } from './crate.service';

describe('CrateService', () => {
  let service: CrateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CrateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
