import { Command } from './command.interface';
import { FormGroup } from '@angular/forms';

export class UpdateFieldCommand implements Command {
  private timestamp = new Date();
  
  constructor(
    private form: FormGroup,
    private fieldName: string,
    private oldValue: any,
    private newValue: any
  ) {}
  
  execute(): void {
    this.form.patchValue({ [this.fieldName]: this.newValue }, { emitEvent: false });
  }
  
  undo(): void {
    this.form.patchValue({ [this.fieldName]: this.oldValue }, { emitEvent: false });
  }
  
  getDescription(): string {
    return `Changed ${this.fieldName}`;
  }
  
  getTimestamp(): Date {
    return this.timestamp;
  }
}