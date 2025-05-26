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
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminModerationComponent } from './components/admin/admin-moderation/admin-moderation.component';
import { AdminAnalyticsComponent } from './components/admin/admin-analytics/admin-analytics.component';
import { AdminEditUserComponent } from './components/admin/admin-edit-user/admin-edit-user.component';
import { AdminHomeComponent } from './components/admin/admin-home/admin-home.component';
import { AdminLayoutComponent } from './components/admin/admin-layout/admin-layout.component';
import { ManualPaymentComponent } from './components/manual-payment/manual-payment.component';
import { AdminManualPayersComponent } from './components/admin/admin-manual-payers/admin-manual-payers.component';
import { AdminManualPaymentDetailComponent } from './components/admin/admin-manual-payment-detail/admin-manual-payment-detail.component';
import { AdminPendingVerificationsComponent } from './components/admin/admin-pending-verifications/admin-pending-verifications.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { UnauthorizedComponent } from './components/shared/unauthorized/unauthorized.component';
import { permissionGuard } from './guards/permission.guard';

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
  {
   path: 'manual-payment',
   component: ManualPaymentComponent,
    canActivate: [authGuard]
  },
  // Admin routes
  { 
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: AdminHomeComponent },
      { path: 'dashboard', redirectTo: 'home', pathMatch: 'full' },
      { path: 'users', component: AdminUsersComponent },
      { path: 'moderation', component: AdminModerationComponent, canActivate: [() => permissionGuard('canModerateContent')] },
      { path: 'analytics', component: AdminAnalyticsComponent },
      { path: 'users/:userId/edit', component: AdminEditUserComponent, canActivate: [() => permissionGuard('canEditProfiles')] },
      { path: 'pending-verifications', component: AdminPendingVerificationsComponent }, // New route
      { path: 'manual-payers', component: AdminManualPayersComponent },
      { path: 'manual-payers/:id', component: AdminManualPaymentDetailComponent },
      { path: 'unauthorized', component: UnauthorizedComponent }
    ]
  },
  
  // Unauthorized route for regular users
  { path: 'unauthorized', component: UnauthorizedComponent },
  
  // This wildcard route should always be the last route
  { path: '**', component: NotFoundComponent }
];
