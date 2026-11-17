import { Schema, model, Document, Types } from "mongoose";
import { APPOINTMENT_STATUS, AppointmentStatus } from "../constants";

export interface IAppointment extends Document {
  customerId: Types.ObjectId;
  serviceId: Types.ObjectId;
  appointmentDate: Date;
  timeSlot: string;
  status: AppointmentStatus;
  transactionId?: Types.ObjectId;
  notes?: string;
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
  }
);

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
  appointmentSchema
);
