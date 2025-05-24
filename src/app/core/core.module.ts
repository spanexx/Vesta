import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TitleService } from '../services/title.service';
import { BreadcrumbService } from '../services/breadcrumb.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    TitleService,
    BreadcrumbService
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule has already been loaded. Import it only in AppModule.');
    }
  }

  static forRoot() {
    return {
      ngModule: CoreModule,
      providers: []
    };
  }
}
