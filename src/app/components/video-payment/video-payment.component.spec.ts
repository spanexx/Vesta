import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoPaymentComponent } from './video-payment.component';

describe('VideoPaymentComponent', () => {
  let component: VideoPaymentComponent;
  let fixture: ComponentFixture<VideoPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoPaymentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VideoPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
