import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListTypeToggleComponent } from './list-type-toggle.component';

describe('ListTypeToggleComponent', () => {
  let component: ListTypeToggleComponent;
  let fixture: ComponentFixture<ListTypeToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListTypeToggleComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListTypeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
