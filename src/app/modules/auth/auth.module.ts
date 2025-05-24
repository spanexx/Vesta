import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from '../../components/login/login.component';
import { RegisterComponent } from '../../components/register/register.component';
import { LogoutComponent } from '../../components/logout/logout.component';
import { ActivationComponent } from '../../components/activation/activation.component';
import { authGuard } from '../../guards/auth.guard';
import { ROUTES } from '../../core/constants/routes.constants';

const routes: Routes = [
  { 
    path: '', 
    children: [
      { path: ROUTES.LOGIN, component: LoginComponent },
      { path: ROUTES.REGISTER, component: RegisterComponent },
      { path: ROUTES.LOGOUT, component: LogoutComponent },
      { 
        path: ROUTES.ACTIVATION, 
        component: ActivationComponent, 
        canActivate: [authGuard],
        data: {
          title: 'Account Activation',
          breadcrumb: 'Activation'
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
export class AuthModule { }
