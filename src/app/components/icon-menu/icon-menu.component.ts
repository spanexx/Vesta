import { Component, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-icon-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './icon-menu.component.html',
  styleUrls: ['./icon-menu.component.css']
})
export class IconMenuComponent {
  isDropdownOpen = false;
  userId: string | null = null;

  constructor(
    private authService: AuthenticationService,
    private elementRef: ElementRef
  ) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userId = user._id;
      }
    });
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation(); // Prevent event from bubbling up
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeMenu() {
    this.isDropdownOpen = false;
  }
}
