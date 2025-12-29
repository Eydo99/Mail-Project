import { Component, OnInit,OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MailService } from '../../core/services/mail.service';
import { EmailStateService } from '../../core/services/email-state.service';
import { Email } from '../../core/models/email.model';
import { LucideAngularModule, Star, Paperclip, AlertCircle, ChevronDown, ChevronRight } from 'lucide-angular';
import { PaginationComponent } from "../../components/pagination/pagination.component";

interface PrioritySection {
  level: number;
  title: string;
  color: string;
  emails: Email[];
  expanded: boolean;
}

@Component({
  selector: 'app-priority-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './priority-inbox.component.html',
  styleUrl: './priority-inbox.component.css'
})
export class PriorityInboxComponent implements OnInit,OnDestroy {
  // Folder configuration
  folderName: string = 'inbox';
  title: string = 'Priority Inbox';

  // Export icons for template
  readonly Star = Star;
  readonly Paperclip = Paperclip;
  readonly AlertCircle = AlertCircle;
  readonly ChevronDown = ChevronDown;
  readonly ChevronRight = ChevronRight;

  allEmails: Email[] = [];
  selectedEmailId: string | null = null;
  isAutoRefreshing = false;

  // Priority sections
  prioritySections: PrioritySection[] = [
    { level: 1, title: 'Urgent', color: '#dc2626', emails: [], expanded: true },
    { level: 2, title: 'High Priority', color: '#ea580c', emails: [], expanded: true },
    { level: 3, title: 'Medium Priority', color: '#ca8a04', emails: [], expanded: true },
    { level: 4, title: 'Low Priority', color: '#65a30d', emails: [], expanded: true }
  ];

  constructor(
    private mailService: MailService,
    private emailStateService: EmailStateService
  ) {}

  ngOnInit(): void {
    this.loadEmails();
    this.isAutoRefreshing = true;

    // Track which email is selected
    this.emailStateService.selectedEmail$.subscribe(email => {
      this.selectedEmailId = email?.id || null;
    });
  }
  ngOnDestroy(): void {
    this.isAutoRefreshing = false;
  }

  /**
   * Load emails sorted by priority using backend Priority Queue
   */
  loadEmails(): void {
    // Use the priority queue endpoint - emails come pre-sorted from backend
    this.mailService.getInboxEmailsByPriority().subscribe(emails => {
      this.allEmails = emails;
      this.groupEmailsByPriority();
    });
  }

  /**
   * Group emails by priority level
   * Emails are already sorted by priority from backend Priority Queue
   */
  groupEmailsByPriority(): void {
    // Reset all sections
    this.prioritySections.forEach(section => {
      section.emails = [];
    });

    // Group emails by priority - they're already sorted by the backend
    this.allEmails.forEach(email => {
      const section = this.prioritySections.find(s => s.level === email.priority);
      if (section) {
        section.emails.push(email);
      }
    });
  }

  onEmailClick(email: Email): void {
    this.mailService.markAsRead(email.id);
   this.emailStateService.selectEmail(email,this.allEmails);
  }

  /**
   * Toggle star - With optimistic UI update for instant feedback
   */
  toggleStar(event: Event, email: Email): void {
    event.stopPropagation();

    console.log('⭐ Toggling star for email:', email.id);

    // Optimistic UI update - change immediately for instant feedback
    const previousStarredState = email.isStarred;
    email.isStarred = !email.isStarred;

    this.mailService.toggleStar(email.id, this.folderName).subscribe({
      next: (response) => {
        console.log('✅ Star toggled successfully:', response);
        // UI already updated optimistically, service will refresh in background
      },
      error: (error) => {
        console.error('❌ Error toggling star:', error);
        // Revert the optimistic update on error
        email.isStarred = previousStarredState;
        alert('Failed to toggle star. Please try again.');
      }
    });
  }
  /**
   * Toggle section expansion
   */
  toggleSection(section: PrioritySection): void {
    section.expanded = !section.expanded;
  }

  /**
   * Get total count for a section
   */
  getSectionCount(section: PrioritySection): number {
    return section.emails.length;
  }

  /**
   * Check if email is selected
   */
  isEmailSelected(emailId: string): boolean {
    return false; // Simplified - no selection in priority view
  }
}
