import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IconMenuComponent } from './components/icon-menu/icon-menu.component';
import { HeaderComponent } from './components/header/header.component';
import { CustomIconComponent } from "./custom-icon/custom-icon.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, IconMenuComponent, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'vestaFrontend';
}
