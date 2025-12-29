import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Email } from '../models/email.model';

@Injectable({
  providedIn: 'root'
})
export class EmailStateService {
  private selectedEmailSubject = new BehaviorSubject<Email | null>(null);
  private readerOpenSubject = new BehaviorSubject<boolean>(false);
  private currentEmailListSubject = new BehaviorSubject<Email[]>([]);
  private currentIndexSubject = new BehaviorSubject<number>(-1);

  selectedEmail$ = this.selectedEmailSubject.asObservable();
  readerOpen$ = this.readerOpenSubject.asObservable();
  currentEmailList$ = this.currentEmailListSubject.asObservable();
  currentIndex$ = this.currentIndexSubject.asObservable();

  selectEmail(email: Email, emailList: Email[]): void {
    this.selectedEmailSubject.next(email);
    this.readerOpenSubject.next(true);
    this.currentEmailListSubject.next(emailList);

    // Find the index of the selected email in the list
    const index = emailList.findIndex(e => e.id === email.id);
    this.currentIndexSubject.next(index);
  }

  navigateToNext(): void {
    const currentList = this.currentEmailListSubject.value;
    const currentIndex = this.currentIndexSubject.value;

    if (currentIndex < currentList.length - 1) {
      const nextIndex = currentIndex + 1;
      this.currentIndexSubject.next(nextIndex);
      this.selectedEmailSubject.next(currentList[nextIndex]);
    }
  }

  navigateToPrevious(): void {
    const currentIndex = this.currentIndexSubject.value;
    const currentList = this.currentEmailListSubject.value;

    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      this.currentIndexSubject.next(prevIndex);
      this.selectedEmailSubject.next(currentList[prevIndex]);
    }
  }

  canNavigateNext(): boolean {
    const currentList = this.currentEmailListSubject.value;
    const currentIndex = this.currentIndexSubject.value;
    return currentIndex < currentList.length - 1;
  }

  canNavigatePrevious(): boolean {
    const currentIndex = this.currentIndexSubject.value;
    return currentIndex > 0;
  }

  getCurrentIndex(): number {
    return this.currentIndexSubject.value;
  }

  getTotalEmails(): number {
    return this.currentEmailListSubject.value.length;
  }

  closeReader(): void {
    this.selectedEmailSubject.next(null);
    this.readerOpenSubject.next(false);
    this.currentIndexSubject.next(-1);
  }
}
