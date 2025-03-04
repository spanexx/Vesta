import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomIconComponent } from './custom-icon.component';

describe('CustomIconComponent', () => {
  let component: CustomIconComponent;
  let fixture: ComponentFixture<CustomIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomIconComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CustomIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
