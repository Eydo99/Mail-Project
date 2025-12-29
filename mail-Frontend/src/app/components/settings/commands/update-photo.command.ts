import { Command } from './command.interface';

export class UpdatePhotoCommand implements Command {
  private timestamp = new Date();
  
  constructor(
    private component: any,
    private oldPhoto: string,
    private newPhoto: string
  ) {}
  
  execute(): void {
    this.component.profilePhoto = this.newPhoto;
    console.log('📸 Photo changed');
  }
  
  undo(): void {
    this.component.profilePhoto = this.oldPhoto;
    console.log('⏪ Photo reverted');
  }
  
  getDescription(): string {
    return 'Changed profile photo';
  }
  
  getTimestamp(): Date {
    return this.timestamp;
  }
}