import mongoose from "mongoose";
import { ENV } from "./env";

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(ENV.DATABASE_URL);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("[Database] Error connecting to MongoDB:", error);
    if (ENV.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};
