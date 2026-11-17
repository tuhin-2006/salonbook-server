import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { ENV } from "./config/env";
import apiRoutes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { globalLimiter } from "./middlewares/rateLimiter";
import { handleStripeWebhook } from "./controllers/payment.controller";

export const createApp = (): Application => {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  app.use(
    cors({
      origin: [
        ENV.CLIENT_URL,
        "http://localhost:3000",
        "https://salonbook.vercel.app",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // HTTP Request Logging
  if (ENV.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  // 1. Stripe Webhook Raw Body Handler (Must be mounted before express.json)
  app.post(
    "/api/v1/payments/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
  );

  // 2. Body Parsers for standard REST requests
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // 3. Global Rate Limiter
  app.use("/api", globalLimiter);

  // 4. API Routes
  app.use("/api/v1", apiRoutes);

  // 5. 404 Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      statusCode: 404,
      message: "The requested API endpoint was not found.",
    });
  });

  // 6. Centralized Error Handler
  app.use(errorHandler);

  return app;
};
