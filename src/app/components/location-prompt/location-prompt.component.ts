import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-location-prompt',
  standalone: true,
  imports: [],
  templateUrl: './location-prompt.component.html',
  styleUrls: ['./location-prompt.component.css']
})
export class LocationPromptComponent {

  constructor(private dialogRef: MatDialogRef<LocationPromptComponent>) {}

  onNo() { this.dialogRef.close(false); }
  onYes() { this.dialogRef.close(true); }
}
