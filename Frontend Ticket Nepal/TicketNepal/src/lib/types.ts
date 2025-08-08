
export interface Event {
  id: string;
  name: string;
  category: string;
  eventStart: string;
  eventEnd: string;
  location: string;
  city: string;
  description: string;
  organizer: string | { name: string };
  imageUrl: string;
  price: number;
  seats?: string[];
  // Optional fields enriched by backend in some endpoints
  ticketsSold?: number;
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  seat: string;
  qrCodeUrl: string;
  event?: Event;
  transactionId?: string;
}

export interface TransactionBookingConfirmation {
  event: Event;
  tickets: Array<{
    ticketId: string;
    seat: string;
    checkedIn: boolean;
  }>;
  transactionId: string;
}

export type UserRole = 'Admin' | 'Organizer' | 'Customer' | 'Staff';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string; // Should not be sent to frontend
  avatarUrl: string;
  role: UserRole;
  organizerName?: string;
}
