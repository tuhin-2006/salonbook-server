import { Router } from "express";
import {
  getMyTransactions,
  getAllTransactions,
  createAppointmentCheckoutSession,
  verifyCheckoutSession,
  simulateDevPayment,
  deleteTransaction,
} from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/rbac";

const router = Router();

router.post(
  "/create-checkout-session",
  authenticate,
  createAppointmentCheckoutSession
);
router.post("/verify-checkout-session", verifyCheckoutSession);
router.post("/simulate-dev-payment", authenticate, simulateDevPayment);
router.get("/my-transactions", authenticate, getMyTransactions);
router.get("/transactions", authenticate, requireAdmin, getAllTransactions);
router.delete("/transactions/:id", authenticate, requireAdmin, deleteTransaction);

export default router;
