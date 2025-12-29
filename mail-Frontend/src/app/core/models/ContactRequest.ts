export interface ContactRequest
{
    name: string;
  emails: {
    address: string;
    isPrimary: boolean;
  }[];
  phones: {
    number: string;
    isPrimary: boolean;
  }[];
}