import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { DispatcherSettingsService, DispatcherSettings } from '../../core/services/dispatcher-settings.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  LucideAngularModule,
  Inbox, Star, Send, FileText, Trash2,
  Users, Settings, Plus, FolderOpen,
  Mail
} from 'lucide-angular';

import { FolderService } from '../../core/services/folder.service';
import { ComposeService } from '../../core/services/compose.service';
import { AuthService } from '../../core/services/auth.service';
import { UserProfileService } from '../../core/services/user-profile.service';
import { MailService } from '../../core/services/mail.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  Mail = Mail;
  Inbox = Inbox;
  Star = Star;
  StarIcon = Star; // For starred section
  Send = Send;
  FileText = FileText;
  Trash2 = Trash2;
  Users = Users;
  Settings = Settings;
  Plus = Plus;
  FolderOpen = FolderOpen;

  isOpen = true;
  totalFolderCount = 0;
  starredCount = 0; // NEW: Track starred emails count
  currentRoute = '';

  firstName = '';
  lastName = '';
  profilePhoto: string | null = null;

  dispatcherEnabled = false;
  dispatcherSettings: DispatcherSettings | null = null;
  showDispatcherBadge = true;
  private destroy$ = new Subject<void>();
  
  private profileUpdateListener: any;

  constructor(
    private router: Router,
    private folderService: FolderService,
    private composeService: ComposeService,
    private authService: AuthService,
    private userProfileService: UserProfileService,
    private dispatcherService: DispatcherSettingsService,
    private mailService: MailService // Changed to MailService
  ) {}

  ngOnInit(): void {
    // Load folder count
    this.folderService.getAllFolders().subscribe(folders => {
      this.totalFolderCount = folders.length;
    });

    // NEW: Load starred emails count
    this.loadStarredCount();

    this.loadProfile();

    this.updateCurrentRoute();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateCurrentRoute();
    });
    
    this.profileUpdateListener = (event: any) => {
      console.log('📢 Sidebar: Profile update event received', event.detail);
      this.updateProfileFromData(event.detail);
    };
    
    window.addEventListener('profile-updated', this.profileUpdateListener);

    this.dispatcherService.settings$
      .pipe(takeUntil(this.destroy$))
      .subscribe(settings => {
        if (settings) {
          this.dispatcherSettings = settings;
          this.dispatcherEnabled = settings.dispatcherModeEnabled;
          
          // Hide badge once user has seen Dispatcher
          if (settings.dispatcherModeEnabled || !settings.showDispatcherTutorial) {
            this.showDispatcherBadge = false;
          }
        }
      });

    // Load settings if not already loaded
    if (!this.dispatcherService.isLoaded()) {
      this.dispatcherService.loadSettings().subscribe();
    }

    // NEW: Listen for star/unstar events to update count
    this.setupStarredCountListener();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.profileUpdateListener) {
      window.removeEventListener('profile-updated', this.profileUpdateListener);
    }
  }

  // NEW: Load starred emails count from all folders
  private loadStarredCount(): void {
    // Subscribe to all folder observables and count starred emails
    this.mailService.inboxEmails$.pipe(takeUntil(this.destroy$)).subscribe(emails => {
      this.updateStarredCount();
    });
    
    this.mailService.sentEmails$.pipe(takeUntil(this.destroy$)).subscribe(emails => {
      this.updateStarredCount();
    });
    
    this.mailService.draftEmails$.pipe(takeUntil(this.destroy$)).subscribe(emails => {
      this.updateStarredCount();
    });
    
    this.mailService.trashEmails$.pipe(takeUntil(this.destroy$)).subscribe(emails => {
      this.updateStarredCount();
    });
  }

  // Helper method to count all starred emails across folders
  private updateStarredCount(): void {
    let count = 0;
    
    // Count starred emails from inbox
    this.mailService.inboxEmails$.pipe(takeUntil(this.destroy$)).subscribe(emails => {
      count += emails.filter(e => e.isStarred).length;
    });
    
    // Count starred emails from sent
    this.mailService.sentEmails$.pipe(takeUntil(this.destroy$)).subscribe(emails => {
      count += emails.filter(e => e.isStarred).length;
    });
    
    // Count starred emails from drafts
    this.mailService.draftEmails$.pipe(takeUntil(this.destroy$)).subscribe(emails => {
      count += emails.filter(e => e.isStarred).length;
    });
    
    this.starredCount = count;
    console.log('⭐ Starred emails count:', this.starredCount);
  }

  // NEW: Setup listener for star/unstar events
  private setupStarredCountListener(): void {
    // The count will automatically update through the observables
    // No additional listeners needed since we're subscribed to all folder streams
  }

  private loadProfile(): void {
    this.userProfileService.getProfile().subscribe({
      next: (profile) => {
        this.updateProfileFromData(profile);
      },
      error: (err) => {
        console.error('❌ Error loading profile:', err);
        this.firstName = 'Guest';
        this.lastName = '';
        this.profilePhoto = null;
      }
    });
  }
  
  private updateProfileFromData(profile: any): void {
    if (profile.fullName) {
      const nameParts = profile.fullName.split(' ');
      this.firstName = nameParts[0] || '';
      this.lastName = nameParts.slice(1).join(' ') || '';
    } else {
      this.firstName = profile.firstName || '';
      this.lastName = profile.lastName || '';
    }
    
    this.profilePhoto = profile.profilePhoto;
    
    console.log('✅ Sidebar profile updated:', {
      firstName: this.firstName,
      lastName: this.lastName,
      hasPhoto: !!this.profilePhoto
    });
  }

  private updateCurrentRoute(): void {
    const url = this.router.url;
    const route = url.split('/')[1] || 'inbox';
    this.currentRoute = route;
  }

  onMouseEnter(): void {
    this.isOpen = true;
  }

  onMouseLeave(): void {
    this.isOpen = false;
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  openCompose(): void {
    this.composeService.openCompose();
  }

  toggleDispatcher(): void {
    const newState = !this.dispatcherEnabled;
    console.log('🎮 User toggling Dispatcher to:', newState);
    
    // Optimistic UI update
    this.dispatcherEnabled = newState;
    
    // Call backend
    this.dispatcherService.toggle(newState).subscribe({
      next: () => {
        console.log('✅ Dispatcher toggled successfully');
        
        // Hide badge after first interaction
        this.showDispatcherBadge = false;
        
        // TODO: Show tutorial on first enable (Phase 6)
        if (newState && this.dispatcherSettings?.showDispatcherTutorial) {
          console.log('🎓 TODO: Show Dispatcher tutorial');
        }
      },
      error: (err) => {
        console.error('❌ Failed to toggle Dispatcher:', err);
        // Revert optimistic update on error
        this.dispatcherEnabled = !newState;
        alert('Failed to toggle Dispatcher Mode. Please try again.');
      }
    });
  }
}