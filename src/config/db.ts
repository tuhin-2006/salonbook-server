import mongoose from "mongoose";
import { ENV } from "./env";

export const connectDB = async (): Promise<void> => {
  try {
    if (ENV.DATABASE_URL.includes("<username>") || !ENV.DATABASE_URL) {
      console.warn(
        "[Database] Notice: DATABASE_URL is using placeholder credentials in .env. Please update with your real MongoDB Atlas connection string when ready."
      );
      return;
    }
    const conn = await mongoose.connect(ENV.DATABASE_URL);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("[Database] Error connecting to MongoDB:", error);
    if (ENV.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};
