export interface FilterCriteria {
  // Search term (searches in subject, body, sender, receiver)
  searchTerm?: string;
  
  // Date range
  dateFrom?: Date;
  dateTo?: Date;
  
  // Sender filter
  sender?: string;
  
  // Priority filter
  priority?: number[];  // Array of priorities: [1, 2, 3, 4]
  
  // Attachment filter
  hasAttachment?: boolean;
  
  // Starred filter
  isStarred?: boolean;
  
  // Subject contains
  subjectContains?: string;
  
  // Body contains
  bodyContains?: string;
}

