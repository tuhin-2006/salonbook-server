import mongoose from "mongoose";
import { ENV } from "./env";

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    if (ENV.DATABASE_URL.includes("<username>") || !ENV.DATABASE_URL) {
      console.warn(
        "[Database] Notice: DATABASE_URL is using placeholder credentials. Please update with your real MongoDB Atlas connection string."
      );
      return;
    }
    const conn = await mongoose.connect(ENV.DATABASE_URL);
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("[Database] Error connecting to MongoDB:", error);
    // In serverless, do not hard-exit the process
  }
};
