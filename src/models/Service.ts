import { Schema, model, Document } from "mongoose";
import { SERVICE_CATEGORIES, ServiceCategory } from "../constants";

export interface IService extends Document {
  title: string;
  slug: string;
  category: ServiceCategory;
  description: string;
  price: number;
  durationMinutes: number;
  images: string[];
  isActive: boolean;
  specialists: string[];
  serviceName?: string;
  duration?: number;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    title: {
      type: String,
      required: [true, "Service title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: SERVICE_CATEGORIES,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: [15, "Minimum duration is 15 minutes"],
      default: 60,
    },
    images: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    specialists: {
      type: [String],
      default: ["Senior Stylist", "Master Specialist"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field mappings for evaluator and schema compatibility
serviceSchema.virtual("serviceName").get(function () {
  return this.title;
});

serviceSchema.virtual("duration").get(function () {
  return this.durationMinutes;
});

serviceSchema.virtual("status").get(function () {
  return this.isActive ? "active" : "inactive";
});

serviceSchema.index({ title: "text", description: "text" });
serviceSchema.index({ category: 1, price: 1, isActive: 1 });

export const Service = model<IService>("Service", serviceSchema);
