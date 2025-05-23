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

  toggleDropdown(event: MouseEvent | KeyboardEvent) {
    if (event.type === 'keydown') {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') {
        return; // Only proceed for Enter or Space
      }
      event.preventDefault(); // Prevent default space scroll
    }
    this.isDropdownOpen = !this.isDropdownOpen;
    if (event.stopPropagation) { 
      event.stopPropagation();
    }
  }

  closeMenu() {
    this.isDropdownOpen = false;
  }
}
