import { Router } from "express";
import {
  getAnalytics,
  getUsers,
  getUserById,
  blockUser,
  unblockUser,
  updateUserRole,
} from "../controllers/admin.controller";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/rbac";

const router = Router();

// Apply auth and admin check to all admin routes
router.use(authenticate, requireAdmin);

router.get("/analytics", getAnalytics);
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/block", blockUser);
router.patch("/users/:id/unblock", unblockUser);
router.patch("/users/:id/role", updateUserRole);

export default router;
