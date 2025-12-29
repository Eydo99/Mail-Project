import {Attachment} from "./attachment";

export interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  body: string;
  timestamp: Date;
  isStarred: boolean;
  hasAttachment: boolean;
  priority: number;
  folder?: string;
  attachments?: Attachment[];  // ADD THIS LINE
}
