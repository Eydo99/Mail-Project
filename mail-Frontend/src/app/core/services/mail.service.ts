import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Email } from '../models/email.model';
import { Attachment } from "../models/attachment";
import { environment } from "../../../environments/environment1";
import {FilterCriteria} from "../models/FilterCriteria"
import { interval, Subscription,Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MailService {
  private apiUrl = `${environment.apiUrl}/api/mail`;

  // Separate subjects for each folder
  private inboxEmailsSubject = new BehaviorSubject<Email[]>([]);
  private sentEmailsSubject = new BehaviorSubject<Email[]>([]);
  private draftEmailsSubject = new BehaviorSubject<Email[]>([]);
  private trashEmailsSubject = new BehaviorSubject<Email[]>([]);
  private starredEmailsSubject = new BehaviorSubject<Email[]>([]);
  private newEmailNotification = new Subject<void>();
// Track pending updates per folder
  private hasPendingUpdatesMap = new Map<string, BehaviorSubject<boolean>>([
    ['inbox', new BehaviorSubject<boolean>(false)],
    ['sent', new BehaviorSubject<boolean>(false)],
    ['draft', new BehaviorSubject<boolean>(false)],
    ['trash', new BehaviorSubject<boolean>(false)],
    ['starred', new BehaviorSubject<boolean>(false)]
  ]);

  private pendingInboxEmails: Email[] = [];
  private pendingSentEmails: Email[] = [];
  private pendingDraftEmails: Email[] = [];
  private pendingTrashEmails: Email[] = [];
  private pendingStarredEmails: Email[] = [];

  // Public observables
  public inboxEmails$ = this.inboxEmailsSubject.asObservable();
  public sentEmails$ = this.sentEmailsSubject.asObservable();
  public draftEmails$ = this.draftEmailsSubject.asObservable();
  public trashEmails$ = this.trashEmailsSubject.asObservable();
  public starredEmails$ = this.starredEmailsSubject.asObservable();
  public newEmail$ = this.newEmailNotification.asObservable();
  /**
   * Get pending updates observable for a specific folder
   */
  getPendingUpdates$(folder: string): Observable<boolean> {
    const subject = this.hasPendingUpdatesMap.get(folder);
    return subject ? subject.asObservable() : new BehaviorSubject<boolean>(false).asObservable();
  }

  // Keep for backward compatibility
  public emails$ = this.inboxEmails$;
  private pendingUpdatesMap = new Map<string, boolean>();
  // Polling configuration
  private pollingInterval = 5000; // 5 seconds
  private pollingSubscription?: Subscription;
  private currentFolder: string = 'inbox';
  private currentSort: string = 'date-desc';
  private currentFilters: any = {};

  constructor(private http: HttpClient) {
    this.loadInboxEmails();
  }

  /**
   * Map backend DTO to frontend Email model
   */
  private mapBackendToFrontend(backendEmails: any[]): Email[] {
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
      attachments: email.attachments || [] ,
      folder: email.folder || 'inbox'
    }));
  }

  /**
   * Extract sender name from email
   */
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

  /**
   * Load inbox emails from backend (initial load)
   */
  private loadInboxEmails(): void {
    this.http.post<any[]>(`${this.apiUrl}/inbox`, {}, {
      params: { sort: 'date-desc' },
      withCredentials: true
    }).subscribe({
      next: emails => this.inboxEmailsSubject.next(this.mapBackendToFrontend(emails)),
      error: err => console.error('Error loading inbox emails:', err),
    });
  }

  /**
   * Get emails for a specific folder (returns observable)
   */
  getEmails(folder: string = 'inbox'): Observable<Email[]> {
    switch (folder) {
      case 'inbox':
        return this.inboxEmails$;
      case 'sent':
        return this.sentEmails$;
      case 'draft':
        return this.draftEmails$;
      case 'trash':
        return this.trashEmails$;
      case 'starred':
        return this.starredEmails$;
      default:
        return this.inboxEmails$;
    }
  }

  /**
   * Refresh folder with filtering and sorting (NEW - uses backend)
   */
  refreshFolder(folder: string, sort: string = 'date-desc', filters?: any): Observable<Email[]> {
    return this.http.post<any[]>(`${this.apiUrl}/${folder}`, filters || {}, {
      params: { sort },
      withCredentials: true
    }).pipe(
      map(emails => this.mapBackendToFrontend(emails)),
      tap(emails => {
        switch (folder) {
          case 'inbox':
            this.inboxEmailsSubject.next(emails);
            break;
          case 'sent':
            this.sentEmailsSubject.next(emails);
            break;
          case 'draft':
            this.draftEmailsSubject.next(emails);
            break;
          case 'trash':
            this.trashEmailsSubject.next(emails);
            break;
          case 'starred':
            this.starredEmailsSubject.next(emails);
            break;
        }
      })
    );
  }



  /**
   * Get inbox emails with filters and sorting
   */
  getInboxEmails(sort: string = 'date-desc', filters?: any): Observable<Email[]> {
    return this.refreshFolder('inbox', sort, filters);
  }



  /**
   * Get inbox emails sorted by priority (using backend Priority Queue)
   */
  getInboxEmailsByPriority(): Observable<Email[]> {
    return this.http.get<any[]>(`${this.apiUrl}/inbox/priority`, {
      withCredentials: true
    }).pipe(
      map(emails => this.mapBackendToFrontend(emails)),
      tap(emails => this.inboxEmailsSubject.next(emails))
    );
  }

  /**
   * Get sent emails with filters and sorting
   */
  getSentEmails(sort: string = 'date-desc', filters?: any): Observable<Email[]> {
    return this.refreshFolder('sent', sort, filters);
  }

  /**
   * Get draft emails with filters and sorting
   */
  getDraftEmails(sort: string = 'date-desc', filters?: any): Observable<Email[]> {
    return this.refreshFolder('draft', sort, filters);
  }

  /**
   * Get trash emails with filters and sorting
   */
  getTrashEmails(sort: string = 'date-desc', filters?: any): Observable<Email[]> {
    return this.refreshFolder('trash', sort, filters);
  }

  /**
   * Search custom folder emails with filtering and sorting
   */
  searchCustomFolderEmails(
    folderId: string,
    sort: string = 'date-desc',
    filters?: FilterCriteria
  ): Observable<Email[]> {
    const params = new HttpParams().set('sort', sort);

    return this.http.post<any[]>(
      `${this.apiUrl}/folder/${folderId}/search`,
      filters || {},
      {
        params: params,
        withCredentials: true
      }
    ).pipe(
      map(emails => this.mapBackendToFrontend(emails))
    );
  }

  /**
 * Get starred emails with filters and sorting
 */
