import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, DashboardStats } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-home.component.html',
  styleUrls: ['./admin-home.component.css']
})
export class AdminHomeComponent implements OnInit {
  stats: DashboardStats = {
    totalUsers: 0,
    activeUsers: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
    recentSignups: 0,
    premiumUsers: 0
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  private loadDashboardStats(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (stats: DashboardStats) => this.stats = stats,
      error: (error: Error) => console.error('Error loading dashboard stats:', error)
    });
  }
}
