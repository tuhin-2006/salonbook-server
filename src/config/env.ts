import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || "5000",
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL:
    process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/salonbook",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  JWT_SECRET: process.env.JWT_SECRET || "salonbook_jwt_secret_dev_key_change_me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  BETTER_AUTH_SECRET:
    process.env.BETTER_AUTH_SECRET || "salonbook_better_auth_dev_secret_key_32chars",
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  STRIPE_CURRENCY: process.env.STRIPE_CURRENCY || "usd",
  IMGBB_API_KEY: process.env.IMGBB_API_KEY || "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
};
