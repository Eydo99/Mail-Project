import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contact } from '../models/Contact';
import { Email } from '../models/EmailContacts';
import { Phone } from '../models/phoneContacts';
import { PaginatedContactResponse } from '../models/PaginatedContactResponse';
import {environment} from "../../../environments/environment1";

export interface ContactRequest {
  name: string;
  emails: Email[];
  phones: Phone[];
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}/api/contacts`;

  constructor(private http: HttpClient) {}

  getAllContacts(
    page: number = 1,
    size: number = 10,
    search?: string,
    sortBy: string = 'name'
  ): Observable<PaginatedContactResponse> {

    let params = new HttpParams()
      .set('page', (page).toString())
      .set('size', size.toString())
      .set('sortBy', sortBy);

    if (search && search.trim() !== '') {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedContactResponse>(this.apiUrl, {
      params,
      withCredentials: true
    });
  }

  createContact(request: ContactRequest): Observable<Contact> {
    return this.http.post<Contact>(this.apiUrl, request, {
      withCredentials: true
    });
  }

  updateContact(id: string, request: ContactRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, request, {
      withCredentials: true
    });
  }

  deleteContact(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      withCredentials: true
    });
  }
}
