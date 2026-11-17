import { Router } from "express";
import {
  getServices,
  getFeaturedServices,
  getCategories,
  getServiceById,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
} from "../controllers/service.controller";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/rbac";
import { validateRequest } from "../middlewares/validate";
import {
  createServiceSchema,
  updateServiceSchema,
} from "../validators/service.validator";

const router = Router();

// Public routes
router.get("/", getServices);
router.get("/featured", getFeaturedServices);
router.get("/categories", getCategories);
router.get("/:id", getServiceById);

// Admin-protected routes
router.post(
  "/",
  authenticate,
  requireAdmin,
  validateRequest(createServiceSchema),
  createService
);
router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  validateRequest(updateServiceSchema),
  updateService
);
router.delete("/:id", authenticate, requireAdmin, deleteService);
router.patch("/:id/toggle-status", authenticate, requireAdmin, toggleServiceStatus);

export default router;
