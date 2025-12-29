// components/filter-modal/filter-modal.component.ts

import { Component, EventEmitter, Output, Input,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterCriteria } from '../../core/models/FilterCriteria';
import { LucideAngularModule, X, Calendar, User, AlertCircle, Paperclip, Star, FileText, Mail } from 'lucide-angular';

@Component({
  selector: 'app-filter-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './filter-modal.component.html',
  styleUrls: ['./filter-modal.component.css']
})
export class FilterModalComponent implements OnInit{
  // Icons
  readonly X = X;
  readonly Calendar = Calendar;
  readonly User = User;
  readonly AlertCircle = AlertCircle;
  readonly Paperclip = Paperclip;
  readonly Star = Star;
  readonly FileText = FileText;
  readonly Mail = Mail;

  @Input() currentFilters: FilterCriteria = {};
  @Output() applyFilters = new EventEmitter<FilterCriteria>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  // Filter form fields
  searchTerm: string = '';
  dateFrom: string = '';
  dateTo: string = '';
  sender: string = '';
  selectedPriorities: Set<number> = new Set();
  hasAttachment: string = 'all'; // 'all', 'with', 'without'
  isStarred: string = 'all'; // 'all', 'starred', 'unstarred'
  subjectContains: string = '';
  bodyContains: string = '';

  priorities = [
    { value: 1, label: 'Urgent', color: '#dc2626' },
    { value: 2, label: 'High', color: '#ea580c' },
    { value: 3, label: 'Medium', color: '#ca8a04' },
    { value: 4, label: 'Low', color: '#65a30d' }
  ];

  ngOnInit(): void {
    this.loadCurrentFilters();
  }

  /**
   * Load current filters into form
   */
  private loadCurrentFilters(): void {
    if (!this.currentFilters) return;

    this.searchTerm = this.currentFilters.searchTerm || '';
    this.dateFrom = this.formatDateForInput(this.currentFilters.dateFrom);
    this.dateTo = this.formatDateForInput(this.currentFilters.dateTo);
    this.sender = this.currentFilters.sender || '';
    this.subjectContains = this.currentFilters.subjectContains || '';
    this.bodyContains = this.currentFilters.bodyContains || '';

    // Priority
    if (this.currentFilters.priority && this.currentFilters.priority.length > 0) {
      this.selectedPriorities = new Set(this.currentFilters.priority);
    }

    // Attachment
    if (this.currentFilters.hasAttachment === true) {
      this.hasAttachment = 'with';
    } else if (this.currentFilters.hasAttachment === false) {
      this.hasAttachment = 'without';
    } else {
      this.hasAttachment = 'all';
    }

    // Starred
    if (this.currentFilters.isStarred === true) {
      this.isStarred = 'starred';
    } else if (this.currentFilters.isStarred === false) {
      this.isStarred = 'unstarred';
    } else {
      this.isStarred = 'all';
    }
  }

  /**
   * Toggle priority selection
   */
  togglePriority(priority: number): void {
    if (this.selectedPriorities.has(priority)) {
      this.selectedPriorities.delete(priority);
    } else {
      this.selectedPriorities.add(priority);
    }
  }

  /**
   * Check if priority is selected
   */
  isPrioritySelected(priority: number): boolean {
    return this.selectedPriorities.has(priority);
  }

  /**
   * Apply filters and emit
   */
  onApplyFilters(): void {
    const filters: FilterCriteria = {};

    // Add search term
    if (this.searchTerm.trim()) {
      filters.searchTerm = this.searchTerm.trim();
    }

    // Add date range
    if (this.dateFrom) {
      filters.dateFrom = new Date(this.dateFrom);
    }
    if (this.dateTo) {
      filters.dateTo = new Date(this.dateTo);
    }

    // Add sender
    if (this.sender.trim()) {
      filters.sender = this.sender.trim();
    }

    // Add priorities
    if (this.selectedPriorities.size > 0) {
      filters.priority = Array.from(this.selectedPriorities);
    }

    // Add attachment filter
    if (this.hasAttachment === 'with') {
      filters.hasAttachment = true;
    } else if (this.hasAttachment === 'without') {
      filters.hasAttachment = false;
    }

    // Add starred filter
    if (this.isStarred === 'starred') {
      filters.isStarred = true;
    } else if (this.isStarred === 'unstarred') {
      filters.isStarred = false;
    }

    // Add subject filter
    if (this.subjectContains.trim()) {
      filters.subjectContains = this.subjectContains.trim();
    }

    // Add body filter
    if (this.bodyContains.trim()) {
      filters.bodyContains = this.bodyContains.trim();
    }

    this.applyFilters.emit(filters);
    this.close.emit();
  }

  /**
   * Clear all filters
   */
  onClearFilters(): void {
    this.searchTerm = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.sender = '';
    this.selectedPriorities.clear();
    this.hasAttachment = 'all';
    this.isStarred = 'all';
    this.subjectContains = '';
    this.bodyContains = '';

    this.clearFilters.emit();
    this.close.emit();
  }

  /**
   * Close modal
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Format date for input field
   */
  private formatDateForInput(date?: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
