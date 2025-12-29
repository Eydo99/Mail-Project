import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  console.log('🔒 Auth Guard: Checking authentication...');
  
  // First check localStorage
  const currentUser = localStorage.getItem('currentUser');
  
  if (!currentUser) {
    console.log('❌ Auth Guard: No user in localStorage');
    router.navigate(['/login']);
    return false;
  }
  
  console.log('✅ Auth Guard: User found in localStorage:', currentUser);
  console.log('🔄 Auth Guard: Validating session with backend...');
  
  // User exists in localStorage, verify session with backend
  return authService.validateSession().pipe(
    map((response) => {
      console.log('✅ Auth Guard: Backend validation successful', response);
      return true;
    }),
    catchError((error) => {
      console.error('❌ Auth Guard: Backend validation failed', error);
      console.log('🗑️ Auth Guard: Clearing localStorage and redirecting to login');
      localStorage.removeItem('currentUser');
      router.navigate(['/login']);
      return of(false);
    })
  );
};