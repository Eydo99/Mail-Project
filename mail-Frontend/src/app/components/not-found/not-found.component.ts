// not-found.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Home, Mail, AlertCircle } from 'lucide-angular';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl:'./not-found.component.html',
  styleUrl: './not-found.component.css'
})
export class NotFoundComponent implements OnInit {
  readonly Home = Home;
  readonly Mail = Mail;
  readonly AlertCircle = AlertCircle;

  isLoggedIn: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkLoginStatus();
  }

  /**
   * Check if user is logged in
   */
  checkLoginStatus(): void {
    // Check if there's a session or token
    // Adjust this based on your authentication method
    const currentUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
    this.isLoggedIn = !!currentUser;
  }

  /**
   * Navigate to inbox if logged in, otherwise to login
   */
  goToInboxOrLogin(): void {
    if (this.isLoggedIn) {
      this.router.navigate(['/inbox']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  /**
   * Go back to previous page
   */
  goBack(): void {
    window.history.back();
  }

  /**
   * Navigate to specific route
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
