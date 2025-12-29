export interface SortCriteria {
  field: 'date' | 'sender' | 'subject' | 'priority';
  direction: 'asc' | 'desc';
}