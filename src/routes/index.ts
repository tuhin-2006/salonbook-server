import { Router } from "express";
import authRoutes from "./auth.routes";
import serviceRoutes from "./service.routes";
import appointmentRoutes from "./appointment.routes";
import paymentRoutes from "./payment.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "SalonBook API",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/services", serviceRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin", adminRoutes);

export default router;
