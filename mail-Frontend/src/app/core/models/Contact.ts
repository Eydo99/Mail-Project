import { Email } from "./EmailContacts"
import { Phone } from "./phoneContacts";
export interface Contact {
  id?: string;
  name: string;
  emails: Email[];
  phones: Phone[];
  initials: string;
  avatarColor: string;
}
