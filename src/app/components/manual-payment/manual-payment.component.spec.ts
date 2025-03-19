import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualPaymentComponent } from './manual-payment.component';

describe('ManualPaymentComponent', () => {
  let component: ManualPaymentComponent;
  let fixture: ComponentFixture<ManualPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManualPaymentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManualPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
