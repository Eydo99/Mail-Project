import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from "../../../environments/environment1";

export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  birthDate: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  email?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  signup(payload: SignupPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/signup`, payload, {
      withCredentials: true,
    });
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload, {
      withCredentials: true,
    });
  }

  logout(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/logout`, {}, {
      withCredentials: true,
    });
  }

  validateSession(): Observable<AuthResponse> {
    console.log('📡 AuthService: Calling /validate endpoint');
    return this.http.get<AuthResponse>(`${this.baseUrl}/validate`, {
      withCredentials: true,
    });
  }
}