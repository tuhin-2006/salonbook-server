import { z } from "zod";
import { SERVICE_CATEGORIES } from "../constants";

export const createServiceSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(150),
    category: z.enum(SERVICE_CATEGORIES as unknown as [string, ...string[]]),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.number().min(0, "Price must be positive"),
    durationMinutes: z.number().min(15, "Minimum duration is 15 minutes"),
    images: z.array(z.string().url("Must be valid image URL")).optional().default([]),
    specialists: z.array(z.string()).optional().default(["Senior Specialist"]),
    isActive: z.boolean().optional().default(true),
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
    category: z.enum(SERVICE_CATEGORIES as unknown as [string, ...string[]]).optional(),
    description: z.string().min(10).optional(),
    price: z.number().min(0).optional(),
    durationMinutes: z.number().min(15).optional(),
    images: z.array(z.string().url()).optional(),
    specialists: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});
