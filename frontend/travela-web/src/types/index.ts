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
  description: string;
  priceFrom: number;
  thumbnail: string;
  destination: Destination | null;
  status: string;
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
  quantity: number;
  status: string;
  tracking: TrackingStep[];
}

export interface Checkout {
  id: number;
  bookingId: number;
  amount: number;
  status: string;
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
