import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnChanges {
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 10;
  @Input() maxVisiblePages: number = 5;
  
  @Output() pageChange = new EventEmitter<number>();
  @Output() itemsPerPageChange = new EventEmitter<number>();

  totalPages: number = 0;
  visiblePages: number[] = [];
  startItem: number = 0;
  endItem: number = 0;

  ngOnChanges(changes: SimpleChanges): void {
    this.calculatePagination();
  }

  calculatePagination(): void {
    // Calculate total pages
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // Ensure current page is within bounds
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }

    // Calculate visible pages
    this.visiblePages = this.getVisiblePages();

    // Calculate start and end items
    this.startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    this.endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    
    if (this.totalPages <= this.maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate range of visible pages
      const halfVisible = Math.floor(this.maxVisiblePages / 2);
      let startPage = this.currentPage - halfVisible;
      let endPage = this.currentPage + halfVisible;

      // Adjust if we're near the start
      if (startPage < 1) {
        startPage = 1;
        endPage = this.maxVisiblePages;
      }

      // Adjust if we're near the end
      if (endPage > this.totalPages) {
        endPage = this.totalPages;
        startPage = this.totalPages - this.maxVisiblePages + 1;
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages);
  }

  onItemsPerPageChange(value: number): void {
    this.itemsPerPageChange.emit(value);
  }

  get hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  get showFirstPage(): boolean {
    return this.visiblePages.length > 0 && this.visiblePages[0] > 1;
  }

  get showLastPage(): boolean {
    return this.visiblePages.length > 0 && this.visiblePages[this.visiblePages.length - 1] < this.totalPages;
  }
}