getStarredEmails(sort: string = 'date-desc', filters?: any): Observable<Email[]> {
  return this.refreshFolder('starred', sort, filters);
}

  /**
   * Refresh starred emails
   */
  refreshStarredEmails(sort: string = 'date-desc', filters?: any): Observable<Email[]> {
    return this.getStarredEmails(sort, filters);
  }

  /**
   * Refresh emails from backend (backward compatibility)
   */
  refreshEmails(): Observable<Email[]> {
    return this.getInboxEmails();
  }

  /**
   * Get specific email by ID
   */
  getEmailById(id: string, folder: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}?folder=${folder}`, {
      withCredentials: true
    });
  }
  /**
   * Toggle star status - FIXED VERSION
   * Properly refreshes both the current folder and starred folder
   */
  toggleStar(emailId: string, folder: string = 'inbox'): Observable<any> {
    console.log(`⭐ Toggling star for email ${emailId} in folder ${folder}`);

    return this.http.put(`${this.apiUrl}/${emailId}/star?folder=${folder}`, {}, {
      withCredentials: true
    }).pipe(
      tap({
        next: () => {
          console.log(`✅ Star toggled successfully for email ${emailId}`);

          // CRITICAL: Refresh the folder where the email exists
          // This ensures the star change persists when you navigate back
          this.refreshFolder(folder, 'date-desc').subscribe({
            next: () => console.log(`✅ Refreshed ${folder} folder`),
            error: (err) => console.error(`❌ Failed to refresh ${folder}:`, err)
          });

          // CRITICAL: Also refresh starred folder to update the starred view
          this.refreshFolder('starred', 'date-desc').subscribe({
            next: () => console.log(`✅ Refreshed starred folder`),
            error: (err) => console.error(`❌ Failed to refresh starred:`, err)
          });
        },
        error: (error) => {
          console.error('❌ Error toggling star:', error);
        }
      })
    );
  }

  /**
   * Mark email as read
   */
  markAsRead(emailId: string): void {
    const emails = this.inboxEmailsSubject.value;
    const email = emails.find(e => e.id === emailId);
    if (email) {
      this.inboxEmailsSubject.next([...emails]);
    }
  }

  /**
   * Compose/send a new email
   */
  /**
   * Compose/send a new email
   */
  composeMail(email: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/compose`, email, {
      withCredentials: true
    }).pipe(
      tap(() => {
        console.log('📧 Email sent - refreshing sent folder and notifying system');

        // ✅ CRITICAL: Refresh the sent folder immediately so it appears in the sent list
        this.refreshFolder('sent', 'date-desc').subscribe({
          next: () => console.log('✅ Sent folder refreshed'),
          error: (err) => console.error('❌ Failed to refresh sent folder:', err)
        });

        // Notify that email was sent - recipients should refresh their inbox
        this.newEmailNotification.next();
      })
    );
  }

  /**
   * Save email as draft
   */
  saveDraft(email: any): Observable<string> {
    return this.http.post(`${this.apiUrl}/draft/save`, email, {
      responseType: 'text',
      withCredentials: true
    });
  }

  /**
   * Delete an email
   */
  deleteEmail(emailId: string, folder: string): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${emailId}?folder=${folder}`, {
      responseType: 'text',
      withCredentials: true
    });
  }

  /**
   * Move email to another folder
   */
  moveEmail(emailId: string, fromFolder: string, toFolder: string): Observable<string> {
    return this.http.put(
      `${this.apiUrl}/${emailId}/move?fromFolder=${fromFolder}&toFolder=${toFolder}`,
      {},
      {
        responseType: 'text',
        withCredentials: true
      }
    );
  }

  /**
   * Get attachment file URL for viewing/downloading
   */
  getAttachmentUrl(filePath: string): string {
    const filename = filePath.split('/').pop() || filePath;
    const encodedFilename = encodeURIComponent(filename);
    return `http://localhost:8080/api/attachments/uploads/${encodedFilename}`;
  }

  /**
   * Download attachment
   */
  downloadAttachment(attachment: Attachment): void {
    const url = this.getAttachmentUrl(attachment.filePath);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * View attachment (open in new tab)
   */
  viewAttachment(attachment: Attachment): void {
    const url = this.getAttachmentUrl(attachment.filePath);
    window.open(url, '_blank');
  }

  /**
   * Format file size to human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get icon for file type
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'assets/icons/pdf.png';
    if (mimeType.includes('image')) return 'assets/icons/image.png';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'assets/icons/doc.png';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'assets/icons/excel.png';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'assets/icons/zip.png';
    return 'assets/icons/file.png';
  }

  /**
   * Get the BehaviorSubject for a specific folder
   */
  private getSubjectByFolder(folder: string): BehaviorSubject<Email[]> {
    switch (folder) {
      case 'inbox':
        return this.inboxEmailsSubject;
      case 'sent':
        return this.sentEmailsSubject;
      case 'draft':
        return this.draftEmailsSubject;
      case 'trash':
        return this.trashEmailsSubject;
      case 'starred':
        return this.starredEmailsSubject;
      default:
        return this.inboxEmailsSubject;
    }
  }


  /**
   * Start automatic polling for a folder
   */
  startPolling(folder: string, sort: string = 'date-desc', filters?: any): void {
    console.log(`🔄 Starting polling for ${folder}`);

    this.stopPolling();
    this.currentFolder = folder;
    this.currentSort = sort;
    this.currentFilters = filters || {};

    // Fetch immediately and display
    this.refreshFolder(folder, sort, filters).subscribe();

    // Then poll at intervals - but HOLD results
    this.pollingSubscription = interval(this.pollingInterval)
      .pipe(
        switchMap(() => {
          return this.http.post<any[]>(`${this.apiUrl}/${folder}`, filters || {}, {
            params: { sort },
            withCredentials: true
          }).pipe(
            map(emails => this.mapBackendToFrontend(emails))
          );
        })
      )
      .subscribe({
        next: (newEmails) => {
          console.log(`🔍 Polling found ${newEmails.length} emails`);

          // Get current displayed emails
          const currentSubject = this.getSubjectByFolder(folder);
          const currentEmails = currentSubject.value;

          // Check if there are NEW emails
          if (newEmails.length > currentEmails.length) {
            console.log(`🔔 ${newEmails.length - currentEmails.length} new emails detected - HOLDING`);

            // Store pending emails (don't display yet)
            this.storePendingEmails(folder, newEmails);
          } else {
            console.log('✅ No new emails');
          }
        },
        error: (error) => {
          console.error('❌ Polling error:', error);
        }
      });
  }


  // ADD method to store pending emails:
  private storePendingEmails(folder: string, emails: Email[]): void {
    switch (folder) {
      case 'inbox':
        this.pendingInboxEmails = emails;
        break;
      case 'sent':
        this.pendingSentEmails = emails;
        break;
      case 'draft':
        this.pendingDraftEmails = emails;
        break;
      case 'trash':
        this.pendingTrashEmails = emails;
        break;
      case 'starred':
        this.pendingStarredEmails = emails;
        break;
    }

    // ✅ Notify only the specific folder
    const subject = this.hasPendingUpdatesMap.get(folder);
    if (subject) {
      subject.next(true);
    }
  }

// ADD method to get pending emails:
  private getPendingEmails(folder: string): Email[] {
    switch (folder) {
      case 'inbox':
        return this.pendingInboxEmails;
      case 'sent':
        return this.pendingSentEmails;
      case 'draft':
        return this.pendingDraftEmails;
      case 'trash':
        return this.pendingTrashEmails;
      case 'starred':
        return this.pendingStarredEmails;
      default:
        return [];
    }
  }

  applyPendingEmails(folder: string): void {
    const pendingEmails = this.getPendingEmails(folder);

    if (pendingEmails.length > 0) {
      console.log(`✅ Applying ${pendingEmails.length} pending emails to ${folder}`);

      const subject = this.getSubjectByFolder(folder);
      subject.next(pendingEmails);

      // Clear pending
      this.storePendingEmails(folder, []);

      // ✅ Clear notification for this specific folder
      const pendingSubject = this.hasPendingUpdatesMap.get(folder);
      if (pendingSubject) {
        pendingSubject.next(false);
      }
    }
  }
  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollingSubscription) {
      console.log('🛑 Stopping polling');
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  /**
   * Fetch emails immediately (for manual refresh)
   */
  fetchEmails(folder: string, sort: string = 'date-desc', filters?: any): void {
    this.refreshFolder(folder, sort, filters).subscribe({
      next: (emails) => {
        console.log(`✅ Fetched ${emails.length} emails from ${folder}`);
      },
      error: (error) => {
        console.error('❌ Error fetching emails:', error);
      }
    });
  }

  /**
   * Manual refresh (triggers immediate fetch)
   */
  // UPDATE refreshNow method to apply pending emails:
  refreshNow(folder: string, sort: string = 'date-desc', filters?: any): void {
    console.log(`🔄 Manual refresh triggered for ${folder}`);

    // Clear the notification immediately for this folder
    const pendingSubject = this.hasPendingUpdatesMap.get(folder);
    if (pendingSubject) {
      pendingSubject.next(false);
    }

    // Apply any pending emails first
    this.applyPendingEmails(folder);

    // Then fetch fresh data
    this.fetchEmails(folder, sort, filters);
  }
}
