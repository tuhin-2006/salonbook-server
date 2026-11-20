import { z } from "zod";
import { SERVICE_CATEGORIES } from "../constants";

export const createServiceSchema = z.object({
  body: z
    .object({
      title: z.string().min(3, "Title must be at least 3 characters").max(150).optional(),
      serviceName: z.string().min(3).max(150).optional(),
      category: z.enum(SERVICE_CATEGORIES as unknown as [string, ...string[]]),
      description: z.string().min(10, "Description must be at least 10 characters"),
      price: z.number().positive("Price must be a positive number greater than 0"),
      durationMinutes: z.number().positive("Duration must be a positive number greater than 0").optional(),
      duration: z.number().positive("Duration must be a positive number greater than 0").optional(),
      images: z.array(z.string().url("Must be valid image URL")).optional().default([]),
      image: z.string().url().optional(),
      specialists: z.array(z.string()).optional().default(["Senior Specialist"]),
      isActive: z.boolean().optional().default(true),
      status: z.enum(["active", "inactive"]).optional(),
    })
    .refine((data) => data.title || data.serviceName, {
      message: "Service title or serviceName is required (at least 3 characters)",
    }),
});

export const updateServiceSchema = z.object({
  params: z
    .object({
      id: z.string().optional(),
    })
    .optional(),
  body: z.object({
    title: z.string().min(3).max(150).optional(),
    serviceName: z.string().min(3).max(150).optional(),
    category: z.enum(SERVICE_CATEGORIES as unknown as [string, ...string[]]).optional(),
    description: z.string().min(10).optional(),
    price: z.number().positive("Price must be a positive number greater than 0").optional(),
    durationMinutes: z.number().positive("Duration must be a positive number greater than 0").optional(),
    duration: z.number().positive().optional(),
    images: z.array(z.string().url()).optional(),
    image: z.string().url().optional(),
    specialists: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }),
});
