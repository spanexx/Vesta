import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [],
  templateUrl: './location.component.html',
  styleUrl: './location.component.css'
})
export class LocationComponent implements OnInit {
  constructor(private authenticationService: AuthenticationService) { }

  ngOnInit(): void {
    const currentUser = this.authenticationService.getCurrentUser();
    console.log(currentUser);
  }
}
