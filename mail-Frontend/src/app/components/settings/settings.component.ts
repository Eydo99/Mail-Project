import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommandManager } from './commands/command-manager.service';
import { UpdateFieldCommand } from './commands/update-field.command';
import { UpdatePhotoCommand } from './commands/update-photo.command';
import { AuthService } from '../../core/services/auth.service';
import { UserProfileService } from '../../core/services/user-profile.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private userProfileService = inject(UserProfileService);
  public commandManager = inject(CommandManager);
  
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  showHistory = false;
  showPasswordSection = false;
  isSaving = false;
  isChangingPassword = false;
  profilePhoto: string = 'assets/default-avatar.png';
  originalValues: any = {};
  
  ngOnInit(): void {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      jobTitle: [''],
      phone: [''],
      bio: ['', Validators.maxLength(500)]
    });
    
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
    
    this.loadProfile();
  }
  
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }
  
  loadProfile(): void {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    this.http.get<any>('http://localhost:8080/api/user/profile', { withCredentials: true })
      .subscribe({
        next: (profile) => {
          console.log('📥 Profile loaded from backend:', profile);
          
          this.profileForm.patchValue({
            fullName: profile.fullName || '',
            email: user.email || profile.email || '',
            jobTitle: profile.jobTitle || '',
            phone: profile.phone || '',
            bio: profile.bio || ''
          });
          
          this.profilePhoto = profile.profilePhoto || 'assets/default-avatar.png';
          
          this.originalValues = { 
            ...this.profileForm.getRawValue(), 
            profilePhoto: this.profilePhoto 
          };
          
          console.log('✅ Profile state set:', {
            fullName: profile.fullName,
            hasPhoto: !!profile.profilePhoto
          });
        },
        error: (err) => {
          console.error('❌ Error loading profile:', err);
          this.profileForm.patchValue({ email: user.email });
          this.originalValues = { 
            ...this.profileForm.getRawValue(),
            profilePhoto: 'assets/default-avatar.png'
          };
        }
      });
  }
  
  onFieldChange(fieldName: string): void {
    const control = this.profileForm.get(fieldName);
    if (!control || !control.dirty || control.invalid) return;
    
    const oldValue = this.originalValues[fieldName];
    const newValue = control.value;
    
    if (oldValue !== newValue) {
      const command = new UpdateFieldCommand(this.profileForm, fieldName, oldValue, newValue);
      this.commandManager.execute(command);
      this.originalValues[fieldName] = newValue;
      control.markAsPristine();
    }
  }
  
  onPhotoSelect(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 1024 * 1024) {
      alert('Photo must be under 1MB');
      event.target.value = '';
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/gif', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Only JPG, GIF, or PNG images are allowed');
      event.target.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const oldPhoto = this.profilePhoto;
      const newPhoto = e.target.result as string;
      
      console.log('📸 Photo selected:', {
        size: (file.size / 1024).toFixed(2) + ' KB',
        type: file.type,
        dataLength: newPhoto.length
      });
      
      const command = new UpdatePhotoCommand(this, oldPhoto, newPhoto);
      this.commandManager.execute(command);
      
      console.log('✅ Photo change tracked');
      console.log('📊 Has changes?', this.commandManager.hasChanges());
    };
    
    reader.readAsDataURL(file);
    event.target.value = '';
  }
  
  undo(): void {
    this.commandManager.undo();
    console.log('⏪ Undo performed');
  }
  
  redo(): void {
    this.commandManager.redo();
    console.log('⏩ Redo performed');
  }
  
  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }
  
  togglePasswordSection(): void {
    this.showPasswordSection = !this.showPasswordSection;
    if (!this.showPasswordSection) {
      this.passwordForm.reset();
    }
  }
  
  saveAll(): void {
    if (!this.profileForm.valid) {
      alert('Please fill in all required fields');
      return;
    }
    
    this.isSaving = true;
    
    let photoToSend = this.profilePhoto;
    if (photoToSend === 'assets/default-avatar.png') {
      photoToSend = null as any;
    }
    
    const profileData = {
      fullName: this.profileForm.get('fullName')?.value,
      jobTitle: this.profileForm.get('jobTitle')?.value,
      phone: this.profileForm.get('phone')?.value,
      bio: this.profileForm.get('bio')?.value,
      profilePhoto: photoToSend
    };
    
    console.log('🚀 FRONTEND: Sending to backend:', {
      fullName: profileData.fullName,
      jobTitle: profileData.jobTitle,
      phone: profileData.phone,
      bio: profileData.bio,
      hasPhoto: !!profileData.profilePhoto,
      photoPrefix: profileData.profilePhoto ? profileData.profilePhoto.substring(0, 30) : 'null',
      photoLength: profileData.profilePhoto ? profileData.profilePhoto.length : 0
    });
    
    this.http.put('http://localhost:8080/api/user/profile', profileData, { withCredentials: true })
      .subscribe({
        next: (response) => {
          console.log('✅ Profile saved successfully');
          
          this.commandManager.clearHistory();
          
          this.originalValues = { 
            ...this.profileForm.getRawValue(), 
            profilePhoto: this.profilePhoto 
          };
          
          this.isSaving = false;
          alert('Profile saved successfully!');
          
          this.reloadProfileAndSidebar();
        },
        error: (err: any) => {
          console.error('❌ Error saving profile:', err);
          this.isSaving = false;
          const errorMessage = err.error?.message || 'Error saving profile. Please try again.';
          alert(errorMessage);
        }
      });
  }
  
  reloadProfileAndSidebar(): void {
    console.log('🔄 Reloading profile and sidebar...');
    
    this.userProfileService.getProfile().subscribe({
      next: (profile) => {
        console.log('✅ Profile reloaded:', profile);
        
        this.profilePhoto = profile.profilePhoto || 'assets/default-avatar.png';
        
        this.profileForm.patchValue({
          fullName: profile.fullName || '',
          jobTitle: profile.jobTitle || '',
          phone: profile.phone || '',
          bio: profile.bio || ''
        });
        
        window.dispatchEvent(new CustomEvent('profile-updated', { 
          detail: profile 
        }));
        
        console.log('📢 Profile update event dispatched');
      },
      error: (err) => {
        console.error('❌ Error reloading profile:', err);
      }
    });
  }
  
  changePassword(): void {
    if (!this.passwordForm.valid) {
      alert('Please fill in all password fields correctly');
      return;
    }
    
    this.isChangingPassword = true;
    
    const passwordData = {
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value,
      confirmPassword: this.passwordForm.get('confirmPassword')?.value
    };
    
    this.http.put('http://localhost:8080/api/user/password', passwordData, { withCredentials: true })
      .subscribe({
        next: () => {
          this.isChangingPassword = false;
          alert('Password changed successfully!');
          this.passwordForm.reset();
          this.showPasswordSection = false;
        },
        error: (err: any) => {
          this.isChangingPassword = false;
          const errorMessage = err.error?.message || 'Error changing password';
          alert(errorMessage);
        }
      });
  }
  
  discardAll(): void {
    if (confirm('Discard all changes?')) {
      while (this.commandManager.canUndo()) {
        this.commandManager.undo();
      }
      
      this.commandManager.clearHistory();
      this.loadProfile();
      
      console.log('🗑️ All changes discarded');
    }
  }
  
  logout(): void {
    if (this.commandManager.hasChanges()) {
      if (!confirm('You have unsaved changes. Logout anyway?')) return;
    }
    
    console.log('🚪 Logging out...');
    
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Logged out successfully');
        localStorage.removeItem('currentUser');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        console.error('❌ Logout error:', err);
        localStorage.removeItem('currentUser');
        this.router.navigate(['/login']);
      }
    });
  }
}