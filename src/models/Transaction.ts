import { Schema, model, Document, Types } from "mongoose";
import { TRANSACTION_STATUS, TransactionStatus } from "../constants";

export interface ITransaction extends Document {
  customerId: Types.ObjectId;
  appointmentId: Types.ObjectId;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  invoiceNumber?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment ID is required"],
      index: true,
    },
    stripeSessionId: {
      type: String,
      required: [true, "Stripe session ID is required"],
      unique: true,
      trim: true,
    },
    stripePaymentIntentId: {
      type: String,
      trim: true,
      default: "",
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: function () {
        return `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      },
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "usd",
      lowercase: true,
    },
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.PENDING,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

transactionSchema.virtual("isPaid").get(function () {
  return (
    this.status === TRANSACTION_STATUS.PAID ||
    this.status === TRANSACTION_STATUS.SUCCEEDED
  );
});

export const Transaction = model<ITransaction>(
  "Transaction",
  transactionSchema,
  "transactions"
);
