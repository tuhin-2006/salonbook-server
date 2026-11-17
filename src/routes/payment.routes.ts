import { Router } from "express";
import {
  getMyTransactions,
  getAllTransactions,
} from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/rbac";

const router = Router();

router.get("/my-transactions", authenticate, getMyTransactions);
router.get("/transactions", authenticate, requireAdmin, getAllTransactions);

export default router;
