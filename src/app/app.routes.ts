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
    canActivate: [authGuard]
  }
];
