import { z } from "zod";

export const bookAppointmentSchema = z.object({
  body: z.object({
    serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid service ID"),
    appointmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid appointment date format",
    }),
    timeSlot: z.string().min(1, "Time slot is required"),
    notes: z.string().max(500).optional(),
    message: z.string().max(500).optional(),
  }),
});

export const checkAvailabilitySchema = z.object({
  query: z.object({
    serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid service ID"),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format (expected YYYY-MM-DD)",
    }),
  }),
});
