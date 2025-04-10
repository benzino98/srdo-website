export interface Contact {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}
