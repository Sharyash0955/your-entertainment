export type SeatStatus = 'available' | 'hold' | 'booked';

export interface VenueOption {
  id: string;
  name: string;
  location: string;
  formats: string[];
  features: string[];
}

export interface EventItem {
  id: string;
  name: string;
  title?: string;
  venue?: string;
  showtime?: string;
  category: 'movie' | 'concert' | 'comedy' | 'sports';
  genre?: string;
  duration?: string;
  rating?: number;
  votes?: string;
  language?: string;
  format?: string;
  posterUrl?: string;
  backdropUrl?: string;
  synopsis?: string;
  cast?: string[];
  director?: string;
  basePrice: number;
  venues?: VenueOption[];
  dates?: string[];
  showtimes?: string[];
}

export interface SeatItem {
  id: string;
  event_id: string;
  row: string;
  number: number;
  tier: 'VIP' | 'PREMIUM' | 'EXECUTIVE';
  price: number;
  status: SeatStatus;
  held_by: string | null;
  hold_expires_at: number | null; // Unix timestamp in ms
}

export interface MealItem {
  id: string;
  name: string;
  category: 'combos' | 'popcorn' | 'snacks' | 'beverages';
  price: number;
  image: string;
  description: string;
  tag?: string;
  isVeg?: boolean;
}

export interface SelectedMeal {
  meal: MealItem;
  quantity: number;
}

export interface BookingItem {
  id: string;
  seat_id: string;
  user_id: string;
  event_id: string;
  created_at: number;
  seat_label?: string;
  amount?: number;
  event_name?: string;
  venue?: string;
  showtime?: string;
  meals_summary?: string;
  total_amount?: number;
}

export interface ConfirmedBookingDetail {
  id: string;
  event: EventItem;
  venueName: string;
  dateStr: string;
  timeStr: string;
  seats: SeatItem[];
  meals: SelectedMeal[];
  user: UserItem;
  ticketSubtotal: number;
  mealsSubtotal: number;
  convenienceFee: number;
  taxes: number;
  totalAmount: number;
  bookingCode: string;
  bookingTime: string;
  paymentMethod: string;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

export interface SocketSeatHeldPayload {
  seatId: string;
  eventId: string;
  heldBy: string;
  holdExpiresAt: number;
}

export interface SocketSeatReleasedPayload {
  seatId: string;
  eventId: string;
  reason?: 'expired' | 'user_cancelled' | 'payment_failed';
}

export interface SocketSeatBookedPayload {
  seatId: string;
  eventId: string;
  bookingId: string;
  userId: string;
}

export interface AISuggestionResponse {
  suggestedSeatIds: string[];
  reasoning: string;
  isAiPowered: boolean;
}

export interface ConcurrencyTestResult {
  totalRequests: number;
  targetSeatId: string;
  targetSeatLabel: string;
  winners: Array<{ userId: string; statusCode: number; durationMs: number; message: string }>;
  conflicts: Array<{ userId: string; statusCode: number; durationMs: number; message: string }>;
  errors: Array<{ userId: string; statusCode: number; durationMs: number; message: string }>;
  executionTimeMs: number;
  verifiedOneWinner: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
