import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-content">
        <h1>Unauthorized Access</h1>
        <p>You don't have permission to access this resource.</p>
        <div class="buttons">
          <button routerLink="/">Return to Home</button>
          <button routerLink="/login">Log In as Different User</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f8f9fa;
    }
    
    .unauthorized-content {
      text-align: center;
      padding: 2rem;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 500px;
    }
    
    h1 {
      color: #dc3545;
      margin-bottom: 1rem;
    }
    
    p {
      margin-bottom: 2rem;
      color: #6c757d;
    }
    
    .buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
    
    button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      background-color: #007bff;
      color: white;
    }
    
    button:hover {
      background-color: #0069d9;
    }
  `]
})
export class UnauthorizedComponent {}
