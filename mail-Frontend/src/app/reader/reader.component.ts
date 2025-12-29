import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailStateService } from '../core/services/email-state.service';
import { Email } from '../core/models/email.model';
import { Attachment } from "../core/models/attachment";
import { MailService } from "../core/services/mail.service";
import { ComposeService } from '../core/services/compose.service';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-reader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reader.component.html',
  styleUrl: './reader.component.css'
})
export class ReaderComponent implements OnInit {
  selectedEmail: Email | null = null;
  isOpen: boolean = false;
  currentIndex: number = -1;
  totalEmails: number = 0;
  canGoNext: boolean = false;
  canGoPrevious: boolean = false;
  isDraft :boolean  = false;
  constructor(
  private emailStateService: EmailStateService,
  private mailService: MailService,
  private composeService: ComposeService,
  private router :Router

  ) {}

  ngOnInit(): void {
  // Check if current URL is draft folder
  this.isDraft = this.router.url.includes('/draft');
  console.log('Is draft folder:', this.isDraft, 'URL:', this.router.url);
    this.router.events.subscribe(() => {
    this.isDraft = this.router.url.includes('/draft');
  });
  this.emailStateService.selectedEmail$.subscribe(email => {
    this.selectedEmail = email;
    this.updateNavigationState();
  });

  this.emailStateService.readerOpen$.subscribe(isOpen => {
    this.isOpen = isOpen;
  });

  this.emailStateService.currentIndex$.subscribe(index => {
    this.currentIndex = index;
    this.updateNavigationState();
  });

  this.emailStateService.currentEmailList$.subscribe(list => {
    this.totalEmails = list.length;
    this.updateNavigationState();
  });
}

  updateNavigationState(): void {
    this.canGoNext = this.emailStateService.canNavigateNext();
    this.canGoPrevious = this.emailStateService.canNavigatePrevious();
  }

  closeReader(): void {
    this.emailStateService.closeReader();
  }

  onNextEmail(): void {
    this.emailStateService.navigateToNext();
  }

  onPreviousEmail(): void {
    this.emailStateService.navigateToPrevious();
  }

onReply(): void {
  if (this.selectedEmail) {
    this.composeService.openReply(
      this.selectedEmail.senderEmail,
      this.selectedEmail.subject,
      this.selectedEmail.body
    );
  }
}

  onForward(): void {
  if (this.selectedEmail) {
    this.composeService.openForward(
      this.selectedEmail.subject,
      this.selectedEmail.body,
      this.selectedEmail.attachments
    );
  }
}
onSendDraft(): void {
  if (this.selectedEmail) {
    const priorityMap: { [key: number]: string } = {
      1: 'urgent',
      2: 'high',
      3: 'normal',
      4: 'low'
    };

    const priorityString = this.selectedEmail.priority
      ? priorityMap[this.selectedEmail.priority] || 'normal'
      : 'normal';

    this.composeService.openDraft(
      this.selectedEmail.id,
      this.selectedEmail.subject,
      this.selectedEmail.body,
      priorityString,
      this.selectedEmail.attachments
    );
  }
}
onEditDraft(): void {
  if (this.selectedEmail) {
    const priorityMap: { [key: number]: string } = {
      1: 'urgent',
      2: 'high',
      3: 'normal',
      4: 'low'
    };

    const priorityString = this.selectedEmail.priority
      ? priorityMap[this.selectedEmail.priority] || 'normal'
      : 'normal';

    this.composeService.openEditDraft(
      this.selectedEmail.id,
      this.selectedEmail.subject,
      this.selectedEmail.body,
      priorityString,
      this.selectedEmail.attachments
    );
  }
}

  onViewAttachment(attachment: Attachment): void {
    this.mailService.viewAttachment(attachment);
  }

  onDownloadAttachment(attachment: Attachment): void {
    this.mailService.downloadAttachment(attachment);
  }

  getFileIcon(mimeType: string): string {
    return this.mailService.getFileIcon(mimeType);
  }

  formatFileSize(bytes: number): string {
    return this.mailService.formatFileSize(bytes);
  }

  onDelete(): void {
    console.log('Delete:', this.selectedEmail?.id);
    // TODO: Implement delete
    this.closeReader();
  }

  debugAttachment(attachment: Attachment): void {
    console.log('Attachment details:', {
      filename: attachment.filename,
      filePath: attachment.filePath,
      url: this.mailService.getAttachmentUrl(attachment.filePath)
    });
  }
}
