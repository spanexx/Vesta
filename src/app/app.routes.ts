import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UpdateProfileComponent } from './components/update-profile/update-profile.component';
import { ProfileDetailComponent } from './components/profile-detail/profile-detail.component';
import { LogoutComponent } from './components/logout/logout.component';
import { authGuard } from './guards/auth.guard';
import { ProfileSettingsComponent } from './components/profile-settings/profile-settings.component';
import { PaymentComponent } from './components/payment/payment.component';
import { PricingComponent } from './components/pricing/pricing.component';
import { VideoUploadComponent } from './components/video-upload/video-upload.component';
import { ActivationComponent } from './components/activation/activation.component';
import { VideoPaymentComponent } from './components/video-payment/video-payment.component';
import { adminGuard } from './guards/admin.guard';
import { AdminLoginComponent } from './components/admin/admin-login/admin-login.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminModerationComponent } from './components/admin/admin-moderation/admin-moderation.component';
import { AdminAnalyticsComponent } from './components/admin/admin-analytics/admin-analytics.component';
import { AdminEditUserComponent } from './components/admin/admin-edit-user/admin-edit-user.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'update-profile', 
    component: UpdateProfileComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'profile/:id', 
    component: ProfileDetailComponent,
  },
  {
    path: 'logout',
    component: LogoutComponent
  },
  { path: 'settings', 
    component: ProfileSettingsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'payment',
    component: PaymentComponent,
    canActivate: [authGuard]
  },
  {
    path: 'pricing',
    component: PricingComponent,
    
  },
  {
    path: 'video-upload',
    component: VideoUploadComponent,
    // canActivate: [authGuard]
  },
  {
    path: 'activation',
    component: ActivationComponent,
    canActivate: [authGuard]
  },
  {
    path: 'video-payment',
    component: VideoPaymentComponent,
    canActivate: [authGuard]
  },
  // Admin routes
  { 
    path: 'admin/login', 
    component: AdminLoginComponent 
  },
  { 
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'moderation', component: AdminModerationComponent },
      { path: 'analytics', component: AdminAnalyticsComponent },
      { path: 'users/:userId/edit', component: AdminEditUserComponent }
    ]
  }
];
