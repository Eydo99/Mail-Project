import { Contact } from "./Contact";

export interface PaginatedContactResponse {
  contacts: Contact[];
  totalItems: number;
}