import { Router } from "express";
import multer from "multer";
import {
  getServices,
  getFeaturedServices,
  getCategories,
  getServiceById,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
  uploadServiceImage,
} from "../controllers/service.controller";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/rbac";
import { validateRequest } from "../middlewares/validate";
import {
  createServiceSchema,
  updateServiceSchema,
} from "../validators/service.validator";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const router = Router();

// Public routes
router.get("/", getServices);
router.get("/featured", getFeaturedServices);
router.get("/categories", getCategories);
router.get("/:id", getServiceById);

// Admin-protected routes
router.post(
  "/upload-image",
  authenticate,
  requireAdmin,
  upload.single("image"),
  uploadServiceImage
);
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
