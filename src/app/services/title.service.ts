import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TitleService {
  private baseTitle = 'Vesta';

  constructor(
    private title: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  initializeTitleListener(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route;
      }),
      filter(route => route.outlet === 'primary'),
      mergeMap(route => route.data)
    ).subscribe(data => {
      if (data['title']) {
        this.title.setTitle(`${this.baseTitle} - ${data['title']}`);
      } else {
        this.title.setTitle(this.baseTitle);
      }
    });
  }

  setTitle(title: string): void {
    this.title.setTitle(`${this.baseTitle} - ${title}`);
  }
}
