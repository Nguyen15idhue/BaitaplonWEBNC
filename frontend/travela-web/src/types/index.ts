// Types FE copy đúng DTO backend (camelCase). Đổi contract phải sửa cả 2 bên.
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: "Admin" | "Customer";
  status: string;
}

export interface Destination {
  id: number;
  name: string;
  regionName: string;
  description: string;
}

export interface Tour {
  id: number;
  tourName: string;
  priceFrom: number;
  thumbnail: string;
  destination: Destination | null;
  status: string;
  maxSeats: number;
  bookedSeats: number;
  availableSeats: number;
  startDate: string | null;
  endDate: string | null;
  departureDate?: string | null;
  departureLocation?: string | null;
  duration?: string | null;
  // Optional để tương thích UI main (TourCard dùng description); BE list không trả field này.
  description?: string;
}

// H02: list không có description — type riêng, detail mới có.
export interface TourDetail extends Tour {
  description: string;
  destinationId: number;
  images: TourImage[];
  prices: TourPrice[];
  // Nội dung chi tiết tour (null = chưa nhập) — khớp TourDetailDto BE.
  route: string | null;
  itinerary: string | null;
  transport: string | null;
  accommodation: string | null;
  meals: string | null;
  sightseeing: string | null;
  guide: string | null;
  included: string | null;
  excluded: string | null;
  audience: string | null;
  insurance: string | null;
  terms: string | null;
  contactInfo: string | null;
  // Redesign: điều kiện tour chi tiết + lịch trình từng ngày.
  paymentTerms: string | null;
  cancellationPolicy: string | null;
  applicationConditions: string | null;
  itineraryDays: string | null;
}

export interface ItineraryDay {
  day: number;
  title: string;
  meals: string;
  content: string;
}

export interface TrackingStep {
  status: string;
  at: string;
  by: string;
  note: string;
}

export interface Booking {
  id: number;
  tourId: number;
  tourName: string;
  userId: number;
  username: string;
  quantity: number;
  status: string;
  bookingDate: string;
  tracking: TrackingStep[];
  checkout?: Checkout;
}

export interface Checkout {
  id: number;
  bookingId?: number;
  amount: number;
  status: string;
  paymentMethod?: string;
  transactionRef?: string;
}

// F2: khớp TourDetailDto BE (detail + images + prices hiệu lực).
export interface TourImage {
  id: number;
  imageUrl: string;
  caption: string;
  sortOrder: number;
}

export interface TourPrice {
  id: number;
  sourceName: string;
  priceValue: number;
  effectiveDate: string;
}

// F1b: khớp DTO Auth BE + lỗi chuẩn { error, message }.
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  error: string;
  message: string;
}

// C07/A5: khớp AdminStatsDto BE.
export interface AdminStats {
  usersTotal: number;
  toursTotal: number;
  bookingsTotal: number;
  revenuePaid: number;
  bookingsByStatus: Record<string, number>;
  topTours: { tourId: number; tourName: string; sold: number }[];
}

// B2: khớp AuditLogDto BE.
export interface AuditLog {
  id: number;
  actorId: number | null;
  actorUsername: string;
  action: string;
  entityType: string;
  entityId: number;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

// Khớp SupportRequestDto BE (public gửi, admin xử lý New -> InProgress -> Resolved).
export interface SupportRequest {
  id: number;
  userId: number | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  adminNote: string | null;
  handledBy: number | null;
  handledAt: string | null;
  createdAt: string;
}
