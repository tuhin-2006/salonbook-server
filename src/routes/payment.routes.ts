import { Router } from "express";
import {
  getMyTransactions,
  getAllTransactions,
  createAppointmentCheckoutSession,
  simulateDevPayment,
} from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/rbac";

const router = Router();

router.post(
  "/create-checkout-session",
  authenticate,
  createAppointmentCheckoutSession
);
router.post("/simulate-dev-payment", authenticate, simulateDevPayment);
router.get("/my-transactions", authenticate, getMyTransactions);
router.get("/transactions", authenticate, requireAdmin, getAllTransactions);

export default router;
