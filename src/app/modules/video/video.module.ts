import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { VideoUploadComponent } from '../../components/video-upload/video-upload.component';
import { authGuard } from '../../guards/auth.guard';
import { ROUTES } from '../../core/constants/routes.constants';

const routes: Routes = [
  { 
    path: '', 
    component: VideoUploadComponent,
    canActivate: [authGuard],
    data: {
      title: 'Video Upload',
      breadcrumb: 'Upload Video'
    }
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
export class VideoModule { }
