import { Injectable } from '@angular/core';
import { Command } from './command.interface';

@Injectable({ providedIn: 'root' })
export class CommandManager {
  private history: Command[] = [];
  private currentIndex = -1;
  
  execute(command: Command): void {
    this.history = this.history.slice(0, this.currentIndex + 1);
    command.execute();
    this.history.push(command);
    this.currentIndex++;
    
    if (this.history.length > 50) {
      this.history.shift();
      this.currentIndex--;
    }
  }
  
  undo(): void {
    if (this.canUndo()) {
      this.history[this.currentIndex].undo();
      this.currentIndex--;
    }
  }
  
  redo(): void {
    if (this.canRedo()) {
      this.currentIndex++;
      this.history[this.currentIndex].execute();
    }
  }
  
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }
  
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }
  
  clearHistory(): void {
    this.history = [];
    this.currentIndex = -1;
  }
  
  hasChanges(): boolean {
    return this.history.length > 0;
  }
}