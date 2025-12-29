
import { Component, OnInit,OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MailService } from '../../core/services/mail.service';
import { FolderService } from '../../core/services/folder.service';
import { EmailStateService } from '../../core/services/email-state.service';
import { Email } from '../../core/models/email.model';
import { SortCriteria } from '../../core/models/SortCriteria';
import { FilterCriteria } from '../../core/models/FilterCriteria';
import { LucideAngularModule, Star, Paperclip, AlertCircle, Filter, Trash2, FolderInput, X, Edit, ArrowLeft } from 'lucide-angular';
import { PaginationComponent } from "../pagination/pagination.component";
import {FolderData} from "../folder-modal/folder-modal.component";
import {FilterModalComponent} from "../filter-modal/filter-modal.component";

@Component({
  selector: 'app-folder-view',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent, FilterModalComponent],
  templateUrl: './folder-view.component.html',
  styleUrls: ['./folder-view.component.css']
})
export class FolderViewComponent implements OnInit ,OnDestroy{
  folderId: string = '';
  folderName: string = '';
  title: string = '';
  folderDescription: string = '';
  folderColor: string = '#3b82f6';

  // Pagination
  paginatedEmails: Email[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  // Icons
  readonly Star = Star;
  readonly Paperclip = Paperclip;
  readonly AlertCircle = AlertCircle;
  readonly Filter = Filter;
  readonly Trash2 = Trash2;
  readonly FolderInput = FolderInput;
  readonly X = X;
  readonly Edit = Edit;
  readonly ArrowLeft = ArrowLeft;

  allEmails: Email[] = [];
  filteredEmails: Email[] = [];
  selectedEmailId: string | null = null;

  // Search, Sort, Filter
  searchQuery: string = '';
  sortCriteria: SortCriteria = { field: 'date', direction: 'desc' };
  filterCriteria: FilterCriteria = {};
  hasActiveFilters: boolean = false;
  showFilterModal: boolean = false;

  // Selection for action bar
  selectedEmails: Set<string> = new Set();
  showActionBar: boolean = false;
  moveToFolder: string = '';
  isAutoRefreshing = false;

  ///
  folders: FolderData[] = [];
///

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private mailService: MailService, // Existing mail service
    private folderService: FolderService, // New folder service
    private emailStateService: EmailStateService,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.folderId = params['id'];
      this.loadFolderDetails();
      this.loadEmails();
      this.loadFolders(); //
    });

    this.emailStateService.selectedEmail$.subscribe(email => {
      this.selectedEmailId = email?.id || null;
    });
  }
  loadFolders(): void {
    this.folderService.getAllFolders().subscribe(folders => {
      this.folders = folders;
    });
    this.isAutoRefreshing = true;
  }
  ngOnDestroy(): void {
    this.isAutoRefreshing = false;
  }
  /**
   * Load folder metadata from backend using FolderService
   */
  loadFolderDetails(): void {
    this.folderService.getFolderById(this.folderId).subscribe({
      next: (folder) => {
        if (folder) {
          this.folderName = "folder_"+folder.id;
          this.title=folder.name;
          this.folderDescription = folder.description || '';
          this.folderColor = folder.color;
        }
      },
      error: (error) => {
        console.error('Error loading folder details:', error);
        alert('Failed to load folder details');
      }
    });
  }


  goBack(): void {
    this.router.navigate(['/folders']);
  }

  editFolder(): void {
    this.router.navigate(['/folders'], { queryParams: { edit: this.folderId } });
  }

  onEmailClick(email: Email): void {
    // Use FolderService for marking as read (no folder parameter needed)
    console.log('Clicked email:', email);
   // this.folderService.markAsRead(email.id);
    this.emailStateService.selectEmail(email,this.filteredEmails);
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
   * Load emails from custom folder with backend filtering
   */
  loadEmails(): void {
    const sortString = `${this.sortCriteria.field}-${this.sortCriteria.direction}`;
    const backendFilters = this.buildBackendFilters();

    // Use the searchCustomFolderEmails method (POST endpoint)
    this.folderService.searchCustomFolderEmails(this.folderId, sortString, backendFilters).subscribe({
      next: (emails) => {
        console.log('✅ Emails loaded:', emails);
        this.allEmails = emails;
        this.filteredEmails = emails;
        this.totalItems = emails.length;
        this.updatePagination();
      },
      error: (error) => {
        console.error('❌ Error loading emails:', error);
        alert('Failed to load emails');
      }
    });
  }

  /**
   * Convert frontend FilterCriteria to backend format
   */
  private buildBackendFilters(): any {
    const filters: any = {};

    // ✅ FIX: Check BOTH searchQuery (from toolbar) AND filterCriteria.searchTerm (from modal)
    const searchText = this.searchQuery || this.filterCriteria.searchTerm;
    if (searchText && searchText.trim()) {
      filters.searchTerm = searchText.trim();
    }

    if (this.filterCriteria.dateFrom) {
      filters.dateFrom = this.filterCriteria.dateFrom;
    }

    if (this.filterCriteria.dateTo) {
      filters.dateTo = this.filterCriteria.dateTo;
    }

    if (this.filterCriteria.sender) {
      filters.sender = this.filterCriteria.sender;
    }

    if (this.filterCriteria.priority && this.filterCriteria.priority.length > 0) {
      filters.priority = this.filterCriteria.priority;
    }

    if (this.filterCriteria.hasAttachment !== undefined) {
      filters.hasAttachment = this.filterCriteria.hasAttachment;
    }

    if (this.filterCriteria.isStarred !== undefined) {
      filters.isStarred = this.filterCriteria.isStarred;
    }

    if (this.filterCriteria.subjectContains) {
      filters.subjectContains = this.filterCriteria.subjectContains;
    }

    if (this.filterCriteria.bodyContains) {
      filters.bodyContains = this.filterCriteria.bodyContains;
    }

    // Check if any filters are active
    this.hasActiveFilters = Object.keys(filters).length > 0;

    return filters;
  }

  /**
   * Handle search input
   */
  onSearch(query: string): void {
    this.searchQuery = query;
    this.currentPage = 1;
    this.loadEmails(); // Reload from backend with new search
  }

  /**
   * Handle sort change
   */
  onSortChange(value: string): void {
    const [field, direction] = value.split('-') as [SortCriteria['field'], SortCriteria['direction']];
    this.sortCriteria = { field, direction };
    this.loadEmails(); // Reload from backend with new sort
  }

  /**
   * Open filter modal
   */
  openFilterModal(): void {
    this.showFilterModal = true;
  }

  /**
   * Close filter modal
   */
  closeFilterModal(): void {
    this.showFilterModal = false;
  }

  /**
   * Apply filters from modal
   */
  onApplyFilters(criteria: FilterCriteria): void {
    console.log('📋 Applying filters:', criteria);
    this.filterCriteria = criteria;

    // ✅ FIX: Sync the toolbar search input with the filter modal search
    if (criteria.searchTerm) {
      this.searchQuery = criteria.searchTerm;
    }

    this.currentPage = 1;
    this.loadEmails();
  }

  /**
   * Clear all filters
   */
  clearAllFilters(): void {
    this.filterCriteria = {};
    this.searchQuery = '';
    this.currentPage = 1;
    this.loadEmails(); // Reload from backend without filters
  }

  // Pagination
  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  onItemsPerPageChange(itemsPerPage: number): void {
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedEmails = this.filteredEmails.slice(start, end);
  }

  // Selection
  toggleEmailSelection(event: Event, emailId: string): void {
    event.stopPropagation();
    if (this.selectedEmails.has(emailId)) {
      this.selectedEmails.delete(emailId);
    } else {
      this.selectedEmails.add(emailId);
    }
    this.updateActionBarVisibility();
  }

  isEmailSelected(emailId: string): boolean {
    return this.selectedEmails.has(emailId);
  }

  toggleSelectAll(): void {
    if (this.areAllSelected()) {
      this.selectedEmails.clear();
    } else {
      this.paginatedEmails.forEach(email => this.selectedEmails.add(email.id));
    }
    this.updateActionBarVisibility();
  }

  areAllSelected(): boolean {
    return this.paginatedEmails.length > 0 &&
           this.paginatedEmails.every(email => this.selectedEmails.has(email.id));
  }

  updateActionBarVisibility(): void {
    this.showActionBar = this.selectedEmails.size > 0;
  }

  getSelectedCount(): number {
    return this.selectedEmails.size;
  }

  closeActionBar(): void {
    this.selectedEmails.clear();
    this.showActionBar = false;
    this.moveToFolder = '';
  }

  onFolderChange(folder: string): void {
    this.moveToFolder = folder;
  }

  // Actions - Use FolderService instead of MailService
  deleteSelectedEmails(): void {
    if (this.selectedEmails.size === 0) return;

    const confirmDelete = confirm(`Move ${this.selectedEmails.size} email(s) to trash?`);
    if (!confirmDelete) return;

    const selectedIds = Array.from(this.selectedEmails);
    let completedRequests = 0;
    let successCount = 0;

    selectedIds.forEach(emailId => {
      this.mailService.deleteEmail(emailId, this.folderName).subscribe({
        next: () => {
          successCount++;
          completedRequests++;

          if (completedRequests === selectedIds.length) {
            this.onActionComplete(successCount, selectedIds.length, 'deleted');
          }
        },
        error: (error) => {
          console.error(`Failed to delete email ${emailId}:`, error);
          completedRequests++;

          if (completedRequests === selectedIds.length) {
            this.onActionComplete(successCount, selectedIds.length, 'deleted');
          }
        }
      });
    });
  }
  moveSelectedEmails(): void {
    if (this.selectedEmails.size === 0 || !this.moveToFolder) {
      alert('Please select a folder');
      return;
    }

    const selectedIds = Array.from(this.selectedEmails);
    let completedRequests = 0;
    let successCount = 0;
     console.log(this.folderName);
    selectedIds.forEach(emailId => {
      this.mailService.moveEmail(emailId, this.folderName, this.moveToFolder).subscribe({
        next: () => {
          successCount++;
          completedRequests++;

          if (completedRequests === selectedIds.length) {
            this.onActionComplete(successCount, selectedIds.length, 'moved');
          }
        },
        error: (error) => {
          console.error(`Failed to move email ${emailId}:`, error);
          completedRequests++;

          if (completedRequests === selectedIds.length) {
            this.onActionComplete(successCount, selectedIds.length, 'moved');
          }
        }
      });
    });
  }
  private onActionComplete(successCount: number, totalCount: number, action: string): void {
    if (successCount > 0) {
      this.loadEmails();
      this.closeActionBar();
      const message = action === 'moved'
        ? `${successCount} of ${totalCount} email(s) moved to ${this.moveToFolder}`
        : `${successCount} of ${totalCount} email(s) moved to trash`;
      alert(message);
    } else {
      alert(`Failed to ${action} emails`);
    }
  }
  getPriorityColor(priority: number): string {
    switch(priority) {
      case 1: return '#dc2626'; // Red - Urgent
      case 2: return '#ea580c'; // Orange - High
      case 3: return '#ca8a04'; // Yellow - Medium
      case 4: return '#65a30d'; // Green - Low
      default: return '#9ca3af'; // Gray - Default
    }
  }
}
