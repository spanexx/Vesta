import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ProfileDetailComponent } from '../../components/profile-detail/profile-detail.component';
import { UpdateProfileComponent } from '../../components/update-profile/update-profile.component';
import { ProfileSettingsComponent } from '../../components/profile-settings/profile-settings.component';
import { authGuard } from '../../guards/auth.guard';
import { ROUTES } from '../../core/constants/routes.constants';

const routes: Routes = [
  { 
    path: '', 
    children: [
      { 
        path: ':id', 
        component: ProfileDetailComponent,
        data: {
          title: 'User Profile',
          breadcrumb: 'Profile'
        }
      },
      { 
        path: 'update', 
        component: UpdateProfileComponent,
        canActivate: [authGuard],
        data: {
          title: 'Update Profile',
          breadcrumb: 'Update Profile'
        }
      },
      { 
        path: 'settings', 
        component: ProfileSettingsComponent,
        canActivate: [authGuard],
        data: {
          title: 'Profile Settings',
          breadcrumb: 'Settings'
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
export class ProfileModule { }
