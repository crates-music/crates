import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrateListComponent } from './crate-list.component';

describe('CrateListComponent', () => {
  let component: CrateListComponent;
  let fixture: ComponentFixture<CrateListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CrateListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrateListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
