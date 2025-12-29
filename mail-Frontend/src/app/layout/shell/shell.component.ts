import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ReaderComponent } from '../../reader/reader.component';
import { RouterOutlet } from '@angular/router';
import { EmailStateService } from '../../core/services/email-state.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    ReaderComponent
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent implements OnInit {
  isReaderOpen: boolean = false;

  constructor(private emailStateService: EmailStateService) {}

  ngOnInit(): void {
    // Subscribe to reader open state
    this.emailStateService.readerOpen$.subscribe(isOpen => {
      this.isReaderOpen = isOpen;
    });
  }
}
