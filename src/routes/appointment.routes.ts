import { Router } from "express";
import {
  checkAvailability,
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getAllAppointments,
  updateAppointmentStatus,
} from "../controllers/appointment.controller";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/rbac";
import { validateRequest } from "../middlewares/validate";
import {
  bookAppointmentSchema,
  checkAvailabilitySchema,
} from "../validators/appointment.validator";

const router = Router();

// Availability check (Public/Protected)
router.get(
  "/availability",
  validateRequest(checkAvailabilitySchema),
  checkAvailability
);

// Customer protected routes
router.post(
  "/book",
  authenticate,
  validateRequest(bookAppointmentSchema),
  bookAppointment
);
router.get("/my", authenticate, getMyAppointments);
router.patch("/:id/cancel", authenticate, cancelAppointment);

// Admin-only appointment routes
router.get("/", authenticate, requireAdmin, getAllAppointments);
router.patch("/:id/status", authenticate, requireAdmin, updateAppointmentStatus);

export default router;
