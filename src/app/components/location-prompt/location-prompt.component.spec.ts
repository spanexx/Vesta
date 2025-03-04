import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationPromptComponent } from './location-prompt.component';

describe('LocationPromptComponent', () => {
  let component: LocationPromptComponent;
  let fixture: ComponentFixture<LocationPromptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationPromptComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LocationPromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
