// app/core/services/folder.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, map, Observable, switchMap } from 'rxjs';
import { Email } from '../models/email.model';
import { MailService } from './mail.service';
import { environment } from "../../../environments/environment1";

export interface FolderData {
  id?: string;
  name: string;
  description?: string;
  color: string;
  emailCount?: number;
}

export interface FolderRequest {
  name: string;
  description?: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class FolderService {
  // FIX: Correct API URLs
  private foldersApiUrl = `${environment.apiUrl}/api/folders`;
  private mailApiUrl = `${environment.apiUrl}/api/mail`;

  constructor(private http: HttpClient, private mailService: MailService) {}

  getAllFolders(): Observable<FolderData[]> {
    return this.http.get<FolderData[]>(this.foldersApiUrl, { withCredentials: true });
  }

  getFolderById(folderId: string): Observable<FolderData> {
    return this.http.get<FolderData>(`${this.foldersApiUrl}/${folderId}`, { withCredentials: true });
  }

  createFolder(request: FolderRequest): Observable<FolderData> {
    return this.http.post<FolderData>(this.foldersApiUrl, request, { withCredentials: true });
  }

  updateFolder(folderId: string, request: FolderRequest): Observable<void> {
    return this.http.put<void>(`${this.foldersApiUrl}/${folderId}`, request, { withCredentials: true });
  }

  deleteFolder(folderId: string): Observable<void> {
    return this.getEmailsByFolder(folderId).pipe(
      switchMap(emails => {
        if (!emails || emails.length === 0) {
          return this.http.delete<void>(`${this.foldersApiUrl}/${folderId}`, {
            withCredentials: true
          });
        }

        const folderParam = folderId.startsWith('folder_') ? folderId : `folder_${folderId}`;
        const deleteEmailObservables = emails.map(email =>
          this.mailService.deleteEmail(email.id, folderParam)
        );

        return forkJoin(deleteEmailObservables).pipe(
          switchMap(() =>
            this.http.delete<void>(`${this.foldersApiUrl}/${folderId}`, {
              withCredentials: true
            })
          )
        );
      })
    );
  }

  // FIX: This method now calls the correct endpoint
  getEmailsByFolder(folderId: string): Observable<Email[]> {
    console.log('🔍 FolderService: Getting emails for folder:', folderId);
    console.log('🔍 Calling:', `${this.foldersApiUrl}/${folderId}/emails`);

    return this.http.get<any[]>(`${this.foldersApiUrl}/${folderId}/emails`, {
      withCredentials: true
    }).pipe(
      map(emails => {
        console.log('✅ Received emails:', emails);
        return this.mapBackendToFrontend(emails);
      })
    );
  }

  /**
   * Search custom folder emails with filtering and sorting
   */
  searchCustomFolderEmails(
    folderId: string,
    sort: string = 'date-desc',
    filters?: any
  ): Observable<Email[]> {
    const params = new HttpParams().set('sort', sort);

    return this.http.post<any[]>(
      `${this.mailApiUrl}/folder/${folderId}`,
      filters || {},
      {
        params: params,
        withCredentials: true
      }
    ).pipe(
      map(emails => this.mapBackendToFrontend(emails))
    );
  }

  private mapBackendToFrontend(backendEmails: any[]): Email[] {
    if (!backendEmails || !Array.isArray(backendEmails)) {
      return [];
    }

    return backendEmails.map(email => ({
      id: email.id.toString(),
      sender: this.extractSenderName(email.from),
      senderEmail: email.from || 'unknown@mail.com',
      subject: email.subject,
      preview: email.preview,
      body: email.body,
      timestamp: new Date(email.timestamp),
      isStarred: email.starred,
      hasAttachment: email.hasAttachment,
      priority: email.priority,
      attachments: email.attachments || []
    }));
  }

  private extractSenderName(from: string[] | string): string {
    if (!from) return 'Unknown';
    if (typeof from === 'string') {
      const name = from.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    if (Array.isArray(from) && from.length > 0) {
      const email = from[0];
      const name = email.split('@')[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Unknown';
  }

  updateFolderCount(folderId: string, count: number): Observable<void> {
    return this.http.patch<void>(`${this.foldersApiUrl}/${folderId}/count`, { count }, {
      withCredentials: true
    });
  }

  incrementFolderCount(folderId: string, increment: number): Observable<void> {
    return this.http.patch<void>(`${this.foldersApiUrl}/${folderId}/increment`, { increment }, {
      withCredentials: true
    });
  }

  moveEmailToFolder(emailId: string, fromFolder: string, toFolderId: string): Observable<any> {
    const toFolder = toFolderId.startsWith('folder_') ? toFolderId : `folder_${toFolderId}`;
    return this.http.put(
      `${this.mailApiUrl}/${emailId}/move?fromFolder=${fromFolder}&toFolder=${toFolder}`,
      {},
      { withCredentials: true }
    );
  }

  bulkMoveToFolder(emailIds: string[], fromFolder: string, toFolderId: string): Observable<any> {
    const toFolder = toFolderId.startsWith('folder_') ? toFolderId : `folder_${toFolderId}`;
    return this.http.put(
      `${this.mailApiUrl}/bulk-move`,
      { emailIds, fromFolder, toFolder },
      { withCredentials: true }
    );
  }

  deleteEmailFromFolder(emailId: string, folderId: string): Observable<any> {
    const folder = folderId.startsWith('folder_') ? folderId : `folder_${folderId}`;
    return this.http.delete(`${this.mailApiUrl}/${emailId}?folder=${folder}`, {
      withCredentials: true
    });
  }

  bulkDeleteFromFolder(emailIds: string[], folderId: string): Observable<any> {
    const folder = folderId.startsWith('folder_') ? folderId : `folder_${folderId}`;
    return this.http.request(
      'delete',
      `${this.mailApiUrl}/bulk-delete`,
      {
        body: { emailIds, folderId: folder },
        withCredentials: true
      }
    );
  }

  markAsRead(emailId: string): Observable<any> {
    return this.http.patch(`${this.mailApiUrl}/${emailId}/read`, {}, { withCredentials: true });
  }

  toggleStar(emailId: string, folderId?: string): Observable<any> {
    const folder = folderId ? (folderId.startsWith('folder_') ? folderId : `folder_${folderId}`) : 'inbox';
    return this.http.put(`${this.mailApiUrl}/${emailId}/star?folder=${folder}`, {}, {
      withCredentials: true
    });
  }


}
