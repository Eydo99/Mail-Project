import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  isLoading = false;
  serverError: string | null = null;

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit() {
    if (this.loginForm.invalid || this.isLoading) return;

    this.serverError = null;
    this.isLoading = true;

    console.log('🔐 Attempting login...');

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        console.log('✅ Login successful:', res);
        
        // Store user info in localStorage
        localStorage.setItem('currentUser', JSON.stringify({
          email: res.email || this.loginForm.value.email,
          message: res.message
        }));
        
        this.isLoading = false;
        
        // Navigate to inbox
        console.log('🚀 Navigating to inbox...');
        this.router.navigate(['/inbox']);
      },
      error: (err) => {
        console.error('❌ Login failed:', err);
        this.isLoading = false;
        this.serverError = err.error?.message || 'Invalid email or password.';
      },
    });
  }
}