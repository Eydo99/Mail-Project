// folders-page.component.ts - UPDATED with count recalculation
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Plus, Folder, Mail, Edit, Trash2 } from 'lucide-angular';
import { FolderService } from '../../core/services/folder.service';
import { FolderModalComponent, FolderData } from '../../components/folder-modal/folder-modal.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-folders-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FolderModalComponent],
  templateUrl: './folders-page.component.html',
  styleUrls: ['./folders-page.component.css']
})
export class FoldersPageComponent implements OnInit {
  Plus = Plus;
  FolderIcon = Folder;
  Mail = Mail;
  Edit = Edit;
  Trash2 = Trash2;

  folders: FolderData[] = [];
  showFolderModal = false;
  selectedFolder?: FolderData;
  folderModalMode: 'create' | 'edit' = 'create';

  constructor(
    private folderService: FolderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFolders();
  }

  loadFolders(): void {
    this.folderService.getAllFolders().subscribe(folders => {
      this.folders = folders;
      // Recalculate counts for all folders
      this.recalculateFolderCounts();
    });
  }

  /**
   * Recalculate email counts for all folders by counting actual emails
   */
  recalculateFolderCounts(): void {
    if (this.folders.length === 0) return;

    // Create an array of observables to get emails for each folder
    const countUpdates = this.folders.map(folder => {
      return this.folderService.getEmailsByFolder(folder.id!);
    });

    // Execute all requests in parallel
    forkJoin(countUpdates).subscribe({
      next: (results) => {
        // Update each folder's count if it's different
        let needsReload = false;

        results.forEach((emails, index) => {
          const folder = this.folders[index];
          const actualCount = emails.length;

          if (folder.emailCount !== actualCount) {
            needsReload = true;
            // Update the count in backend
            this.folderService.updateFolderCount(folder.id!, actualCount).subscribe({
              error: (error) => console.error(`Error updating count for folder ${folder.name}:`, error)
            });
          }
        });

        // Reload folders if any counts were updated
        if (needsReload) {
          setTimeout(() => {
            this.folderService.getAllFolders().subscribe(folders => {
              this.folders = folders;
            });
          }, 500); // Small delay to ensure backend updates are complete
        }
      },
      error: (error) => {
        console.error('Error recalculating folder counts:', error);
      }
    });
  }

  openCreateFolder(): void {
    this.selectedFolder = undefined;
    this.folderModalMode = 'create';
    this.showFolderModal = true;
  }

  editFolder(event: Event, folder: FolderData): void {
    event.stopPropagation();
    this.selectedFolder = folder;
    this.folderModalMode = 'edit';
    this.showFolderModal = true;
  }

  deleteFolder(event: Event, folder: FolderData): void {
    event.stopPropagation();
    const confirmed = confirm(`Are you sure you want to delete "${folder.name}"? All emails in this folder will be moved to Inbox.`);
    if (confirmed && folder.id) {
      this.folderService.deleteFolder(folder.id).subscribe({
        next: () => {
          this.loadFolders();
          alert('Folder deleted successfully.');
        },
        error: (error) => {
          console.error('Error deleting folder:', error);
          alert('Failed to delete folder.');
        }
      });
    }
  }

  viewFolder(folder: FolderData): void {
    this.router.navigate(['folder', folder.id]);
  }

  closeFolderModal(): void {
    this.showFolderModal = false;
    this.selectedFolder = undefined;
  }

  onFolderSave(folderData: FolderData): void {
    if (this.folderModalMode === 'create') {
      // CREATE: Pass only the request data (name, description, color)
      const request = {
        name: folderData.name,
        description: folderData.description,
        color: folderData.color
      };

      this.folderService.createFolder(request).subscribe({
        next: (newFolder) => {
          this.loadFolders();
          this.closeFolderModal();
          alert(`Folder "${newFolder.name}" created successfully!`);
        },
        error: (error) => {
          console.error('Error creating folder:', error);
          alert('Failed to create folder.');
        }
      });
    } else {
      // UPDATE: Pass folder ID and request data separately
      if (!folderData.id) {
        console.error('Cannot update folder without ID');
        alert('Failed to update folder: Missing ID');
        return;
      }

      const request = {
        name: folderData.name,
        description: folderData.description,
        color: folderData.color
      };

      this.folderService.updateFolder(folderData.id, request).subscribe({
        next: () => {
          this.loadFolders();
          this.closeFolderModal();
          alert(`Folder "${folderData.name}" updated successfully!`);
        },
        error: (error) => {
          console.error('Error updating folder:', error);
          alert('Failed to update folder.');
        }
      });
    }
  }

  onFolderDelete(folderId: string): void {
    this.folderService.deleteFolder(folderId).subscribe({
      next: () => {
        this.loadFolders();
        this.closeFolderModal();
        alert('Folder deleted successfully.');
      },
      error: (error) => {
        console.error('Error deleting folder:', error);
        alert('Failed to delete folder.');
      }
    });
  }
}
