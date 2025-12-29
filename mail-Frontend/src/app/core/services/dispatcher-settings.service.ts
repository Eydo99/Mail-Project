import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Interface matching backend DispatcherSettingsDTO
 */
export interface DispatcherSettings {
  dispatcherModeEnabled: boolean;
  showDispatcherTutorial: boolean;
  dispatcherAutoOpen: boolean;
  dispatcherPosition: 'right' | 'bottom' | 'overlay';
  autoSummarizeUrgent: boolean;
  smartReply: boolean;
  priorityScoring: boolean;
  showTimeline: boolean;
  showMetrics: boolean;
}

/**
 * Service for managing Dispatcher Mode settings
 * Provides observable stream of settings and methods to update them
 */
@Injectable({
  providedIn: 'root'
})
export class DispatcherSettingsService {
  private apiUrl = 'http://localhost:8080/api/user';
  
  // Observable stream of settings - any component can subscribe
  private settingsSubject = new BehaviorSubject<DispatcherSettings | null>(null);
  public settings$ = this.settingsSubject.asObservable();

  // Track if settings have been loaded
  private loaded = false;

  constructor(private http: HttpClient) {}

  /**
   * Load settings from backend
   * Should be called once on app initialization
   */
  loadSettings(): Observable<DispatcherSettings> {
    console.log('🎮 Loading dispatcher settings...');
    
    return this.http.get<DispatcherSettings>(`${this.apiUrl}/dispatcher-settings`, {
      withCredentials: true
    }).pipe(
      tap(settings => {
        console.log('✅ Dispatcher settings loaded:', settings);
        this.settingsSubject.next(settings);
        this.loaded = true;
      })
    );
  }

  /**
   * Save settings to backend
   */
  saveSettings(settings: DispatcherSettings): Observable<any> {
    console.log('💾 Saving dispatcher settings:', settings);
    
    return this.http.put(`${this.apiUrl}/dispatcher-settings`, settings, {
      withCredentials: true
    }).pipe(
      tap(() => {
        console.log('✅ Settings saved successfully');
        this.settingsSubject.next(settings);
      })
    );
  }

  /**
   * Quick toggle Dispatcher mode (most common operation)
   * Used by sidebar toggle button
   */
  toggle(enabled: boolean): Observable<any> {
    console.log('🔄 Toggling dispatcher to:', enabled);
    
    return this.http.post(`${this.apiUrl}/dispatcher-toggle`, { enabled }, {
      withCredentials: true
    }).pipe(
      tap(() => {
        const current = this.settingsSubject.value;
        if (current) {
          // Update local state immediately for responsive UI
          this.settingsSubject.next({ ...current, dispatcherModeEnabled: enabled });
        }
        console.log('✅ Dispatcher toggled to:', enabled);
      })
    );
  }

  /**
   * Get current settings (synchronous)
   * Returns null if settings haven't been loaded yet
   */
  getCurrentSettings(): DispatcherSettings | null {
    return this.settingsSubject.value;
  }

  /**
   * Check if Dispatcher is enabled
   */
  isEnabled(): boolean {
    return this.settingsSubject.value?.dispatcherModeEnabled ?? false;
  }

  /**
   * Check if settings have been loaded
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Update a single setting without full save
   * (useful for instant UI feedback before saving)
   */
  updateLocalSetting(key: keyof DispatcherSettings, value: any): void {
    const current = this.settingsSubject.value;
    if (current) {
      this.settingsSubject.next({ ...current, [key]: value });
    }
  }
}