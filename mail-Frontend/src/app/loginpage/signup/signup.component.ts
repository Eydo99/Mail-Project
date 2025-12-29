// src/app/loginpage/signup/signup.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-signup',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  isLoading = false;
  serverError: string | null = null;

  signupForm = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.pattern(/^[A-Za-z\s]+$/),
    ]),
    phoneNumber: new FormControl('', [
      Validators.required,
      Validators.pattern(/^(01)[0-9]{9}$/), // Egypt phone
    ]),
    birthDate: new FormControl('', [Validators.required]),
    email: new FormControl('', [
      Validators.required,
      Validators.email,
      Validators.pattern(/^[A-Za-z0-9._%+-]+@gmail\.com$/),
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
    confirmPassword: new FormControl('', Validators.required),
  });

  get f() {
    return this.signupForm.controls;
  }

  get passwordMismatch(): boolean {
    return (
      this.signupForm.get('password')?.value !==
      this.signupForm.get('confirmPassword')?.value
    );
  }

  onSubmit() {
  if (this.signupForm.invalid || this.passwordMismatch || this.isLoading) {
    this.signupForm.markAllAsTouched();
    return;
  }

  this.isLoading = true;
  this.serverError = null;

  const fullName = this.f.name.value!.trim();
  const [firstName, ...rest] = fullName.split(' ');
  const lastName = rest.join(' ') || '';

  const signupRequest = {
    firstName,
    lastName,
    email: this.f.email.value!,
    password: this.f.password.value!,
    phoneNumber: this.f.phoneNumber.value!,
    birthDate: this.f.birthDate.value!,
  };

  this.auth.signup(signupRequest).subscribe({
    next: () => {
      this.isLoading = false;
      alert('Account created successfully! Please login.');
      this.router.navigate(['/login']);
    },
    error: (err) => {
      this.isLoading = false;
      this.serverError =
        err.error?.message || 'Account creation failed. Try again.';
    },
  });
}

}
