import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationButtonComponent } from './location-button.component';

describe('LocationButtonComponent', () => {
  let component: LocationButtonComponent;
  let fixture: ComponentFixture<LocationButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationButtonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LocationButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
