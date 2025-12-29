import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ComposeComponent } from './components/compose/compose.component';
import { ComposeService } from './core/services/compose.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,CommonModule,ComposeComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Mail';
    isComposeOpen = false;

  constructor(private composeService: ComposeService) {}

  ngOnInit(): void {
    this.composeService.composeOpen$.subscribe(
      isOpen => this.isComposeOpen = isOpen
    );
  }

  closeCompose(): void {
    this.composeService.closeCompose();
  }
}
