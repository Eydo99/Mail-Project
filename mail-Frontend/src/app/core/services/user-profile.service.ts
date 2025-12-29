import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment1';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  private readonly baseUrl = `${environment.apiUrl}/api/user`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/profile`,
      { withCredentials: true }
    );
  }
}
