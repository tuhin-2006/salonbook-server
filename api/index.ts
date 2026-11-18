import { createApp } from "../src/app";
import { connectDB } from "../src/config/db";

let cachedApp: any = null;

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
    if (!cachedApp) {
      cachedApp = createApp();
    }
    return cachedApp(req, res);
  } catch (error) {
    console.error("Vercel Serverless Function Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error in Vercel Function",
      error: (error as Error).message,
    });
  }
}
