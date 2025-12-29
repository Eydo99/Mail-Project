// folder-modal.component.ts
import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Trash2, Save } from 'lucide-angular';

export interface FolderData {
  id?: string;
  name: string;
  description?: string;
  color: string;
  emailCount?: number;
}

@Component({
  selector: 'app-folder-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './folder-modal.component.html',
  styleUrls: ['./folder-modal.component.css']
})
export class FolderModalComponent implements OnInit {
  @Input() folder?: FolderData;
  @Input() mode: 'create' | 'edit' = 'create';
  @Output() save = new EventEmitter<FolderData>();
  @Output() delete = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  X = X;
  Trash2 = Trash2;
  Save = Save;

  folderData: FolderData = {
    name: '',
    description: '',
    color: '#3b82f6'
  };

  availableColors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#ef4444', // red
    '#f59e0b', // orange
    '#10b981', // green
    '#06b6d4', // cyan
    '#6366f1', // indigo
    '#84cc16', // lime
    '#f97316', // orange-dark
    '#14b8a6', // teal
    '#a855f7', // purple-dark
    '#64748b', // slate
    '#8B4513', // brown
    '#234C6A', // navy
    '#2c2c2c'  // dark
  ];

  ngOnInit(): void {
    if (this.mode === 'edit' && this.folder) {
      this.folderData = { ...this.folder };
    }
  }

  selectColor(color: string): void {
    this.folderData.color = color;
  }

  isValid(): boolean {
    return this.folderData.name.trim().length > 0;
  }

  onSave(): void {
    if (this.isValid()) {
      this.save.emit(this.folderData);
    }
  }

  onDelete(): void {
    if (this.folderData.id) {
      const confirmed = confirm(`Are you sure you want to delete "${this.folderData.name}"? All emails in this folder will be moved to Inbox.`);
      if (confirmed) {
        this.delete.emit(this.folderData.id);
      }
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onOverlayClick(event: Event): void {
    this.onClose();
  }
}