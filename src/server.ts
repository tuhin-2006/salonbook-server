import { createApp } from "./app";
import { connectDB } from "./config/db";
import { ENV } from "./config/env";

const startServer = async (): Promise<void> => {
  await connectDB();

  const app = createApp();

  const server = app.listen(ENV.PORT, () => {
    console.log(
      `[SalonBook Server] Running in ${ENV.NODE_ENV} mode on http://localhost:${ENV.PORT}`
    );
    console.log(`[SalonBook Server] API health at http://localhost:${ENV.PORT}/api/v1/health`);
  });

  const handleShutdown = (signal: string) => {
    console.log(`[SalonBook Server] Received ${signal}. Gracefully shutting down...`);
    server.close(() => {
      console.log("[SalonBook Server] HTTP server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
};

startServer().catch((error) => {
  console.error("[SalonBook Server] Fatal startup failure:", error);
  process.exit(1);
});
