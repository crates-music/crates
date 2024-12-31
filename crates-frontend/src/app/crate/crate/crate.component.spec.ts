import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrateComponent } from './crate.component';

describe('CrateComponent', () => {
  let component: CrateComponent;
  let fixture: ComponentFixture<CrateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CrateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
