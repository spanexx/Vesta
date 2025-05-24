import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ROUTES } from './core/constants/routes.constants';

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
    path: 'admin/login', 
    component: AdminLoginComponent 
  },  { 
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: AdminHomeComponent },
      { path: 'dashboard', redirectTo: 'home', pathMatch: 'full' },
      { path: 'users', component: AdminUsersComponent },
      { path: 'moderation', component: AdminModerationComponent },
      { path: 'analytics', component: AdminAnalyticsComponent },
      { path: 'users/:userId/edit', component: AdminEditUserComponent },
      { path: 'manual-payers', component: AdminManualPayersComponent },
      { path: 'manual-payers/:id', component: AdminManualPaymentDetailComponent }
    ]
  },
  
  // This wildcard route should always be the last route
  { path: '**', component: NotFoundComponent }
];
