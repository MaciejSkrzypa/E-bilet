export type Role = 'PASSENGER' | 'INSPECTOR';
export type Fare = 'NORMAL' | 'REDUCED';
export type TicketType = 'SINGLE' | 'TIME' | 'PERIOD';
export type TicketFilterStatus = 'ACTIVE' | 'REQUIRES_VALIDATION' | 'VALIDATED';
export type TransactionType = 'PURCHASE' | 'TOPUP';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  role: Role;
  balance: number;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: UserResponse;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  user: UserResponse;
}

export interface TopUpRequest {
  amount: number;
}

export interface TransactionResponse {
  id: number;
  type: TransactionType;
  amount: number;
  createdAt: string;
  ticketId: number | null;
  ticketCode: string | null;
}

export interface PurchaseRequest {
  offerId: number;
  validFrom: string | null;
  validTo: string | null;
}

export interface TicketResponse {
  id: number;
  code: string;
  type: TicketType;
  fare: Fare;
  price: number;
  purchaseDate: string;
  durationMinutes: number | null;
  validFrom: string | null;
  validTo: string | null;
  validatedAt: string | null;
  validatedVehicleId: number | null;
  validatedVehicleLabel: string | null;
}

export interface TicketOfferResponse {
  id: number;
  type: TicketType;
  fare: Fare;
  price: number;
  durationMinutes: number | null;
}

export interface VehicleResponse {
  id: number;
  label: string;
}

export interface ValidationRequest {
  code: string;
  vehicleId: number;
}

export interface InspectionRequest {
  code: string;
  vehicleId: number;
}

export interface InspectionResponse {
  valid: boolean;
  reason: string;
  ticket: TicketResponse | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PageQuery {
  page?: number;
  size?: number;
  sort?: string | readonly string[];
}

export interface OffersQuery extends PageQuery {
  type?: readonly TicketType[];
}

export interface TicketsQuery extends PageQuery {
  type?: readonly TicketType[];
  status?: readonly TicketFilterStatus[];
}

export interface TransactionsQuery extends PageQuery {}

export interface VehiclesQuery extends PageQuery {
  query?: string;
}

export interface ApiErrorResponse {
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  timestamp?: string;
  errors?: string[];
}
