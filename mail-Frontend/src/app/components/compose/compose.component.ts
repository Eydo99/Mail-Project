import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MailService } from '../../core/services/mail.service';
import { ComposeService } from '../../core/services/compose.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-compose',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compose.component.html',
  styleUrl: './compose.component.css'
})
export class ComposeComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  isReplyMode: boolean = false;
  isForwardMode: boolean = false;
  isDraftMode: boolean = false;
  isEditDraftMode: boolean = false;
  draftId: string | undefined;
  private composeDataSubscription?: Subscription;

  to: string = '';
  subject: string = '';
  body: string = '';
  priority: string = 'normal';
  attachments: File[] = [];
  // NEW: Store existing attachments from draft separately
  existingAttachments: any[] = [];

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';


  constructor(private mailService: MailService,
    private composeService: ComposeService

  ) { }

  ngOnInit(): void {
    this.composeDataSubscription = this.composeService.composeData$.subscribe(data => {
      this.isReplyMode = data.isReplyMode;
      this.isForwardMode = data.isForwardMode;
      this.isDraftMode = data.isDraftMode;
      this.isEditDraftMode = data.isEditDraftMode;
      this.draftId = data.draftId;

      if (data.isReplyMode) {
        this.to = data.replyToEmail;
        this.subject = data.originalSubject
          ? data.originalSubject
          : `Re: ${data.originalSubject}`;
        this.body = ``;
        this.existingAttachments = [];

      } else if (data.isForwardMode) {
        this.to = '';
        this.subject = data.originalSubject
          ? data.originalSubject
          : `Fwd: ${data.originalSubject}`;
        this.body = `${data.originalBody}`;
        this.existingAttachments = data.originalAttachments
          ? JSON.parse(JSON.stringify(data.originalAttachments))
          : [];
      } else if (data.isDraftMode) {
        this.to = '';
        this.subject = data.originalSubject;
        this.body = data.originalBody;
        this.priority = data.originalPriority || 'normal';
        // Store existing attachments from draft
        this.existingAttachments = data.originalAttachments
          ? JSON.parse(JSON.stringify(data.originalAttachments))
          : [];
      } else if (data.isEditDraftMode) {
        this.to = '';
        this.subject = data.originalSubject;
        this.body = data.originalBody;
        this.priority = data.originalPriority || 'normal';
        // Store existing attachments from draft
        this.existingAttachments = data.originalAttachments
          ? JSON.parse(JSON.stringify(data.originalAttachments))
          : [];
      } else {
        this.to = '';
        this.subject = '';
        this.body = '';
        this.attachments = [];
        this.existingAttachments = [];
        this.priority = 'normal';
      }
    });
  }
  onClose(): void {
    // Reset form state when closing
    this.attachments = [];
    this.errorMessage = '';
    this.successMessage = '';
    this.close.emit();
  }
  ngOnDestroy(): void {
    if (this.composeDataSubscription) {
      this.composeDataSubscription.unsubscribe();
    }
  }

  async onSend(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Convert priority string to number matching your DTO
    const priorityMap: { [key: string]: number } = {
      'low': 4,
      'normal': 3,
      'high': 2,
      'urgent': 1
    };

    // Split recipients by comma and trim whitespace
    const recipients = this.to.split(',').map(email => email.trim()).filter(email => email);

    // Convert attachments to DTO format
    const attachmentDTOs = await this.convertAttachments();
    // NEW: Combine existing attachments with new ones
    const newAttachmentDTOs = await this.convertAttachments();
    const allAttachments = [...this.existingAttachments, ...newAttachmentDTOs];

    // Match your mailContentDTO structure
    const mailContent = {
      body: this.body,
      subject: this.subject,
      recipients: recipients,
      attachements: allAttachments,
      piriority: priorityMap[this.priority]
    };

    console.log('Sending mail with attachments:', mailContent);

    this.mailService.composeMail(mailContent).subscribe({
      next: (response: any) => {
        console.log('Email response:', response);
        this.isLoading = false;

        if (response.status === 'success') {
          this.successMessage = `✅ Email sent successfully to all ${response.totalSent} recipient(s)!`;

          if ((this.isDraftMode || this.isEditDraftMode) && this.draftId) {
            this.deleteDraftAfterSend(this.draftId);
          } else {
            setTimeout(() => this.close.emit(), 2000);
          }
        }
        else if (response.status === 'partial') {
          const successList = response.successful.join(', ');
          const failedList = response.failed.join(', ');

          this.successMessage = `✅ Email sent successfully to: ${successList}`;
          this.errorMessage = `❌ Failed to send to: ${failedList} (not registered in the system)`;

          if ((this.isDraftMode || this.isEditDraftMode) && this.draftId) {
            this.deleteDraftAfterSend(this.draftId);
          } else {
            setTimeout(() => this.close.emit(), 2000);
          }
        }
        else if (response.status === 'failed') {
          // All failed
          const failedList = response.failed.join(', ');
          this.errorMessage = `❌ Failed to send email to: ${failedList}. These email addresses are not registered in our system.`;
        }
      },
      error: (error) => {
        console.error('Error sending email:', error);
        this.isLoading = false;

        // Handle error response
        if (error.error && error.error.message) {
          this.errorMessage = `❌ ${error.error.message}`;
        } else {
          this.errorMessage = '❌ Failed to send email. Please try again.';
        }
      }
    });
  }
  private deleteDraftAfterSend(draftId: string): void {
    this.mailService.deleteEmail(draftId, 'draft').subscribe({
      next: () => {
        console.log('Draft deleted successfully after sending');

        // Refresh the draft folder to update the list
        this.mailService.refreshFolder('draft').subscribe({
          next: () => {
            console.log('Draft folder refreshed');
          },
          error: (err) => {
            console.error('Error refreshing draft folder:', err);
          }
        });

        // Close immediately
        this.close.emit();
      },
      error: (error) => {
        console.error('Error deleting draft after send:', error);
        this.close.emit();
      }
    });
  }
  async onSaveDraft(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const priorityMap: { [key: string]: number } = {
      'low': 4,
      'normal': 3,
      'high': 2,
      'urgent': 1
    };

    const recipients = this.to.split(',').map(email => email.trim()).filter(email => email);

    // NEW: Combine existing attachments with new ones for draft
    const newAttachmentDTOs = await this.convertAttachments();
    const allAttachments = [...this.existingAttachments, ...newAttachmentDTOs];

    const mailContent = {
      body: this.body,
      subject: this.subject,
      recipients: recipients,
      attachements: allAttachments,
      piriority: priorityMap[this.priority]
    };

    // If editing an existing draft, delete the old one first
    if (this.isEditDraftMode && this.draftId) {
      this.mailService.deleteEmail(this.draftId, 'draft').subscribe({
        next: () => {
          // Save the updated draft
          this.saveDraftToServer(mailContent);
        },
        error: (error) => {
          console.error('Error deleting old draft:', error);
          this.errorMessage = 'Failed to update draft. Please try again.';
          this.isLoading = false;
        }
      });
    } else {
      // New draft
      this.saveDraftToServer(mailContent);
    }
  }

  private saveDraftToServer(mailContent: any): void {
    this.mailService.saveDraft(mailContent).subscribe({
      next: (response) => {
        console.log('Draft saved successfully:', response);
        this.successMessage = 'Draft saved successfully!';
        this.isLoading = false;

        // Refresh draft folder
        this.mailService.refreshFolder('draft').subscribe();

        setTimeout(() => this.close.emit(), 1500);
      },
      error: (error) => {
        console.error('Error saving draft:', error);
        this.errorMessage = 'Failed to save draft. Please try again.';
        this.isLoading = false;
      }
    });
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      this.attachments.push(...newFiles);
      console.log('Files selected:', this.attachments); // Debug log
    }
  }

  removeAttachment(index: number): void {
    this.attachments.splice(index, 1);
  }
  // NEW: Remove existing attachment
  removeExistingAttachment(index: number): void {
    this.existingAttachments.splice(index, 1);
  }

  /**
   * Convert File to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]; // Remove data:type;base64, prefix
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Convert attachments to DTO format matching your Java DTO
   */
  private async convertAttachments(): Promise<any[]> {
    const attachmentDTOs = [];

    for (const file of this.attachments) {
      try {
        const base64Content = await this.fileToBase64(file);
        const attachmentDTO = {
          filename: file.name,
          filePath: base64Content, // Base64 encoded file content
          mimeType: file.type || 'application/octet-stream',
          fileSize: file.size
        };
        attachmentDTOs.push(attachmentDTO);
        console.log('Converted attachment:', attachmentDTO.filename); // Debug log
      } catch (error) {
        console.error('Error converting file to base64:', error);
      }
    }

    return attachmentDTOs;
  }

  validateForm(): boolean {
    if (!this.to.trim()) {
      this.errorMessage = 'Please enter recipient email address.';
      return false;
    }

    if (!this.subject.trim()) {
      this.errorMessage = 'Please enter email subject.';
      return false;
    }

    if (!this.body.trim()) {
      this.errorMessage = 'Please enter email message.';
      return false;
    }

    // Validate all email addresses (handle comma-separated emails)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emails = this.to.split(',').map(email => email.trim()).filter(email => email);

    for (const email of emails) {
      if (!emailPattern.test(email)) {
        this.errorMessage = `Invalid email address: ${email}`;
        return false;
      }
    }

    return true;
  }
}
