import { Router } from "express";
import multer from "multer";
import {
  register,
  login,
  getMe,
  updateProfile,
  uploadAvatar,
} from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validate";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from "../validators/auth.validator";
import { authenticate } from "../middlewares/auth";
import { authLimiter } from "../middlewares/rateLimiter";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const router = Router();

router.post("/register", authLimiter, validateRequest(registerSchema), register);
router.post("/login", authLimiter, validateRequest(loginSchema), login);
router.get("/me", authenticate, getMe);
router.patch(
  "/profile",
  authenticate,
  validateRequest(updateProfileSchema),
  updateProfile
);
router.post("/upload-avatar", authenticate, upload.single("image"), uploadAvatar);

export default router;
