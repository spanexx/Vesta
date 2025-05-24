import { inject } from '@angular/core';
import { CanDeactivateFn, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

export interface CanComponentDeactivate {
  canDeactivate: () => Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree;
}

export const formDeactivateGuard: CanDeactivateFn<CanComponentDeactivate> = 
  (component: CanComponentDeactivate) => {
    return component.canDeactivate ? component.canDeactivate() : true;
  };
