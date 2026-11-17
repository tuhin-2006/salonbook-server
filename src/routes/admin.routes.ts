import { Router } from "express";
import {
  getAnalytics,
  getUsers,
  blockUser,
  unblockUser,
} from "../controllers/admin.controller";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/rbac";

const router = Router();

// Apply auth and admin check to all admin routes
router.use(authenticate, requireAdmin);

router.get("/analytics", getAnalytics);
router.get("/users", getUsers);
router.patch("/users/:id/block", blockUser);
router.patch("/users/:id/unblock", unblockUser);

export default router;
