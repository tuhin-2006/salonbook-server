import { Schema, model, Document, Types } from "mongoose";
import { APPOINTMENT_STATUS, AppointmentStatus, PAYMENT_STATUS, PaymentStatus } from "../constants";

export interface IAppointment extends Document {
  customerId: Types.ObjectId;
  serviceId: Types.ObjectId;
  appointmentDate: Date;
  date?: Date;
  timeSlot: string;
  servicePrice: number;
  price?: number;
  paymentStatus: PaymentStatus;
  status: AppointmentStatus;
  transactionId?: Types.ObjectId;
  notes?: string;
  message?: string;
  cancelledAt?: Date;
  stripeSessionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
      index: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Service ID is required"],
      index: true,
    },
    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
      index: true,
    },
    timeSlot: {
      type: String,
      required: [true, "Time slot is required"],
      trim: true,
    },
    servicePrice: {
      type: Number,
      required: [true, "Service price is required"],
      min: [0, "Service price cannot be negative"],
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.UNPAID,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.PENDING,
      index: true,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    cancelledAt: {
      type: Date,
    },
    stripeSessionId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field mappings for frontend compatibility
appointmentSchema.virtual("price").get(function () {
  if (this.servicePrice && this.servicePrice > 0) return this.servicePrice;
  if (this.serviceId && typeof this.serviceId === "object" && (this.serviceId as any).price > 0) {
    return (this.serviceId as any).price;
  }
  return this.servicePrice || 0;
});

appointmentSchema.virtual("date").get(function () {
  return this.appointmentDate;
});

appointmentSchema.virtual("message")
  .get(function () {
    return this.notes;
  })
  .set(function (val: string) {
    this.notes = val;
  });

// Prevent double bookings on active (pending/confirmed) slots
appointmentSchema.index(
  { serviceId: 1, appointmentDate: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
    },
  }
);

export const Appointment = model<IAppointment>(
  "Appointment",
  appointmentSchema,
  "appointments"
);
