export const USER_ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
} as const;

export type AppointmentStatus =
  (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

export const TRANSACTION_STATUS = {
  PENDING: "pending",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export type TransactionStatus =
  (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];

export const SERVICE_CATEGORIES = [
  "Hair Styling & Cut",
  "Facial & Skincare",
  "Nails & Manicure",
  "Massage & Body Spa",
  "Bridal & Makeup",
  "Men's Grooming",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
