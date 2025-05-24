import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PaymentComponent } from '../../components/payment/payment.component';
import { PricingComponent } from '../../components/pricing/pricing.component';
import { VideoPaymentComponent } from '../../components/video-payment/video-payment.component';
import { ManualPaymentComponent } from '../../components/manual-payment/manual-payment.component';
import { authGuard } from '../../guards/auth.guard';
import { ROUTES } from '../../core/constants/routes.constants';

const routes: Routes = [
  { 
    path: '', 
    children: [
      { 
        path: '', 
        component: PaymentComponent,
        canActivate: [authGuard],
        data: {
          title: 'Payment',
          breadcrumb: 'Payment'
        }
      },
      { 
        path: 'pricing', 
        component: PricingComponent,
        data: {
          title: 'Pricing Plans',
          breadcrumb: 'Pricing'
        }
      },
      { 
        path: 'video', 
        component: VideoPaymentComponent,
        canActivate: [authGuard],
        data: {
          title: 'Video Payment',
          breadcrumb: 'Video Payment'
        }
      },
      { 
        path: 'manual', 
        component: ManualPaymentComponent,
        canActivate: [authGuard],
        data: {
          title: 'Manual Payment',
          breadcrumb: 'Manual Payment'
        }
      }
    ]
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class PaymentModule { }
