import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IconMenuComponent } from './components/icon-menu/icon-menu.component';
import { HeaderComponent } from './components/header/header.component';
import { CustomIconComponent } from "./custom-icon/custom-icon.component";
import { AuthenticationService } from './services/authentication.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, IconMenuComponent, HeaderComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  showCookieConsent = false;

  constructor(private authService: AuthenticationService) {}

  ngOnInit() {
    // Check if user has already responded to cookie consent
    const consent = localStorage.getItem('cookie_consent');
    this.showCookieConsent = consent === null;
  }

  acceptCookies() {
    this.authService.setCookieConsent(true);
    this.showCookieConsent = false;
  }

  declineCookies() {
    this.authService.setCookieConsent(false);
    this.showCookieConsent = false;
  }
}
