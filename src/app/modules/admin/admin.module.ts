import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AdminHomeComponent } from '../../components/admin/admin-home/admin-home.component';
import { AdminUsersComponent } from '../../components/admin/admin-users/admin-users.component';
import { AdminModerationComponent } from '../../components/admin/admin-moderation/admin-moderation.component';
import { AdminAnalyticsComponent } from '../../components/admin/admin-analytics/admin-analytics.component';
import { AdminEditUserComponent } from '../../components/admin/admin-edit-user/admin-edit-user.component';
import { AdminManualPayersComponent } from '../../components/admin/admin-manual-payers/admin-manual-payers.component';
import { AdminManualPaymentDetailComponent } from '../../components/admin/admin-manual-payment-detail/admin-manual-payment-detail.component';
import { AdminLayoutComponent } from '../../components/admin/admin-layout/admin-layout.component';
import { AdminLoginComponent } from '../../components/admin/admin-login/admin-login.component';
import { adminGuard } from '../../guards/admin.guard';
import { ROUTES } from '../../core/constants/routes.constants';

const routes: Routes = [
  { 
    path: 'login', 
    component: AdminLoginComponent,
    data: {
      title: 'Admin Login',
      breadcrumb: 'Admin Login'
    }
  },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { 
        path: '', 
        redirectTo: 'home', 
        pathMatch: 'full' 
      },
      { 
        path: 'home', 
        component: AdminHomeComponent,
        data: {
          title: 'Admin Dashboard',
          breadcrumb: 'Dashboard'
        }
      },
      { 
        path: 'dashboard', 
        redirectTo: 'home', 
        pathMatch: 'full' 
      },
      { 
        path: 'users', 
        component: AdminUsersComponent,
        data: {
          title: 'Manage Users',
          breadcrumb: 'Users'
        }
      },
      { 
        path: 'moderation', 
        component: AdminModerationComponent,
        data: {
          title: 'Content Moderation',
          breadcrumb: 'Moderation'
        }
      },
      { 
        path: 'analytics', 
        component: AdminAnalyticsComponent,
        data: {
          title: 'Analytics',
          breadcrumb: 'Analytics'
        }
      },
      { 
        path: 'users/:userId/edit', 
        component: AdminEditUserComponent,
        data: {
          title: 'Edit User',
          breadcrumb: 'Edit User'
        }
      },
      { 
        path: 'manual-payers', 
        component: AdminManualPayersComponent,
        data: {
          title: 'Manual Payers',
          breadcrumb: 'Manual Payers'
        }
      },
      { 
        path: 'manual-payers/:id', 
        component: AdminManualPaymentDetailComponent,
        data: {
          title: 'Payment Details',
          breadcrumb: 'Payment Details'
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
export class AdminModule { }
