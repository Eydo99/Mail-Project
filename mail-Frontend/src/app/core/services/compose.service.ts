import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ComposeData {
  isReplyMode: boolean;
  isForwardMode: boolean;
  isDraftMode: boolean;
  isEditDraftMode: boolean;
  draftId?: string;
  replyToEmail: string;
  originalSubject: string;
  originalBody: string;
  originalPriority?: string;
  originalAttachments?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ComposeService {
  private composeOpenSubject = new BehaviorSubject<boolean>(false);
  composeOpen$ = this.composeOpenSubject.asObservable();

private composeDataSubject = new BehaviorSubject<ComposeData>({
  isReplyMode: false,
  isForwardMode: false,
  isDraftMode: false,
  isEditDraftMode: false,
  replyToEmail: '',
  originalSubject: '',
  originalBody: ''
});
  composeData$ = this.composeDataSubject.asObservable();

  openCompose(): void {
  this.composeDataSubject.next({
    isReplyMode: false,
    isForwardMode: false,
    isDraftMode: false,
    isEditDraftMode: false,
    replyToEmail: '',
    originalSubject: '',
    originalBody: ''
  });
  this.composeOpenSubject.next(true);
}


  openReply(senderEmail: string, subject: string, body: string): void {
  this.composeDataSubject.next({
    isReplyMode: true,
    isForwardMode: false,
    isDraftMode: false,
    isEditDraftMode: false,
    replyToEmail: senderEmail,
    originalSubject: subject,
    originalBody: body
  });
  this.composeOpenSubject.next(true);
}

  openForward(subject: string, body: string, attachments?: any[]): void {
  this.composeDataSubject.next({
    isReplyMode: false,
    isForwardMode: true,
    isDraftMode: false,
    isEditDraftMode: false,
    replyToEmail: '',
    originalSubject: subject,
    originalBody: body ,
    originalAttachments: attachments // ✅ Add this line
  });
  this.composeOpenSubject.next(true);
}
openDraft(draftId: string, subject: string, body: string, priority: string, attachments?: any[]): void {
  this.composeDataSubject.next({
    isReplyMode: false,
    isForwardMode: false,
    isDraftMode: true,
    isEditDraftMode: false,
    draftId: draftId,
    replyToEmail: '',
    originalSubject: subject,
    originalBody: body,
    originalPriority: priority,
    originalAttachments: attachments
  });
  this.composeOpenSubject.next(true);
}
openEditDraft(draftId: string, subject: string, body: string, priority: string, attachments?: any[]): void {
  this.composeDataSubject.next({
    isReplyMode: false,
    isForwardMode: false,
    isDraftMode: false,
    isEditDraftMode: true,
    draftId: draftId,
    replyToEmail: '',
    originalSubject: subject,
    originalBody: body,
    originalPriority: priority,
    originalAttachments: attachments
  });
  this.composeOpenSubject.next(true);
}

  closeCompose(): void {
    this.composeOpenSubject.next(false);
  }
}
